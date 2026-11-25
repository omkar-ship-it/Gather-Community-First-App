"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COMMUNITIES, FITS, GROUPS, PEOPLE, makeEvents, makePosts, makeThreads, uid, type Biz, type Community, type Event, type Group, type Me, type Msg, type Person, type Post } from "./data";
import type { Offer } from "./numbers";
import { checks, pretty, specOf, type Kind } from "./ids";

/** Where someone is inside a community: its whole feed, one group's, or the groups they could join. */
export type Spot = { at: string };
/** Anything worth jumping to. A group always lands inside its community, never on a screen of its own. */
export type Go =
  | { t: "group"; id: string }
  | { t: "community"; id: string }
  | { t: "post"; id: string }
  | { t: "person"; id: string }
  | { t: "dm"; id: string; draft?: string }
  | { t: "event"; id: string };
/** The card a community was opened from, so it can grow out of it. Insets from the device's edges. */
export type Rect = { t: number; r: number; b: number; l: number };
export type Nudge = { key: string; by: string; title: string; text: string; go: Go };
export type Screen =
  | { t: "community"; id: string; from?: Rect }
  | { t: "people"; id: string; groupId?: string }
  | { t: "events"; id: string }
  | { t: "channel"; id: string }
  | { t: "chat"; thread: string; draft?: string }
  | { t: "person"; id: string }
  | { t: "event"; id: string }
  | { t: "room"; id: string }
  | { t: "me" }
  | { t: "movein"; id: string };
export type Sheet =
  | { t: "plus" }
  | { t: "post"; communityId?: string; groupId?: string; announce?: boolean; draft?: string }
  | { t: "peek"; kind: "community" | "group"; id: string }
  | { t: "group"; id: string }
  | { t: "newgroup"; communityId: string }
  | { t: "ask"; communityId: string; about?: string }
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
  spot: Record<string, Spot>;
  nudge: Nudge | null;
  /** A post on its way out: who it's about to reach. */
  sending: { hue: number; label: string; reach: number; faces: string[] } | null;
  /** People who kept you back, and the one being celebrated right now. */
  mutual: string[];
  meet: string | null;
  /** How many people you've helped. */
  thanks: number;
  /** Communities whose WhatsApp customers have been brought in, and how many came. */
  movedIn: Record<string, number>;
  moments: boolean;
  caughtUp: boolean;
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
  const path = /^\/([ce])\/([a-z0-9]+)/.exec(window.location.pathname);
  const link = (path?.[1] === "c" ? path[2] : new URLSearchParams(window.location.search).get("id") ?? "").replace(/\D/g, "").slice(0, 12);
  const ev = path?.[1] === "e" ? path[2] : new URLSearchParams(window.location.search).get("e");
  const arrive: Target | null = ev && makeEvents(now).some((e) => e.id === ev) ? { kind: "room", id: ev } : null;
  return {
    me: null, pending: null, auth: "welcome", dial: link.length > 0 || Boolean(arrive), dialWith: link, arrive, doors: {}, contact: { mobile: "", email: "" }, held: null, lapsed: null, arrival: null, asked: [], tab: "communities", stack: [], sheet: null, toast: null, spot: {}, nudge: null, sending: null, mutual: [], meet: null, thanks: 0, movedIn: {}, moments: false, caughtUp: false,
    communities: COMMUNITIES, groups: GROUPS, posts: makePosts(now), events: makeEvents(now), threads: makeThreads(now),
    unread: { "f:742117308": 2, "f:763028052": 1, "d:31904472311": 1, "a:680421907": 1, "f:731806124": 1, "f:779215613": 1, "a:618402755": 1 }, typing: {}, saved: ["36025841840"], requests: ["33841506796"],
  };
}

