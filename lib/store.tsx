"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COMMUNITIES, FITS, GROUPS, PEOPLE, makeEvents, makePosts, makeThreads, uid, type Community, type Event, type Group, type Me, type Msg, type Person, type Post } from "./data";
import type { Offer } from "./numbers";
import { checks, pretty, specOf, type Kind } from "./ids";

export type CommunityTab = "home" | "feed" | "members" | "events";
export type Screen =
  | { t: "community"; id: string; tab?: CommunityTab }
  | { t: "channel"; id: string }
  | { t: "chat"; thread: string; draft?: string; tab?: "chat" | "feed" | "people" }
  | { t: "person"; id: string }
  | { t: "event"; id: string }
  | { t: "room"; id: string }
  | { t: "me" };
export type Sheet =
  | { t: "plus" }
  | { t: "post"; communityId?: string; groupId?: string; announce?: boolean }
  | { t: "peek"; kind: "community" | "group"; id: string }
  | { t: "group"; id: string }
  | { t: "newgroup"; communityId: string }
  | { t: "host"; communityId?: string }
  | { t: "pay"; eventId: string }
  | { t: "split" }
  | { t: "comments"; postId: string }
  | { t: "key"; kind: Kind; id: string }
  | { t: "link"; what: "mobile" | "email" };
export type Tab = "communities" | "messages" | "events";
/** `id` is the internal id of whatever the number reached. */
export type Target = { kind: Kind; id: string };

type State = {
  me: Me | null;
  /** Where someone was headed before they had an account. They land there, never on a blank home. */
  pending: Target | null;
  auth: "welcome" | "contact" | "code" | "pick" | "profile" | "reveal" | null;
  dial: boolean;
  /** Digits the pad opens with: an invite link or a scanned QR. */
  dialWith: string;
  /** What an invite link points at. */
  arrive: Target | null;
  /** PINs opened by communities and groups: a door, for an hour. */
  doors: Record<string, { to: Target; until: number }>;
  /** Mobile and email given at sign-up. */
  contact: { mobile: string; email: string };
  /** The number someone picked, kept off the shelf while they finish signing up. */
  held: (Offer & { until: number }) | null;
  /** The last one they let go of, kept in reach. */
  lapsed: Offer | null;
  /** A community just joined: the arrival plays before anything else. */
  arrival: { id: string; groupId?: string } | null;
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
  /** Strangers who wrote first, waiting for a yes. */
  requests: string[];
};

const SAMPLE_ME: Me = { id: "48291044076", zone: "Bengaluru", mobile: "9876543210", email: "omkar@example.com", emailOk: true, name: "Omkar", headline: "Building something new", intents: ["Raising seed", "Building with AI", "New in town"], hue: 300 };

