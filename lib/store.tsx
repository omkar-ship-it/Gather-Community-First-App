"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COMMUNITIES, FITS, GROUPS, PEOPLE, makeEvents, makePosts, makeThreads, uid, type Community, type Event, type Group, type Me, type Msg, type Person, type Post } from "./data";
import { kindOf, type Kind } from "./ids";

export type Screen =
  | { t: "community"; id: string; tab?: "feed" | "groups" | "members" | "events" }
  | { t: "chat"; thread: string; draft?: string }
  | { t: "person"; id: string }
  | { t: "event"; id: string }
  | { t: "room"; id: string }
  | { t: "me" };
export type Sheet =
  | { t: "plus" }
  | { t: "post"; communityId?: string }
  | { t: "host"; communityId?: string }
  | { t: "pay"; eventId: string }
  | { t: "split" }
  | { t: "comments"; postId: string }
  | { t: "key"; kind: Kind; id: string };
export type Tab = "communities" | "messages" | "events";
export type Target = { kind: Kind; id: string };

type State = {
  me: Me | null;
  /** Where someone was headed before they had an account. They land there, never on a blank home. */
  pending: Target | null;
  auth: "welcome" | "contact" | "code" | "profile" | "reveal" | null;
  dial: boolean;
  /** Digits the pad opens with: an invite link or a scanned QR. */
  dialWith: string;
  /** Communities waiting on a host's yes. */
  asked: string[];
  tab: Tab;
  stack: Screen[];
  sheet: Sheet | null;
  toast: string | null;
  communities: Community[];
  groups: Group[];
  posts: Post[];
  events: Event[];
  threads: Record<string, Msg[]>;
  unread: Record<string, number>;
  typing: Record<string, string | null>;
  saved: string[];
};

const SAMPLE_ME: Me = { id: "48291044", name: "Omkar", headline: "Building something new", intents: ["Raising seed", "Building with AI", "New in town"], hue: 300 };

function fresh(): State {
  const now = Date.now();
  const link = (new URLSearchParams(window.location.search).get("id") ?? "").replace(/\D/g, "").slice(0, 8);
  return {
    me: null, pending: null, auth: "welcome", dial: link.length > 0, dialWith: link, asked: [], tab: "communities", stack: [], sheet: null, toast: null,
    communities: COMMUNITIES, groups: GROUPS, posts: makePosts(now), events: makeEvents(now), threads: makeThreads(now),
    unread: { "g:742117": 3, "g:731806": 1, "g:763028": 2, "d:31904472": 1 }, typing: {}, saved: ["36025841"],
  };
}

const REPLIES: Record<string, string[]> = {
  dm: ["Yes, let's. Are you around this evening?", "Ha, exactly what I was thinking.", "Send it over, I'll read it tonight.", "I'm near the lake on Sunday if that's easier."],
  group: ["Good question. Following this.", "I can help with that.", "Same here, honestly.", "Adding this to the agenda."],
  room: ["Come say hi, I'm near the window.", "Best room of the month.", "Who asked that last question? Brilliant.", "Saving your ID before this closes."],
};