const REPLIES: Record<string, string[]> = {
  dm: ["Yes, let's. Are you around this evening?", "Ha, exactly what I was thinking.", "Send it over, I'll read it tonight.", "I'm near the lake on Sunday if that's easier."],
  room: ["Come say hi, I'm near the window.", "Best room of the month.", "Who asked that last question? Brilliant.", "Saving your ID before this closes."],
};

function useStoreValue() {
  const [s, set] = useState<State>(fresh);
  const timers = useRef<number[]>([]);
  useEffect(() => { const t = timers.current; return () => t.forEach((x) => window.clearTimeout(x)); }, []);
  const later = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  const patch = useCallback((f: (s: State) => Partial<State>) => set((x) => ({ ...x, ...f(x) })), []);

  const act = useMemo(() => {
    /** Standing in front of this feed right now? Then nothing in it is unread. */
    const here = (x: State, gid: string) => { const top = x.stack.at(-1); return top?.t === "community" && x.spot[top.id]?.at === gid; };
    const joinedIn = (groups: Group[], ids: string[]) => [...groups.filter((v) => !ids.includes(v.id) || v.joined), ...ids.flatMap((id) => groups.filter((v) => v.id === id && !v.joined)).map((v) => ({ ...v, joined: true, size: v.size + 1 }))];
    const read = (x: State, cid: string, sp: Spot) => ({ ...x.unread, ...(sp.at === "all" ? { [`a:${cid}`]: 0 } : { [`f:${sp.at}`]: 0 }) });
    /** Stand somewhere in a community, opening it only if it isn't open already. */
    const stand = (x: State, cid: string, sp: Spot): Partial<State> => {
      const i = x.stack.findIndex((v) => v.t === "community" && v.id === cid);
      return { sheet: null, dial: false, nudge: null, tab: "communities", spot: { ...x.spot, [cid]: sp }, unread: read(x, cid, sp), stack: i < 0 ? [...x.stack, { t: "community", id: cid } as Screen] : x.stack.slice(0, i + 1) };
    };
    const say = (toast: string) => { patch(() => ({ toast })); later(2400, () => patch((x) => (x.toast === toast ? { toast: null } : {}))); };
    const push = (sc: Screen) => patch((x) => ({ stack: [...x.stack, sc], sheet: null, dial: false, nudge: null, unread: sc.t === "community" ? read(x, sc.id, x.spot[sc.id] ?? { at: "all" }) : sc.t === "chat" ? { ...x.unread, [sc.thread]: 0 } : sc.t === "channel" ? { ...x.unread, [`a:${sc.id}`]: 0 } : x.unread }));
    const addMsg = (thread: string, by: string, text: string, kind?: "note") =>
      patch((x) => ({ threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by, text, at: Date.now(), kind }] } }));
    const responder = (thread: string, x: State) => {
      if (thread.startsWith("d:")) return thread.slice(2);
      if (thread.startsWith("r:")) { const e = x.events.find((v) => v.id === thread.slice(2)); return e?.going[Math.floor(Math.random() * e.going.length)] ?? null; }
      return null;
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
          return { ...stand({ ...x, stack: [] }, c.id, { at: g.id }), ...base, tab: "communities", groups: joinedIn(x.groups, [g.id]) };
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
        return { asked: x.asked.filter((v) => v !== asked), communities: x.communities.map((v) => (v.id === asked ? { ...v, joined: true, size: v.size + 1 } : v)), ...(busy ? { nudge: { key: uid(), by: x.communities.find((v) => v.id === asked)!.hosts[0], title: `${x.communities.find((v) => v.id === asked)?.name} said yes`, text: "Your place is ready", go: { t: "community", id: asked } as Go } } : { stack: [{ t: "community", id: asked } as Screen], tab: "communities" as Tab, arrival: { id: asked } }) };
      }));
    };
    /** Someone who fits says hello first, so nobody walks into silence. */
    const greet = (id: string) => {
      later(3000, () => patch((x) => {
        const gr = x.groups.find((v) => v.id === id);
        const who = byFit(x, gr?.members ?? [])[0];
        if (!gr?.joined || !who || !x.me) return {};
        const mine = x.me.intents.find((v) => gr.fits.includes(v));
        const text = mine ? `Everyone, meet ${x.me.name.split(" ")[0]}. Here for “${mine}”, so be useful.` : `Everyone, meet ${x.me.name.split(" ")[0]}. Good to have you in here.`;
        const post: Post = { id: uid(), communityId: gr.communityId, groupId: id, by: who, at: Date.now(), tag: "Welcome", text, likes: 2, liked: false, comments: [] };
        return { posts: [post, ...x.posts], unread: { ...x.unread, [`f:${id}`]: here(x, id) ? 0 : (x.unread[`f:${id}`] ?? 0) + 1 }, nudge: { key: uid(), by: who, title: `${person(who)?.name.split(" ")[0]} welcomed you to ${gr.name}`, text, go: { t: "post", id: post.id } as Go } };
      }));
    };
    return {
      say, push, enter, addMsg,
      spot: (cid: string, sp: Spot) => patch((x) => ({ spot: { ...x.spot, [cid]: sp }, unread: read(x, cid, sp) })),
      go: (to: Go) => patch((x) => {
        if (to.t === "group") { const g = x.groups.find((v) => v.id === to.id); return g ? stand(x, g.communityId, { at: g.id }) : {}; }
        if (to.t === "community") return x.communities.find((c) => c.id === to.id)?.joined ? stand(x, to.id, { at: "all" }) : {};
        if (to.t === "post") { const p = x.posts.find((v) => v.id === to.id); return p ? { ...stand(x, p.communityId, { at: p.groupId ?? "all" }), sheet: { t: "comments", postId: p.id } as Sheet } : {}; }
        const sc: Screen = to.t === "person" ? { t: "person", id: to.id } : to.t === "event" ? { t: "event", id: to.id } : { t: "chat", thread: `d:${to.id}`, draft: to.draft };
        return { stack: [...x.stack, sc], sheet: null, nudge: null, ...(to.t === "dm" ? { unread: { ...x.unread, [`d:${to.id}`]: 0 } } : {}) };
      }),
      quiet: () => patch(() => ({ nudge: null })),
      moments: (on: boolean) => patch((x) => ({ moments: on, caughtUp: x.caughtUp || !on })),
      met: () => patch(() => ({ meet: null })),
      pop: () => patch((x) => ({ stack: x.stack.slice(0, -1) })),
      tab: (tab: Tab) => patch(() => ({ tab, stack: [], sheet: null })),
      sheet: (sheet: Sheet | null) => patch(() => ({ sheet })),
      dial: (dial: boolean) => patch(() => ({ dial, dialWith: "", arrive: null, sheet: null })),
      auth: (auth: State["auth"]) => patch(() => ({ auth })),
      lived: () => patch(() => ({ ...fresh(), dial: false, dialWith: "", arrive: null, me: SAMPLE_ME, auth: null, events: makeEvents(Date.now()).map((e) => (e.id === "e1" ? { ...e, ticket: true } : e)) })),
      /** "I run a place": the same account, standing at the café's door. */
      place: () => patch(() => ({ ...fresh(), dial: false, dialWith: "", arrive: null, me: SAMPLE_ME, auth: null, stack: [{ t: "movein", id: "682906418" } as Screen] })),
      biz: (id: string, b: Biz) => patch((x) => ({ communities: x.communities.map((c) => (c.id === id ? { ...c, biz: b } : c)) })),
      /** The customers are in: the community is bigger, and two of them have already found each other. */
      moveIn: (id: string, n: number, ids: string[]) => {
        patch((x) => ({ ...stand({ ...x, stack: [] }, id, { at: "all" }), movedIn: { ...x.movedIn, [id]: n }, communities: x.communities.map((c) => (c.id === id ? { ...c, size: c.size + n, members: [...new Set([...c.members, ...ids])] } : c)) }));
        const pair = pairs(ids)[0];
        if (pair) later(2600, () => patch(() => ({ nudge: { key: uid(), by: pair.a, title: `${person(pair.a)?.name.split(" ")[0]} and ${person(pair.b)?.name.split(" ")[0]} just met`, text: pair.why, go: { t: "person", id: pair.a } as Go } })));
      },
      restart: () => set({ ...fresh(), dial: false, dialWith: "", arrive: null }),
      hold: (o: Offer | null) => patch((x) => ({ lapsed: o ? null : x.held, held: o && { ...o, until: Date.now() + 5 * 60_000 }, auth: o ? "profile" : "pick" })),
      signUp: (name: string, intents: string[]) => patch((x) => ({
        me: { ...SAMPLE_ME, ...x.contact, id: x.held?.id ?? SAMPLE_ME.id, why: x.held && x.held.tier !== "free" ? x.held.why : undefined, emailOk: false, name, intents, headline: intents[0] ?? "New to Gather" }, auth: "reveal",
        communities: x.communities.map((c) => ({ ...c, joined: false, hosts: c.hosts.filter((h) => h !== "me") })), groups: x.groups.map((v) => ({ ...v, joined: false })), events: makeEvents(Date.now()), unread: {}, saved: [], requests: [], posts: x.posts.filter((v) => v.by !== "me"),
        threads: Object.fromEntries(Object.entries(x.threads).filter(([k]) => !k.startsWith("d:"))),
      })),
      send: (thread: string, text: string) => {
        addMsg(thread, "me", text);
        later(900, () => patch((x) => { const who = responder(thread, x); return { typing: { ...x.typing, [thread]: who } }; }));
        later(2500, () => patch((x) => {
          const who = x.typing[thread];
          if (!who || (thread.startsWith("r:") && x.events.find((e) => `r:${e.id}` === thread)?.dissolved)) return { typing: { ...x.typing, [thread]: null } };
          const pool = REPLIES[thread.startsWith("d:") ? "dm" : "room"];
          const n = (x.threads[thread] ?? []).filter((v) => v.by === "me").length;
          return { typing: { ...x.typing, [thread]: null }, threads: { ...x.threads, [thread]: [...(x.threads[thread] ?? []), { id: uid(), by: who, text: pool[(n - 1) % pool.length], at: Date.now() }] } };
        }));
      },
      like: (id: string) => patch((x) => ({ posts: x.posts.map((v) => (v.id === id ? { ...v, liked: !v.liked, likes: v.likes + (v.liked ? -1 : 1) } : v)) })),
      vote: (id: string, i: number) => patch((x) => ({ posts: x.posts.map((v) => (v.id === id && v.poll && v.poll.voted === null ? { ...v, poll: { ...v.poll, voted: i, options: v.poll.options.map((o, j) => (j === i ? { ...o, votes: o.votes + 1 } : o)) } } : v)) })),
      /** Help someone and they tell you so. */
      comment: (id: string, text: string) => {
        patch((x) => ({ posts: x.posts.map((v) => (v.id === id ? { ...v, comments: [...v.comments, { by: "me", text }] } : v)) }));
        later(2600, () => patch((x) => {
          const p = x.posts.find((v) => v.id === id);
          if (!p || p.by === "me" || p.comments.filter((c) => c.by === "me").length !== 1) return {};
          const n = person(p.by)?.name.split(" ")[0];
          return { thanks: x.thanks + 1, posts: x.posts.map((v) => (v.id === id ? { ...v, comments: [...v.comments, { by: p.by, text: "That helps more than you know. Thank you." }] } : v)), nudge: { key: uid(), by: p.by, title: `${n} thanked you`, text: "That helps more than you know.", go: { t: "post", id } as Go } };
        }));
      },
/** Publish, then let it be felt: hearts arrive, and the person it matters to answers. */
      post: (communityId: string, text: string, to: { groupId?: string; announce?: boolean } = {}) => {
        const id = uid();
        const out = 2100;
        patch((x) => {
          const c = x.communities.find((v) => v.id === communityId)!;
          const g = x.groups.find((v) => v.id === to.groupId);
          return { sheet: null, sending: { hue: c.hue, label: to.announce ? `Everyone in ${c.name}` : (g?.name ?? c.name), reach: g?.size ?? c.size, faces: byFit(x, g?.members ?? c.members).slice(0, 7) } };
        });
        later(out - 500, () => patch((x) => ({ ...stand(x, communityId, { at: to.groupId ?? "all" }), posts: [{ id, communityId, ...to, by: "me", at: Date.now(), text, likes: 0, liked: false, comments: [], ...(to.announce ? { seen: 1 } : {}) }, ...x.posts] })));
        later(out, () => patch(() => ({ sending: null })));
        const bump = (f: (p: Post, x: State) => Post) => patch((x) => ({ posts: x.posts.map((p) => (p.id === id ? f(p, x) : p)) }));
        [1600, 2300, 3400, 4100, 5600].forEach((ms) => later(out + ms, () => bump((p) => ({ ...p, likes: p.likes + 1 }))));
        if (to.announce) [900, 1500, 2100, 2900, 3800, 5000].forEach((ms, i) => later(out + ms, () => bump((p, x) => { const size = x.communities.find((c) => c.id === communityId)!.size; return { ...p, seen: Math.round(size * [0.12, 0.27, 0.41, 0.58, 0.7, 0.81][i]) }; })));
        later(out + 4700, () => patch((x) => {
          const pool = to.groupId ? x.groups.find((v) => v.id === to.groupId)?.members : x.communities.find((v) => v.id === communityId)?.members;
          const who = byFit(x, pool ?? []).find((v) => v !== "me");
          if (!who || to.announce) return {};
          return { posts: x.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, { by: who, text: "I can help with this. Message me?" }] } : p)), nudge: { key: uid(), by: who, title: `${person(who)?.name.split(" ")[0]} answered you`, text: "I can help with this. Message me?", go: { t: "post", id } as Go } };
        }));
      },
      /** Arrival done: into the groups they picked, and one of them opens if they came for it. */
      settle: (groupIds: string[], open?: string) => {
        patch((x) => { const cid = x.arrival?.id; return { arrival: null, groups: joinedIn(x.groups, groupIds), ...(cid ? { spot: { ...x.spot, [cid]: { at: open ?? "all" } } } : {}) }; });
        groupIds.slice(0, 2).forEach((id, i) => later(i * 2600, () => greet(id)));
      },
      joinGroup: (id: string) => {
        patch((x) => { const g = x.groups.find((v) => v.id === id)!; return { ...stand(x, g.communityId, { at: id }), groups: joinedIn(x.groups, [id]) }; });
        greet(id);
      },
      leaveGroup: (id: string) => patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, joined: false, size: v.size - 1 } : v)), sheet: null, unread: { ...x.unread, [`f:${id}`]: 0 }, spot: { ...x.spot, [x.groups.find((v) => v.id === id)!.communityId]: { at: "all" } } })),
      mute: (id: string) => patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, muted: !v.muted } : v)) })),
      makeGroup: (communityId: string, name: string, topic: string, invite: string[]) => {
        const id = `7${String(10_000_000 + Math.floor(Math.random() * 89_999_999))}`;
        patch((x) => ({ ...stand(x, communityId, { at: id }), groups: [...x.groups, { id, communityId, name, topic, size: 1, joined: true, members: [], fits: [], by: "me" }] }));
        invite.forEach((who, i) => {
          later(1400 + i * 1100, () => { patch((x) => ({ groups: x.groups.map((v) => (v.id === id ? { ...v, members: [...v.members, who], size: v.size + 1 } : v)) })); });
        });
        if (invite[0]) later(2400 + invite.length * 1100, () => patch((x) => ({ posts: [{ id: uid(), communityId, groupId: id, by: invite[0], at: Date.now(), text: "Oh good, I've wanted this.", likes: 1, liked: false, comments: [] }, ...x.posts], nudge: { key: uid(), by: invite[0], title: `${person(invite[0])?.name.split(" ")[0]} is in`, text: "Oh good, I've wanted this.", go: { t: "group", id } as Go } })));
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
      /** Keep someone. If you fit, they keep you back, and that deserves a moment. */
      save: (id: string) => {
        patch((x) => ({ saved: x.saved.includes(id) ? x.saved.filter((v) => v !== id) : [...x.saved, id] }));
        later(1500, () => patch((x) => {
          const p = person(id);
          if (!p || !x.saved.includes(id) || x.mutual.includes(id) || !overlap(x, p).fits) return {};
          const top = x.stack.at(-1);
          return { mutual: [...x.mutual, id], meet: top?.t === "person" && top.id === id ? id : null, toast: null };
        }));
      },
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

  // Life going on elsewhere: a post lands now and then, and home re-sorts itself.
  const alive = Boolean(s.me) && s.auth === null;
  useEffect(() => {
    if (!alive) return;
    const lines: [string, string, string, string?][] = [
      ["763028052", "36025841840", "Short loop it is. Who's in?"],
      ["779215613", "38260415924", "Buns: three left."],
      ["731806124", "41679053260", "First yes. It's small, and I read the email four times.", "Win"],
      ["742117308", "25518306683", "Two portfolio reviews done, one slot left.", "Offer"],
    ];
    const ids = lines.map(([gid, by, text, tag], i) => window.setTimeout(() => patch((x) => {
      const g = x.groups.find((v) => v.id === gid);
      if (!g?.joined) return {};
      const top = x.stack[x.stack.length - 1];
      const seen = top?.t === "community" && x.spot[top.id]?.at === gid;
      return { posts: [{ id: uid(), communityId: g.communityId, groupId: gid, by, at: Date.now(), tag, text, likes: 1, liked: false, comments: [] }, ...x.posts], unread: { ...x.unread, [`f:${gid}`]: seen ? 0 : (x.unread[`f:${gid}`] ?? 0) + 1 } };
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
    const post = s.posts.filter((p) => p.groupId === group.id).sort((a, b) => b.at - a.at)[0] ?? null;
    return { group, post, at: post?.at ?? 0, unread: group.muted ? 0 : (s.unread[`f:${group.id}`] ?? 0) };
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

/** The one line that says why to open a community right now. */
export function headline(s: State, c: Community): { by: string; where: string; text: string; go: Go } | null {
  const l = latest(s, c);
  if (l.note && l.fresh) return { by: l.note.by, where: "Announcement", text: l.note.text, go: { t: "community", id: c.id } };
  const posts = feedFor(s, c.id);
  const fresh = l.rows.find((r) => r.unread > 0);
  if (fresh?.post) return { by: fresh.post.by, where: fresh.group.name, text: fresh.post.text, go: { t: "group", id: fresh.group.id } };
  const top = posts[0]?.p ?? l.note;
  if (!top) return null;
  const g = s.groups.find((v) => v.id === top.groupId);
  return { by: top.by, where: g?.name ?? (top.announce ? "Announcement" : "Everyone"), text: top.text, go: g ? { t: "group", id: g.id } : { t: "community", id: c.id } };
}

export type Moment = { key: string; by: string; hue: number; kicker: string; text: string; cta: string; go: Go };
/** While you were away: a handful of things about people, then it ends. */
export function momentsFor(s: State): Moment[] {
  const out: Moment[] = [];
  const first = (id: string) => person(id)?.name.split(" ")[0] ?? "Someone";
  const hueOf = (cid: string) => s.communities.find((c) => c.id === cid)?.hue ?? 318;
  const mine = s.posts.find((p) => p.by === "me" && p.comments.some((c) => c.by !== "me"));
  const reply = mine?.comments.filter((c) => c.by !== "me").at(-1);
  if (mine && reply) out.push({ key: "reply", by: reply.by, hue: hueOf(mine.communityId), kicker: `${first(reply.by)} answered you`, text: `“${reply.text}”`, cta: "Read it", go: { t: "post", id: mine.id } });
  const fit = s.communities.filter((c) => c.joined).flatMap((c) => feedFor(s, c.id)).find(({ p, reason }) => reason && p.by !== "me" && p.by !== reply?.by);
  if (fit) out.push({ key: "fit", by: fit.p.by, hue: hueOf(fit.p.communityId), kicker: fit.reason!, text: `“${fit.p.text}”`, cta: `Answer ${first(fit.p.by)}`, go: { t: "post", id: fit.p.id } });
  for (const id of s.requests) out.push({ key: id, by: id, hue: person(id)?.hue ?? 190, kicker: `${first(id)} would like to talk`, text: `“${(s.threads[`d:${id}`] ?? []).at(-1)?.text ?? ""}”`, cta: `Hear ${first(id)} out`, go: { t: "dm", id } });
  const e = s.events.filter((v) => !v.dissolved && !v.ticket && v.startsAt > Date.now() && s.communities.find((c) => c.id === v.communityId)?.joined).sort((a, b) => a.startsAt - b.startsAt)[0];
  if (e) { const who = byFit(s, e.going); out.push({ key: e.id, by: who[0], hue: hueOf(e.communityId), kicker: `${who.slice(0, 2).map(first).join(" and ")} ${who.length > 1 ? "are" : "is"} going`, text: e.title, cta: "See who else", go: { t: "event", id: e.id } }); }
  return out;
}

/** People you've not met who want what you want, for the tags chosen so far. */
export const waiting = (tags: string[]) => PEOPLE.filter((p) => p.zone === "Bengaluru" && FITS.some((f) => tags.includes(f.mine) && p.intents.includes(f.theirs)));

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
export const linkTo = (t: Target) => {
  const page = t.kind === "room" ? /^e\d+$/.test(t.id) : t.kind !== "person" && [...COMMUNITIES, ...GROUPS].some((v) => v.id === t.id);
  return page ? `${window.location.origin}/${t.kind === "room" ? "e" : "c"}/${t.id}` : `${window.location.origin}/?${t.kind === "room" ? "e" : "id"}=${t.id}`;
};

/** Pairs among these people who want what the other has. */
export function pairs(ids: string[]) {
  const out: { a: string; b: string; why: string }[] = [];
  const all = ids.map((id) => PEOPLE.find((p) => p.id === id)).filter((p) => p !== undefined);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const [a, b] = [all[i], all[j]];
    const f = FITS.find((v) => (a.intents.includes(v.mine) && b.intents.includes(v.theirs)) || (b.intents.includes(v.mine) && a.intents.includes(v.theirs)));
    const first = f && a.intents.includes(f.mine) && b.intents.includes(f.theirs);
    if (f) out.push({ a: first ? a.id : b.id, b: first ? b.id : a.id, why: f.mine === f.theirs ? `Both ${f.mine === "New in town" ? "new in town" : `here for “${f.mine}”`}` : `“${f.mine}” meets “${f.theirs}”` });
  }
  return out;
}

const clock = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
/** Open or shut, said the way a person at the door would. */
export const openNow = (b: Biz, now: number) => { const h = new Date(now).getHours(); return h >= b.opens && h < b.closes ? `Open till ${clock(b.closes)}` : `Opens at ${clock(b.opens)}`; };
/** WhatsApp's own link. With no number it opens the share picker, broadcast lists included. */
export const waLink = (text: string, number = "") => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

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