function fresh(): State {
  const now = Date.now();
  const link = (new URLSearchParams(window.location.search).get("id") ?? "").replace(/\D/g, "").slice(0, 12);
  const ev = new URLSearchParams(window.location.search).get("e");
  const arrive: Target | null = ev && makeEvents(now).some((e) => e.id === ev) ? { kind: "room", id: ev } : null;
  return {
    me: null, pending: null, auth: "welcome", dial: link.length > 0 || Boolean(arrive), dialWith: link, arrive, doors: {}, contact: { mobile: "", email: "" }, held: null, lapsed: null, arrival: null, asked: [], tab: "communities", stack: [], sheet: null, toast: null,
    communities: COMMUNITIES, groups: GROUPS, posts: makePosts(now), events: makeEvents(now), threads: makeThreads(now),
    unread: { "g:742117308": 3, "g:731806124": 1, "g:763028052": 2, "d:31904472311": 1, "a:680421907": 1, "a:618402755": 1 }, typing: {}, saved: ["36025841840"], requests: ["33841506796"],
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
    const push = (sc: Screen) => patch((x) => ({ stack: [...x.stack, sc], sheet: null, dial: false, unread: sc.t === "chat" ? { ...x.unread, [sc.thread]: 0 } : sc.t === "channel" ? { ...x.unread, [`a:${sc.id}`]: 0 } : x.unread }));
    const addMsg = (thread: string, by: string, text: string, kind?: "note") =>
      patch((x) => ({ threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by, text, at: Date.now(), kind }] } }));
    const responder = (thread: string, x: State) => {
      if (thread.startsWith("d:")) return thread.slice(2);
      if (thread.startsWith("r:")) { const e = x.events.find((v) => v.id === thread.slice(2)); return e?.going[Math.floor(Math.random() * e.going.length)] ?? null; }
      const g = x.groups.find((v) => v.id === thread.slice(2)); return g?.members[Math.floor(Math.random() * g.members.length)] ?? null;
    };
    /** Open whatever an ID points to, joining on the way. */
    const enter = (t: Target, via?: State["me"]) => {
      const hello = { now: false };
      patch((x) => {
        const me = via ?? x.me;
        if (!me) return { pending: t, auth: "contact", dial: false };
        const base = { dial: false, dialWith: "", arrive: null, sheet: null, pending: null };
        if (t.kind === "person") return { ...base, stack: [{ t: "person", id: t.id } as Screen] };
        if (t.kind === "community") {
          const c = x.communities.find((v) => v.id === t.id)!;
          if (!c.open && !c.joined) return { ...base, tab: "communities" as Tab, stack: [], asked: [...x.asked.filter((v) => v !== t.id), t.id] };
          return { ...base, tab: "communities", communities: x.communities.map((v) => (v.id === t.id && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), stack: [{ t: "community", id: t.id } as Screen], arrival: c.joined ? null : { id: t.id } };
        }
        if (t.kind === "group") {
          const g = x.groups.find((v) => v.id === t.id)!;
const c = x.communities.find((v) => v.id === g.communityId)!;
          if (!c.joined && !c.open) return { ...base, tab: "communities" as Tab, stack: [], asked: [...x.asked.filter((v) => v !== c.id), c.id] };
          if (!c.joined) return { ...base, tab: "communities", communities: x.communities.map((v) => (v.id === c.id ? { ...v, joined: true, size: v.size + 1 } : v)), stack: [{ t: "community", id: c.id } as Screen], arrival: { id: c.id, groupId: g.id } };
          hello.now = !g.joined;
          return { ...base, tab: "communities", groups: x.groups.map((v) => (v.id === g.id && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), stack: [{ t: "community", id: c.id } as Screen, { t: "chat", thread: `g:${t.id}` } as Screen] };
        }
        const e = x.events.find((v) => v.id === t.id)!;
        return { ...base, events: x.events.map((v) => (v.id === e.id ? { ...v, ticket: v.price ? v.ticket : true } : v)), stack: [{ t: e.startsAt <= Date.now() && !e.dissolved && (!e.price || e.ticket) ? "room" : "event", id: e.id } as Screen] };
      });
      later(60, () => { if (hello.now) greet(t.id); });
      // A host says yes a few seconds later, so the wait can be felt too.
      const asked = t.kind === "community" ? t.id : t.kind === "group" ? groupHome(t.id) : null;
      if (asked) later(6000, () => patch((x) => {
        if (!x.asked.includes(asked)) return {};
        const top = x.stack.at(-1)?.t;
        const busy = top === "chat" || top === "room" || x.dial || Boolean(x.sheet);
        return { asked: x.asked.filter((v) => v !== asked), communities: x.communities.map((v) => (v.id === asked ? { ...v, joined: true, size: v.size + 1 } : v)), ...(busy ? { toast: `${x.communities.find((v) => v.id === asked)?.name} said yes` } : { stack: [{ t: "community", id: asked } as Screen], tab: "communities" as Tab, arrival: { id: asked } }) };
      }));
      if (asked) later(8600, () => patch((x) => (x.toast?.endsWith("said yes") ? { toast: null } : {})));
    };
    /** Someone who fits says hello first, so nobody walks into silence. */
    const greet = (id: string) => {
      addMsg(`g:${id}`, "me", "You joined", "note");
      later(1500, () => patch((x) => { const gr = x.groups.find((v) => v.id === id); return { typing: { ...x.typing, [`g:${id}`]: gr && gr.members.length ? byFit(x, gr.members)[0] : null } }; }));
      later(3300, () => patch((x) => {
        const who = x.typing[`g:${id}`];
        if (!who || !x.me) return { typing: { ...x.typing, [`g:${id}`]: null } };
        const gr = x.groups.find((v) => v.id === id);
        const mine = x.me.intents.find((v) => gr?.fits.includes(v));
        const text = mine ? `Welcome, ${x.me.name.split(" ")[0]}. I saw “${mine}” on your card, so I'm saying hi first.` : `Welcome, ${x.me.name.split(" ")[0]}. Good to have you in here.`;
        const top = x.stack.at(-1);
        const open = top?.t === "chat" && top.thread === `g:${id}`;
        return { typing: { ...x.typing, [`g:${id}`]: null }, threads: { ...x.threads, [`g:${id}`]: [...(x.threads[`g:${id}`] ?? []), { id: uid(), by: who, text, at: Date.now() }] }, unread: { ...x.unread, [`g:${id}`]: open ? 0 : (x.unread[`g:${id}`] ?? 0) + 1 } };
      }));
    };
    return {
      say, push, enter, addMsg,
      pop: () => patch((x) => ({ stack: x.stack.slice(0, -1) })),
      tab: (tab: Tab) => patch(() => ({ tab, stack: [], sheet: null })),
      sheet: (sheet: Sheet | null) => patch(() => ({ sheet })),
      dial: (dial: boolean) => patch(() => ({ dial, dialWith: "", arrive: null, sheet: null })),
      auth: (auth: State["auth"]) => patch(() => ({ auth })),
      lived: () => patch(() => ({ ...fresh(), dial: false, dialWith: "", arrive: null, me: SAMPLE_ME, auth: null, events: makeEvents(Date.now()).map((e) => (e.id === "e1" ? { ...e, ticket: true } : e)) })),
      restart: () => set({ ...fresh(), dial: false, dialWith: "", arrive: null }),
      hold: (o: Offer | null) => patch((x) => ({ lapsed: o ? null : x.held, held: o && { ...o, until: Date.now() + 5 * 60_000 }, auth: o ? "profile" : "pick" })),
      signUp: (name: string, intents: string[]) => patch((x) => ({
        me: { ...SAMPLE_ME, ...x.contact, id: x.held?.id ?? SAMPLE_ME.id, why: x.held && x.held.tier !== "free" ? x.held.why : undefined, emailOk: false, name, intents, headline: intents[0] ?? "New to Gather" }, auth: "reveal",
        communities: x.communities.map((c) => ({ ...c, joined: false, hosts: c.hosts.filter((h) => h !== "me") })), groups: x.groups.map((v) => ({ ...v, joined: false })), events: makeEvents(Date.now()), unread: {}, saved: [], requests: [],
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
/** Publish, then let it be felt: hearts arrive, and the person it matters to answers. */
      post: (communityId: string, text: string, to: { groupId?: string; announce?: boolean } = {}) => {
        const id = uid();
        patch((x) => {
          const base = x.stack.filter((v) => v.t === "community" && v.id === communityId).slice(0, 1);
          const land: Screen = to.announce ? { t: "channel", id: communityId } : to.groupId ? { t: "chat", thread: `g:${to.groupId}`, tab: "feed" } : { t: "community", id: communityId, tab: "feed" };
          return { posts: [{ id, communityId, ...to, by: "me", at: Date.now(), text, likes: 0, liked: false, comments: [], ...(to.announce ? { seen: 1 } : {}) }, ...x.posts], sheet: null, stack: to.announce || to.groupId ? [...(base.length ? base : [{ t: "community", id: communityId } as Screen]), land] : [land] };
        });
        const bump = (f: (p: Post, x: State) => Post) => patch((x) => ({ posts: x.posts.map((p) => (p.id === id ? f(p, x) : p)) }));
        [1600, 2300, 3400, 4100, 5600].forEach((ms) => later(ms, () => bump((p) => ({ ...p, likes: p.likes + 1 }))));
        if (to.announce) [900, 1500, 2100, 2900, 3800, 5000].forEach((ms, i) => later(ms, () => bump((p, x) => { const size = x.communities.find((c) => c.id === communityId)!.size; return { ...p, seen: Math.round(size * [0.12, 0.27, 0.41, 0.58, 0.7, 0.81][i]) }; })));
        later(4700, () => patch((x) => {
          const pool = to.groupId ? x.groups.find((v) => v.id === to.groupId)?.members : x.communities.find((v) => v.id === communityId)?.members;
          const who = byFit(x, pool ?? []).find((v) => v !== "me");
          if (!who || to.announce) return {};
          return { posts: x.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, { by: who, text: "I can help with this. Message me?" }] } : p)), toast: `${person(who)?.name.split(" ")[0]} answered you` };
        }));
        later(7200, () => patch((x) => (x.toast?.endsWith("answered you") ? { toast: null } : {})));
      },
      /** Arrival done: into the groups they picked, and one of them opens if they came for it. */
      settle: (groupIds: string[], open?: string) => {
        patch((x) => ({ arrival: null, groups: x.groups.map((v) => (groupIds.includes(v.id) && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), stack: open ? [...x.stack, { t: "chat", thread: `g:${open}` } as Screen] : x.stack }));
        groupIds.slice(0, 2).forEach((id, i) => later(i * 2600, () => greet(id)));
      },
      joinGroup: (id: string) => {
        patch((x) => ({ groups: x.groups.map((v) => (v.id === id && !v.joined ? { ...v, joined: true, size: v.size + 1 } : v)), sheet: null, stack: [...x.stack, { t: "chat", thread: `g:${id}` } as Screen] }));
        greet(id);
      },
      leaveGroup: (id: string) => patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, joined: false, size: v.size - 1 } : v)), sheet: null, unread: { ...x.unread, [`g:${id}`]: 0 }, stack: x.stack.filter((v) => !(v.t === "chat" && v.thread === `g:${id}`)) })),
      mute: (id: string) => patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, muted: !v.muted } : v)) })),
      makeGroup: (communityId: string, name: string, topic: string, invite: string[]) => {
        const id = `7${String(10_000_000 + Math.floor(Math.random() * 89_999_999))}`;
        patch((x) => ({ groups: [...x.groups, { id, communityId, name, topic, size: 1, joined: true, members: [], fits: [], by: "me" }], sheet: null, stack: [...x.stack, { t: "chat", thread: `g:${id}` } as Screen] }));
        addMsg(`g:${id}`, "me", "You started this group", "note");
        invite.forEach((who, i) => {
          later(1400 + i * 1100, () => { patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, members: [...v.members, who], size: v.size + 1 } : v)) })); addMsg(`g:${id}`, who, `${person(who)?.name.split(" ")[0]} joined`, "note"); });
        });
        if (invite[0]) later(2400 + invite.length * 1100, () => addMsg(`g:${id}`, invite[0], "Oh good, I've wanted this."));
      },
      host: (communityId: string, title: string, place: string, price: number, inHours: number) => patch((x) => {
        const d = new Date(Date.now() + inHours * 3_600_000);
        d.setHours(19, 0, 0, 0);
        const startsAt = d.getTime();
        const room = `9${String(10000 + ((x.events.length * 7919 + title.length * 131) % 89999)).padStart(5, "0")}`;
        const ev: Event = { id: uid(), inside: 0, communityId, title, blurb: "Hosted by you.", place, startsAt, endsAt: startsAt + 2 * 3_600_000, price, room, host: "me", going: [], seats: 20, ticket: true, dissolved: false };
        return { events: [...x.events, ev], sheet: null, stack: [...x.stack.filter((v) => v.t === "community"), { t: "event", id: ev.id }] };
      }),
      ticket: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, ticket: true } : e)) })),
      joinCommunity: (id: string) => patch((x) => ({ communities: x.communities.map((c) => (c.id === id && !c.joined ? { ...c, joined: true, size: c.size + 1 } : c)) })),
      save: (id: string) => patch((x) => ({ saved: x.saved.includes(id) ? x.saved.filter((v) => v !== id) : [...x.saved, id] })),
      answer: (id: string, yes: boolean) => patch((x) => {
        const { [`d:${id}`]: gone, ...rest } = x.threads;
        return { requests: x.requests.filter((v) => v !== id), ...(yes ? {} : { threads: gone ? rest : x.threads, stack: x.stack.slice(0, -1) }) };
      }),
      contact: (mobile: string, email: string) => patch(() => ({ contact: { mobile, email }, auth: "code" })),
      /** The mobile already has a number: sign in to it, and carry on to wherever they were going. */
      back: () => { const t = { ...fresh(), dial: false, dialWith: "", arrive: null, me: SAMPLE_ME, auth: null }; patch((x) => ({ ...t, pending: x.pending })); },
      welcomeBack: () => say(`Welcome back. Still ${pretty(SAMPLE_ME.id)}`),
      confirmEmail: () => patch((x) => ({ me: x.me && { ...x.me, emailOk: true } })),
      relink: (what: "mobile" | "email", v: string) => patch((x) => ({ me: x.me && { ...x.me, [what]: v }, sheet: null })),
      openDoor: (to: Target) => patch((x) => {
        let pin = "";
        do pin = `8${String(Math.floor(Math.random() * 100_000)).padStart(5, "0")}`; while (x.doors[pin]);
        return { doors: { ...x.doors, [pin]: { to, until: Date.now() + 3_600_000 } } };
      }),
      hurry: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, endsAt: Date.now() + 12_000 } : e)) })),
      dissolve: (id: string) => patch((x) => ({ events: x.events.map((e) => (e.id === id ? { ...e, dissolved: true } : e)) })),
    };
  }, [later, patch]);

  // Life going on elsewhere: a message lands now and then, and home re-sorts itself.
  const alive = Boolean(s.me) && s.auth === null;
  useEffect(() => {
    if (!alive) return;
    const lines: [string, string, string][] = [["g:763028052", "36025841840", "I'm in for the short one"], ["g:779215613", "38260415924", "Buns: three left"], ["g:731806124", "31904472311", "Terms sheet glossary is in the files"], ["g:742117308", "25518306683", "Two reviews done, one slot left"]];
    const ids = lines.map(([thread, by, text], i) => window.setTimeout(() => patch((x) => {
      const g = x.groups.find((v) => `g:${v.id}` === thread);
      if (!g?.joined) return {};
      const top = x.stack[x.stack.length - 1];
      const open = top?.t === "chat" && top.thread === thread;
      return { threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by, text, at: Date.now() }] }, unread: { ...x.unread, [thread]: open ? 0 : (x.unread[thread] ?? 0) + 1 } };
    }), 9000 + i * 16000));
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
const groupHome = (id: string) => GROUPS.find((v) => v.id === id)?.communityId ?? null;
export const person = (id: string): Person | null => PEOPLE.find((x) => x.id === id) ?? null;