function useStoreValue() {
  const [s, set] = useState<State>(fresh);
  const timers = useRef<number[]>([]);
  useEffect(() => { const t = timers.current; return () => t.forEach((x) => window.clearTimeout(x)); }, []);
  const later = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  const patch = useCallback((f: (s: State) => Partial<State>) => set((x) => ({ ...x, ...f(x) })), []);

  const act = useMemo(() => {
    const say = (toast: string) => { patch(() => ({ toast })); later(2400, () => patch((x) => (x.toast === toast ? { toast: null } : {}))); };
    const push = (sc: Screen) => patch((x) => ({ stack: [...x.stack, sc], sheet: null, dial: false, unread: sc.t === "chat" ? { ...x.unread, [sc.thread]: 0 } : x.unread }));
    const addMsg = (thread: string, by: string, text: string, kind?: "note") =>
      patch((x) => ({ threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by, text, at: Date.now(), kind }] } }));
    const responder = (thread: string, x: State) => {
      if (thread.startsWith("d:")) return thread.slice(2);
      if (thread.startsWith("r:")) { const e = x.events.find((v) => v.id === thread.slice(2)); return e?.going[Math.floor(Math.random() * e.going.length)] ?? null; }
      const g = x.groups.find((v) => v.id === thread.slice(2)); const c = x.communities.find((v) => v.id === g?.communityId);
      return c?.members[Math.floor(Math.random() * c.members.length)] ?? null;
    };
    /** Open whatever an ID points to, joining on the way. */
    const enter = (t: Target, via?: State["me"]) => {
      patch((x) => {
        const me = via ?? x.me;
        if (!me) return { pending: t, auth: "contact", dial: false };
        const base = { dial: false, dialWith: "", sheet: null, pending: null };
        if (t.kind === "person") return { ...base, stack: [{ t: "person", id: t.id } as Screen] };
        if (t.kind === "community") {
          const c = x.communities.find((v) => v.id === t.id)!;
          if (!c.open && !c.joined) return { ...base, tab: "communities" as Tab, stack: [], asked: [...x.asked.filter((v) => v !== t.id), t.id] };
          return { ...base, tab: "communities", communities: x.communities.map((v) => (v.id === t.id && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), stack: [{ t: "community", id: t.id } as Screen], toast: c.joined ? null : `You're in ${c.name}` };
        }
        if (t.kind === "group") {
          const g = x.groups.find((v) => v.id === t.id)!;
          return { ...base, tab: "communities", communities: x.communities.map((v) => (v.id === g.communityId && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), stack: [{ t: "community", id: g.communityId, tab: "groups" } as Screen, { t: "chat", thread: `g:${t.id}` } as Screen] };
        }
        const e = x.events.find((v) => v.room === t.id)!;
        return { ...base, events: x.events.map((v) => (v.id === e.id ? { ...v, ticket: v.price ? v.ticket : true } : v)), stack: [{ t: e.startsAt <= Date.now() && !e.dissolved && (!e.price || e.ticket) ? "room" : "event", id: e.id } as Screen] };
      });
      later(2400, () => patch((x) => (x.toast?.startsWith("You're in") ? { toast: null } : {})));
      // A host says yes a few seconds later, so the wait can be felt too.
      later(6000, () => patch((x) => (x.asked.includes(t.id) ? { asked: x.asked.filter((v) => v !== t.id), communities: x.communities.map((v) => (v.id === t.id ? { ...v, joined: true, size: v.size + 1 } : v)), toast: `You're in ${x.communities.find((v) => v.id === t.id)?.name}` } : {})));
      later(8600, () => patch((x) => (x.toast?.startsWith("You're in") ? { toast: null } : {})));
    };
    return {
      say, push, enter, addMsg,
      pop: () => patch((x) => ({ stack: x.stack.slice(0, -1) })),
      tab: (tab: Tab) => patch(() => ({ tab, stack: [], sheet: null })),
      sheet: (sheet: Sheet | null) => patch(() => ({ sheet })),
      dial: (dial: boolean) => patch(() => ({ dial, dialWith: "", sheet: null })),
      auth: (auth: State["auth"]) => patch(() => ({ auth })),
      lived: () => patch(() => ({ ...fresh(), dial: false, dialWith: "", me: SAMPLE_ME, auth: null, events: makeEvents(Date.now()).map((e) => (e.id === "e1" ? { ...e, ticket: true } : e)) })),
      restart: () => set({ ...fresh(), dial: false, dialWith: "" }),
      signUp: (name: string, intents: string[]) => patch((x) => ({
        me: { ...SAMPLE_ME, name, intents, headline: intents[0] ?? "New to Gather" }, auth: "reveal",
        communities: x.communities.map((c) => ({ ...c, joined: false })), unread: {}, saved: [],
        threads: Object.fromEntries(Object.entries(x.threads).filter(([k]) => !k.startsWith("d:"))),
      })),
      send: (thread: string, text: string) => {
        addMsg(thread, "me", text);
        later(900, () => patch((x) => { const who = responder(thread, x); return { typing: { ...x.typing, [thread]: who } }; }));
        later(2500, () => patch((x) => {
          const who = x.typing[thread];
          if (!who || (thread.startsWith("r:") && x.events.find((e) => `r:${e.id}` === thread)?.dissolved)) return { typing: { ...x.typing, [thread]: null } };
          const pool = REPLIES[thread.startsWith("d:") ? "dm" : thread.startsWith("r:") ? "room" : "group"];
          const n = (x.threads[thread] ?? []).filter((v) => v.by === "me").length;
          return { typing: { ...x.typing, [thread]: null }, threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by: who, text: pool[(n - 1) % pool.length], at: Date.now() }] } };
        }));
      },
      like: (id: string) => patch((x) => ({ posts: x.posts.map((v) => (v.id === id ? { ...v, liked: !v.liked, likes: v.likes + (v.liked ? -1 : 1) } : v)) })),
      vote: (id: string, i: number) => patch((x) => ({ posts: x.posts.map((v) => (v.id === id && v.poll && v.poll.voted === null ? { ...v, poll: { ...v.poll, voted: i, options: v.poll.options.map((o, j) => (j === i ? { ...o, votes: o.votes + 1 } : o)) } } : v)) })),
      comment: (id: string, text: string) => patch((x) => ({ posts: x.posts.map((v) => (v.id === id ? { ...v, comments: [...v.comments, { by: "me", text }] } : v)) })),
      post: (communityId: string, text: string) => patch((x) => ({ posts: [{ id: uid(), communityId, by: "me", at: Date.now(), text, likes: 0, liked: false, comments: [] }, ...x.posts], sheet: null, stack: [{ t: "community", id: communityId, tab: "feed" }] })),
      host: (communityId: string, title: string, place: string, price: number, inHours: number) => patch((x) => {
        const d = new Date(Date.now() + inHours * 3_600_000);
        d.setHours(19, 0, 0, 0);
        const startsAt = d.getTime();
        const room = `9${String(10000 + ((x.events.length * 7919 + title.length * 131) % 89999)).padStart(5, "0")}`;
        const ev: Event = { id: uid(), communityId, title, blurb: "Hosted by you.", place, startsAt, endsAt: startsAt + 2 * 3_600_000, price, room, host: "me", going: [], seats: 20, ticket: true, dissolved: false };
        return { events: [...x.events, ev], sheet: null, stack: [...x.stack.filter((v) => v.t === "community"), { t: "event", id: ev.id }] };
      }),
      ticket: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, ticket: true } : e)) })),
      joinCommunity: (id: string) => patch((x) => ({ communities: x.communities.map((c) => (c.id === id && !c.joined ? { ...c, joined: true, size: c.size + 1 } : c)) })),
      save: (id: string) => patch((x) => ({ saved: x.saved.includes(id) ? x.saved.filter((v) => v !== id) : [...x.saved, id] })),
      hurry: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, endsAt: Date.now() + 12_000 } : e)) })),
      dissolve: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, dissolved: true } : e)) })),
    };
  }, [later, patch]);

  // Life going on elsewhere: a message lands now and then, and home re-sorts itself.
  const alive = Boolean(s.me) && s.auth === null;
  useEffect(() => {
    if (!alive) return;
    const lines: [string, string, string][] = [["g:763028", "36025841", "I'm in for the short one"], ["g:779215", "38260415", "Buns: three left"], ["g:731806", "31904472", "Terms sheet glossary is in the files"], ["g:742117", "25518306", "Two reviews done, one slot left"]];
    const ids = lines.map(([thread, by, text], i) => window.setTimeout(() => patch((x) => {
      const g = x.groups.find((v) => `g:${v.id}` === thread);
      if (!x.communities.find((c) => c.id === g?.communityId)?.joined) return {};
      const top = x.stack[x.stack.length - 1];
      const open = top?.t === "chat" && top.thread === thread;
      return { threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by, text, at: Date.now() }] }, unread: { ...x.unread, [thread]: open ? 0 : (x.unread[thread] ?? 0) + 1 } };
    }), 7000 + i * 16000));
    return () => ids.forEach((x) => window.clearTimeout(x));
  }, [alive, patch]);

  return { s, act };
}