/** What a number or PIN reaches right now. A person's check digit is tested before anyone is looked up. */
export function resolve(s: State, digits: string): Target | null {
  const sp = specOf(digits);
  if (!sp || digits.length !== sp.length) return null;
  if (sp.kind === "person") return checks(digits) && PEOPLE.some((x) => x.id === digits) ? { kind: "person", id: digits } : null;
  if (sp.kind === "community") return s.communities.some((x) => x.id === digits) ? { kind: "community", id: digits } : null;
  if (sp.kind === "group") return s.groups.some((x) => x.id === digits) ? { kind: "group", id: digits } : null;
  const door = s.doors[digits];
  if (door && door.until > Date.now()) return door.to;
  const e = s.events.find((x) => x.room === digits && pinOpen(x, Date.now()));
  return e ? { kind: "room", id: e.id } : null;
}

/** An event holds its PIN from an hour before it starts until it ends. */
export const pinOpen = (e: Event, now: number) => !e.dissolved && now >= e.startsAt - 3_600_000 && now < e.endsAt;

/** Do they know each other at all? If not, a first message is a request. */
export const stranger = (s: State, id: string) => {
  const p = PEOPLE.find((x) => x.id === id);
  return Boolean(p) && !s.saved.includes(id) && !s.communities.some((c) => c.joined && c.size < 5000 && c.members.includes(id)) && !s.events.some((e) => e.ticket && e.inside < 500 && e.going.includes(id));
};

/** 1240318 becomes 1.2M. Nobody reads seven digits. */
export const count = (n: number) => (n < 10_000 ? n.toLocaleString("en-IN") : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n));

/** Whoever fits you best, first. At a million members, order is the whole experience. */
export const byFit = (s: State, ids: string[]) => {
  const score = (id: string) => { const p = PEOPLE.find((x) => x.id === id); if (!p) return 0; const o = overlap(s, p); return (o.fits ? 4 : 0) + (p.zone === s.me?.zone ? 2 : 0) + o.communities.filter((c) => c.size < 5000).length; };
  return [...ids].sort((a, b) => score(b) - score(a));
};

/** Why two people should talk: the fit between what they want, and what they already share. */
export function overlap(s: State, p: Person) {
  const n = p.name.split(" ")[0];
  const fit = FITS.find((f) => s.me?.intents.includes(f.mine) && p.intents.includes(f.theirs) && (f.mine !== "New in town" || p.zone === s.me.zone)) ?? null;
  const communities = s.communities.filter((c) => c.joined && c.members.includes(p.id));
  const events = s.events.filter((e) => e.ticket && e.going.includes(p.id));
  const e0 = events[0];
  const at = e0 && (e0.dissolved ? " were both at" : e0.startsAt <= Date.now() ? "'re both at" : "'re both going to");
  const line = fit?.line(n) ?? (e0 ? `You${at} ${e0.title.split(":")[0]}.` : communities[0] ? `You're both in ${communities[0].name}.` : null);
  const open = fit?.open(n) ?? (communities[0] ? `Hi ${n}, we're both in ${communities[0].name}. ` : `Hi ${n}, `);
  return { line, open, communities, events, fits: Boolean(fit) };
}