type Value = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Value | null>(null);
export function Store({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside Store");
  return v;
}

/** A clock for countdowns. */
export function useNow(every = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), every); return () => window.clearInterval(id); }, [every]);
  return now;
}

// ------------------------------------------------------------ lookups
export const person = (id: string): Person | null => PEOPLE.find((x) => x.id === id) ?? null;

export function resolve(s: State, digits: string): Target | null {
  const kind = kindOf(digits);
  if (!kind) return null;
  const ok =
    kind === "person" ? Boolean(person(digits)) : kind === "community" ? s.communities.some((c) => c.id === digits) : kind === "group" ? s.groups.some((g) => g.id === digits) : s.events.some((e) => e.room === digits && !e.dissolved);
  return ok ? { kind, id: digits } : null;
}

/** Why two people should talk: the fit between what they want, and what they already share. */
export function overlap(s: State, p: Person) {
  const n = p.name.split(" ")[0];
  const fit = FITS.find((f) => s.me?.intents.includes(f.mine) && p.intents.includes(f.theirs)) ?? null;
  const communities = s.communities.filter((c) => c.joined && c.members.includes(p.id));
  const events = s.events.filter((e) => e.ticket && e.going.includes(p.id));
  const e0 = events[0];
  const at = e0 && (e0.dissolved ? " were both at" : e0.startsAt <= Date.now() ? "'re both at" : "'re both going to");
  const line = fit?.line(n) ?? (e0 ? `You${at} ${e0.title.split(":")[0]}.` : communities[0] ? `You're both in ${communities[0].name}.` : null);
  const open = fit?.open(n) ?? (communities[0] ? `Hi ${n}, we're both in ${communities[0].name}. ` : `Hi ${n}, `);
  return { line, open, communities, events, fits: Boolean(fit) };
}

/** A community's latest message across its groups, for sorting home. */
export function latest(s: State, c: Community) {
  let best: { group: Group; msg: Msg } | null = null;
  let unread = 0;
  for (const g of s.groups.filter((x) => x.communityId === c.id)) {
    unread += s.unread[`g:${g.id}`] ?? 0;
    const msg = (s.threads[`g:${g.id}`] ?? []).at(-1);
    if (msg && (!best || msg.at > best.msg.at)) best = { group: g, msg };
  }
  return { best, unread };
}

/** The link and QR behind every key: opens straight onto what the ID is. */
export const linkTo = (digits: string) => `${window.location.origin}/?id=${digits}`;

export const ago = (at: number, now: number) => {
  const m = Math.floor((now - at) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};
export const left = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
export const when = (at: number) => new Date(at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