/** What's going on in a community, in the groups you're in. Muted groups never count as new. */
export function latest(s: State, c: Community) {
  const rows = s.groups.filter((x) => x.communityId === c.id && x.joined).map((group) => {
    const msg = (s.threads[`g:${group.id}`] ?? []).at(-1) ?? null;
    return { group, msg, at: msg?.at ?? 0, unread: group.muted ? 0 : (s.unread[`g:${group.id}`] ?? 0) };
  }).sort((a, b) => b.at - a.at);
  const note = announcements(s, c.id)[0] ?? null;
  const fresh = s.unread[`a:${c.id}`] ?? 0;
  return { rows, note, fresh, at: Math.max(rows[0]?.at ?? 0, note?.at ?? 0), unread: rows.reduce((n, x) => n + x.unread, 0) + fresh };
}
export const announcements = (s: State, id: string) => s.posts.filter((p) => p.communityId === id && p.announce).sort((a, b) => b.at - a.at);
export const isHost = (s: State, id: string) => Boolean(s.communities.find((c) => c.id === id)?.hosts.includes("me"));

/**
 * A community's feed: what was said to everyone, plus the groups you're in.
 * Nothing from a group you haven't joined. What fits you rises, then what's
 * recent, and each post can say why it's here.
 */
export function feedFor(s: State, id: string) {
  const mine = new Set(s.groups.filter((v) => v.joined).map((v) => v.id));
  return s.posts.filter((p) => p.communityId === id && !p.announce && (!p.groupId || mine.has(p.groupId)))
    .map((p) => {
      const who = person(p.by);
      const o = who ? overlap(s, who) : null;
      const reason = p.by === "me" ? null : o?.fits ? o.line : s.saved.includes(p.by) ? `You kept ${who?.name.split(" ")[0]}` : null;
      return { p, reason, score: p.at + (p.by === "me" && Date.now() - p.at < 600_000 ? 1e11 : 0) + (reason ? 5 * 3_600_000 : 0) };
    }).sort((a, b) => b.score - a.score);
}

/** Groups someone could join, the ones made for what they want first. */
export function openGroups(s: State, id: string) {
  const score = (g: Group) => g.fits.filter((f) => s.me?.intents.includes(f)).length;
  return s.groups.filter((g) => g.communityId === id && !g.joined).sort((a, b) => score(b) - score(a) || b.size - a.size);
}
export const fitsMe = (s: State, g: Group) => g.fits.find((f) => s.me?.intents.includes(f)) ?? null;

/** Communities worth finding, by how many people in them fit you. */
export function suggested(s: State) {
  return s.communities.filter((c) => !c.joined && !s.asked.includes(c.id) && (!c.place || c.place === s.me?.zone))
    .map((c) => ({ c, fits: c.members.filter((m) => { const p = person(m); return p && overlap(s, p).fits; }) }))
    .sort((a, b) => b.fits.length - a.fits.length);
}

/** The link and QR behind every key: opens straight onto what it's for. */
export const linkTo = (t: Target) => `${window.location.origin}/?${t.kind === "room" ? "e" : "id"}=${t.id}`;

/** Enough to recognise your own, not enough to learn someone else's. */
export const maskMobile = (m: string) => `+91 ••••• •${m.replace(/\D/g, "").slice(-4)}`;
export const maskEmail = (e: string) => e.replace(/^(.).*?(@.*)$/, "$1•••$2");

export const ago = (at: number, now: number) => {
  const m = Math.floor((now - at) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};
export const left = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
export const when = (at: number) => new Date(at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
