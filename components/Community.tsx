"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { BellOff, Check, ChevronRight, Heart, Megaphone, MessageCircle, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { INTENTS, type Event, type Group, type Post } from "@/lib/data";
import { ago, announcements, byFit, count, feedFor, fitsMe, isHost, latest, openGroups, overlap, person, useNow, useStore, when, type CommunityTab } from "@/lib/store";
import { Thread } from "./Screens";
import { Avatar, Bar, Faces, Glyph, GroupMark, IdTiles, Tag, Unread, firstOf, nameOf, spring } from "./ui";

const TABS: CommunityTab[] = ["home", "feed", "members", "events"];
const TAB_LABEL: Record<CommunityTab, string> = { home: "Home", feed: "Feed", members: "People", events: "Events" };

/** Tabs with a marker that slides. */
function Tabs<T extends string>({ id, tabs, label, value, onChange, dark = false }: { id: string; tabs: readonly T[]; label: Record<T, string>; value: T; onChange: (t: T) => void; dark?: boolean }) {
  return (
    <div className="flex px-3" role="tablist">
      {tabs.map((t) => (
        <button key={t} type="button" role="tab" aria-selected={value === t} onClick={() => onChange(t)} className="relative min-h-[46px] flex-1 text-[15px] font-medium" style={{ opacity: value === t ? 1 : 0.68 }}>
          {label[t]}
          {value === t && <motion.span layoutId={`tab-${id}`} transition={spring} className="absolute inset-x-4 bottom-0 h-[3px] rounded-full" style={{ background: dark ? "var(--sun)" : "var(--brand)" }} />}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ community
/** Community > announcements > groups you're in > groups you could join. */
export function CommunityScreen({ id, initial = "home" }: { id: string; initial?: CommunityTab }) {
  const { s, act } = useStore();
  const [tab, setTab] = useState<CommunityTab>(initial);
  const now = useNow(20_000);
  const c = s.communities.find((x) => x.id === id)!;
  const events = s.events.filter((e) => e.communityId === id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none text-white" style={{ background: `hsl(${c.hue} 46% 30%)` }}>
        <Bar dark title="" right={<button type="button" className="press mr-2 flex min-h-[44px] items-center gap-2 rounded-full bg-white/15 px-4 text-[14.5px] font-medium" onClick={() => act.sheet({ t: "key", kind: "community", id })}><Share2 size={16} /> Pass the key</button>} />
        <div className="flex items-center gap-4 px-5 pb-3">
          <span className="rounded-[20px] ring-[3px] ring-white/25"><Glyph c={c} size={58} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-semibold leading-tight tracking-[-0.02em]">{c.name}</h1>
            <p className="mt-0.5 text-[14.5px] text-white/75">{count(c.size)} members{c.online ? ", every city" : ""}</p>
            <span className="mt-2 block"><IdTiles digits={c.id} size="sm" tone="dark" /></span>
          </div>
        </div>
        <Tabs id={id} tabs={TABS} label={TAB_LABEL} value={tab} onChange={setTab} dark />
      </div>
      <div className="scroll flex-1 px-4 pb-28 pt-4" key={tab}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "home" && <CommunityHome id={id} now={now} onEvents={() => setTab("events")} />}
          {tab === "feed" && <Feed id={id} now={now} onPeople={() => setTab("members")} />}
          {tab === "members" && <People ids={c.members} size={c.size} hosts={c.hosts} me />}
          {tab === "events" && (
            <>
              {events.map((e) => <EventRow key={e.id} e={e} />)}
              <button type="button" className="btn btn-quiet mt-1 w-full" onClick={() => act.sheet({ t: "host", communityId: id })}>Host something</button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function CommunityHome({ id, now, onEvents }: { id: string; now: number; onEvents: () => void }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const { rows, note, fresh } = latest(s, c);
  const open = openGroups(s, id);
  const next = s.events.filter((e) => e.communityId === id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt)[0];
  return (
    <>
      <button type="button" onClick={() => act.push({ t: "channel", id })} className="press w-full rounded-[22px] bg-[var(--card)] p-4 text-left">
        <span className="flex items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl text-white" style={{ background: `hsl(${c.hue} 48% 38%)` }}><Megaphone size={21} /></span>
          <span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold leading-tight">Announcements</span><span className="text-[14px] text-[var(--soft)]">{note ? `${note.by === "me" ? "You" : firstOf(note.by)}, ${ago(note.at, now)}` : "Only hosts post here"}</span></span>
          <Unread n={fresh} />
        </span>
        {note && <span className="mt-3 line-clamp-2 block text-[15.5px] leading-snug">{note.text}</span>}
      </button>
      {next && <button type="button" onClick={onEvents} className="press mt-2.5 flex min-h-[52px] w-full items-center gap-3 rounded-[18px] bg-[var(--card)] px-4 text-left text-[15px]">
        {next.startsAt <= now && <span className="dot-live h-2 w-2 flex-none rounded-full bg-[var(--live)]" />}
        <span className="min-w-0 flex-1 truncate font-medium">{next.title}</span><span className="flex-none text-[14px] text-[var(--soft)]">{next.startsAt <= now ? "On now" : when(next.startsAt).split(",")[0]}</span>
      </button>}

      <LayoutGroup>
        <h2 className="mb-2 mt-6 px-1 text-[16px] font-semibold">{rows.length ? "Groups you're in" : "You're not in a group yet"}</h2>
        <ul className="overflow-hidden rounded-[22px] bg-[var(--card)]">
          {rows.map(({ group: g, msg, unread }) => (
            <motion.li key={g.id} layout layoutId={`grp-${g.id}`} transition={spring} className="border-t border-[var(--line)] first:border-t-0">
              <button type="button" onClick={() => act.push({ t: "chat", thread: `g:${g.id}` })} className="press flex w-full items-center gap-3.5 p-4 text-left">
                <GroupMark g={g} hue={c.hue} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-[16.5px] font-semibold">{g.name}</span>{g.muted && <BellOff size={14} className="flex-none text-[var(--soft)]" aria-label="Muted" />}</span><span className="flex-none text-[13px] text-[var(--soft)]">{msg ? ago(msg.at, now) : ""}</span></span>
                  <span className="mt-0.5 block truncate text-[14.5px]" style={{ color: unread ? "var(--ink)" : "var(--soft)" }}>{msg ? (msg.kind === "note" ? msg.text : `${msg.by === "me" ? "You" : firstOf(msg.by)}: ${msg.text}`) : g.topic}</span>
                </span>
                <Unread n={unread} />
              </button>
            </motion.li>
          ))}
          <li className="border-t border-[var(--line)] first:border-t-0"><button type="button" onClick={() => act.sheet({ t: "newgroup", communityId: id })} className="press flex min-h-[60px] w-full items-center gap-3.5 px-4 text-left text-[15.5px] font-medium text-[var(--brand)]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-soft)]"><Plus size={21} /></span>Start a group</button></li>
        </ul>
        {open.length > 0 && <h2 className="mb-2 mt-6 px-1 text-[16px] font-semibold">Groups you can join</h2>}
        <ul>
          {open.map((g) => {
            const fit = fitsMe(s, g);
            return (
              <motion.li key={g.id} layout layoutId={`grp-${g.id}`} transition={spring} className="mb-2.5">
                <button type="button" onClick={() => act.sheet({ t: "peek", kind: "group", id: g.id })} className="press flex w-full items-center gap-3.5 rounded-[22px] bg-[var(--card)] p-4 text-left">
                  <GroupMark g={g} hue={c.hue} quiet />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16.5px] font-semibold">{g.name}</span>
                    <span className="block truncate text-[14.5px] text-[var(--soft)]">{g.topic}</span>
                    {fit && <span className="mt-1 block text-[13.5px] font-medium text-[var(--brand)]">You&apos;re here for {fit.toLowerCase().replace("ai", "AI").replace("here to ", "")}</span>}
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1.5"><Faces ids={g.members.slice(0, 3)} size={24} /><span className="text-[13px] text-[var(--soft)]">{count(g.size)}</span></span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </>
  );
}

/** The community's feed: everyone's posts and your groups', never a group you're not in. */
function Feed({ id, now, onPeople }: { id: string; now: number; onPeople: () => void }) {
  const { s, act } = useStore();
  const [only, setOnly] = useState<string>("all");
  const mine = s.groups.filter((g) => g.communityId === id && g.joined);
  const all = feedFor(s, id);
  const shown = all.filter(({ p }) => only === "all" || (only === "whole" ? !p.groupId : p.groupId === only));
  const chips = [["all", "For you"], ["whole", "Whole community"], ...mine.map((g) => [g.id, g.name])];
  const tease = openGroups(s, id).map((g) => ({ g, p: s.posts.find((x) => x.groupId === g.id) })).find((x) => x.p);
  return (
    <>
      <button type="button" onClick={() => act.sheet({ t: "post", communityId: id, groupId: mine.some((g) => g.id === only) ? only : undefined })} className="press mb-3 flex min-h-[56px] w-full items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]"><Avatar id="me" size={34} /> Share something here</button>
      {mine.length > 0 && <div className="scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">{chips.map(([v, l]) => <button key={v} type="button" aria-pressed={only === v} onClick={() => setOnly(v)} className="press min-h-[44px] flex-none rounded-full px-4 text-[14.5px] font-medium" style={{ background: only === v ? "var(--sun)" : "var(--card)" }}>{l}</button>)}</div>}
      {shown.map(({ p, reason }, i) => (
        <motion.div key={p.id} layout="position" transition={spring}>
          <PostCard post={p} now={now} reason={reason} from={p.groupId ? s.groups.find((g) => g.id === p.groupId)?.name : undefined} />
          {i === 1 && only === "all" && tease?.p && (
            <button type="button" onClick={() => act.sheet({ t: "peek", kind: "group", id: tease.g.id })} className="press mb-3 w-full rounded-[22px] border-2 border-dashed border-[var(--line)] p-4 text-left">
              <span className="block text-[14px] text-[var(--soft)]">In {tease.g.name}, a group you&apos;re not in yet</span>
              <span className="mt-1 line-clamp-2 block text-[16px] leading-snug">{firstOf(tease.p.by)}: “{tease.p.text}”</span>
              <span className="mt-2 block text-[14.5px] font-semibold text-[var(--brand)]">Look inside</span>
            </button>
          )}
        </motion.div>
      ))}
      <CaughtUp id={id} empty={shown.length === 0} onPeople={onPeople} />
    </>
  );
}

/** A feed that ends. The last thing in it is a person, not another post. */
function CaughtUp({ id, empty, onPeople }: { id: string; empty: boolean; onPeople: () => void }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const who = byFit(s, c.members).map((m) => person(m)!).find((p) => !s.saved.includes(p.id) && !(s.threads[`d:${p.id}`] ?? []).length);
  const o = who ? overlap(s, who) : null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={spring} className="rounded-[24px] p-5 text-white" style={{ background: `hsl(${c.hue} 46% 30%)` }}>
      <p className="text-[19px] font-semibold leading-tight">{empty ? "Nothing here yet" : "That's everything"}</p>
      <p className="mt-1 text-[15px] leading-snug text-white/80">{who ? "Now go and meet someone." : "Go outside. We'll keep your seat."}</p>
      {who && o && (
        <button type="button" onClick={() => act.push({ t: "person", id: who.id })} className="press mt-4 flex w-full items-center gap-3.5 rounded-[18px] bg-white/12 p-3 text-left">
          <Avatar id={who.id} size={48} />
          <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{who.name}</span><span className="block text-[14px] leading-snug text-white/80">{o.line ?? who.headline}</span></span>
          <ChevronRight size={20} className="flex-none" />
        </button>
      )}
      <button type="button" onClick={onPeople} className="mt-1 min-h-[44px] text-[14.5px] text-white/80 underline underline-offset-4">See all {count(c.size)}</button>
    </motion.div>
  );
}

function People({ ids, size, hosts = [], me = false }: { ids: string[]; size: number; hosts?: string[]; me?: boolean }) {
  const { s, act } = useStore();
  const [q, setQ] = useState("");
  const [want, setWant] = useState<string | null>(null);
  const big = size > 1000;
  const wants = INTENTS.filter((i) => ids.some((m) => person(m)?.intents.includes(i)));
  const people = byFit(s, ids).map((m) => person(m)).filter((p) => p !== null).filter((p) => !want || p.intents.includes(want)).filter((p) => `${p.name} ${p.headline} ${p.intents.join(" ")} ${p.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <input className="field mb-3" placeholder={big ? `Search ${count(size)} people` : "Search by name, skill or what they want"} aria-label="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">{wants.map((i) => <button key={i} type="button" aria-pressed={want === i} onClick={() => setWant(want === i ? null : i)} className="press min-h-[44px] flex-none rounded-full px-4 text-[14.5px] font-medium" style={{ background: want === i ? "var(--sun)" : "var(--card)" }}>{i}</button>)}</div>
      {big && !q && !want && <h2 className="mb-2.5 px-1 text-[16px] font-semibold">Start with these</h2>}
      {me && hosts.includes("me") && !q && !want && <p className="mb-2.5 rounded-[18px] bg-[var(--brand-soft)] px-4 py-3 text-[15px] font-medium text-[var(--brand)]">You host this community</p>}
      {people.map((p) => {
        const why = overlap(s, p);
        return (
          <button key={p.id} type="button" onClick={() => act.push({ t: "person", id: p.id })} className="press mb-2.5 flex w-full items-start gap-3.5 rounded-[20px] bg-[var(--card)] p-4 text-left">
            <Avatar id={p.id} size={48} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2"><span className="text-[16.5px] font-semibold leading-tight">{p.name}</span>{hosts.includes(p.id) && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[12.5px] font-medium text-[var(--brand)]">Host</span>}</span>
              <span className="block text-[14.5px] text-[var(--soft)]">{p.headline}</span>
              <span className="mt-2 flex flex-wrap gap-1.5">{p.intents.map((i) => <Tag key={i}>{i}</Tag>)}</span>
              {why.fits && <span className="mt-2 block text-[14px] font-medium text-[var(--brand)]">{why.line}</span>}
            </span>
          </button>
        );
      })}
      {people.length === 0 && <p className="mt-8 text-center text-[15px] text-[var(--soft)]">{q || want ? "Nobody matches that. Try a skill or an interest." : "Just you, for now."}</p>}
    </>
  );
}

// ------------------------------------------------------------ announcements
/** One voice to everyone. Members can react and reply; only hosts speak. */
export function ChannelScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const c = s.communities.find((x) => x.id === id)!;
  const host = isHost(s, id);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none border-b border-[var(--line)] bg-[var(--card)]"><Bar title="Announcements" sub={`${c.name}, ${count(c.size)} members`} right={<span className="mr-4"><Glyph c={c} size={36} /></span>} /></div>
      <div className="scroll flex-1 px-4 pb-6 pt-4">
        <AnimatePresence initial={false}>
          {announcements(s, id).map((p) => <motion.div key={p.id} layout initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={spring}><PostCard post={p} now={now} /></motion.div>)}
        </AnimatePresence>
      </div>
      <div className="flex-none border-t border-[var(--line)] bg-[var(--card)] px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
        {host ? <button type="button" className="btn btn-main w-full" onClick={() => act.sheet({ t: "post", communityId: id, announce: true })}>Announce to {count(c.size)} people</button>
          : <p className="py-2 text-center text-[14.5px] text-[var(--soft)]">Only {c.hosts.map(firstOf).join(" and ")} can post here</p>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ group
const G_TABS = ["chat", "feed", "people"] as const;
const G_LABEL = { chat: "Chat", feed: "Feed", people: "People" };

export function GroupScreen({ id, initial = "chat" }: { id: string; initial?: (typeof G_TABS)[number] }) {
  const { s, act } = useStore();
  const [tab, setTab] = useState<(typeof G_TABS)[number]>(initial);
  const now = useNow(20_000);
  const g = s.groups.find((x) => x.id === id);
  if (!g) return null;
  const c = s.communities.find((x) => x.id === g.communityId)!;
  const posts = s.posts.filter((p) => p.groupId === id).sort((a, b) => b.at - a.at);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none border-b border-[var(--line)] bg-[var(--card)]">
        <Bar title={g.name} sub={<><span style={{ color: `hsl(${c.hue} 48% 34%)` }}>{c.name}</span>, {count(g.size)} {g.size === 1 ? "person" : "people"}</>} onTitle={() => act.sheet({ t: "group", id })}
          right={<button type="button" aria-label="About this group" className="press mr-3" onClick={() => act.sheet({ t: "group", id })}><GroupMark g={g} hue={c.hue} size={40} /></button>} />
        <Tabs id={`g${id}`} tabs={G_TABS} label={G_LABEL} value={tab} onChange={setTab} />
      </div>
      {tab === "chat" && <Thread thread={`g:${id}`} />}
      {tab === "feed" && (
        <div className="scroll flex-1 px-4 pb-10 pt-4">
          <button type="button" onClick={() => act.sheet({ t: "post", communityId: g.communityId, groupId: id })} className="press mb-3 flex min-h-[56px] w-full items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]"><Avatar id="me" size={34} /> Share with {g.name}</button>
          <AnimatePresence initial={false}>{posts.map((p) => <motion.div key={p.id} layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={spring}><PostCard post={p} now={now} /></motion.div>)}</AnimatePresence>
          <p className="py-4 text-center text-[14.5px] text-[var(--soft)]">{posts.length ? "That's everything here" : "Nothing yet. The first post sets the tone."}</p>
        </div>
      )}
      {tab === "people" && <div className="scroll flex-1 px-4 pb-10 pt-4"><People ids={g.members} size={g.size} /></div>}
    </div>
  );
}

// ------------------------------------------------------------ arriving
/** The moment of joining. The circle opens a place, and you drop into it. */
export function Arrival({ id, groupId: want }: { id: string; groupId?: string }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const open = [...openGroups(s, c.id)].sort((a, b) => Number(b.id === want) - Number(a.id === want)).slice(0, 4);
  const [picked, setPicked] = useState<string[]>(() => { const fit = open.filter((g) => g.id === want || fitsMe(s, g)).map((g) => g.id); return fit.length ? fit.slice(0, 2) : []; });
  const faces = byFit(s, c.members).slice(0, 5);
  const n = faces.length + 1;
  const host = c.hosts.find((h) => h !== "me");
  const step = () => act.settle(picked, want && picked.includes(want) ? want : undefined);
  return (
    <motion.div className="absolute inset-0 z-40 flex flex-col overflow-hidden text-white" style={{ background: `hsl(${c.hue} 46% 26%)` }} initial={{ clipPath: "circle(0% at 50% 34%)" }} animate={{ clipPath: "circle(140% at 50% 34%)" }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} role="dialog" aria-modal="true" aria-label={`You're in ${c.name}`}>
      <div className="relative grid min-h-[150px] flex-1 place-items-center [@media(max-height:720px)]:items-end">
        <div className="relative h-[216px] w-[216px] [@media(max-height:720px)]:origin-bottom [@media(max-height:720px)]:scale-[0.62]" aria-hidden="true">
          {[1.35, 1.75].map((d) => <motion.span key={d} className="absolute inset-0 rounded-full border-2 border-white/40" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.7, opacity: [0, 0.6, 0] }} transition={{ delay: d, duration: 1.5 }} />)}
          <motion.span className="absolute left-[72px] top-[72px]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.15 }}><Glyph c={c} size={72} /></motion.span>
          {faces.map((m, i) => {
            const at = (k: number, of: number) => { const a = (k / of) * Math.PI * 2 - Math.PI / 2; return { left: 108 + 84 * Math.cos(a) - 26, top: 108 + 84 * Math.sin(a) - 26 }; };
            const before = at(i, faces.length), after = at(i + 1, n);
            return <motion.span key={m} className="absolute" initial={{ ...before, scale: 0 }} animate={{ left: [before.left, before.left, after.left], top: [before.top, before.top, after.top], scale: 1 }} transition={{ left: { times: [0, 0.6, 1], duration: 1.15 }, top: { times: [0, 0.6, 1], duration: 1.15 }, scale: { ...spring, delay: 0.2 + i * 0.06 } }}><Avatar id={m} size={52} /></motion.span>;
          })}
          <motion.span className="absolute rounded-full ring-4 ring-[var(--sun)]" style={{ left: 82, top: -2 }} initial={{ y: -260, scale: 1.5, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 17, delay: 1.05 }} onAnimationComplete={() => navigator.vibrate?.([12, 30, 24])}><Avatar id="me" size={52} /></motion.span>
        </div>
      </div>
      <motion.div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, ...spring }}>
        <h1 className="text-[33px] font-semibold leading-[1.04] tracking-[-0.03em]">You&apos;re in.</h1>
        <p className="mt-1.5 text-[16.5px] leading-snug text-white/85">{c.name} was {count(c.size - 1)} people.{c.size < 10_000 ? ` With you, it's ${count(c.size)}.` : " Now it has you."}{host ? ` ${firstOf(host)} hosts.` : ""}</p>
        {open.length > 0 && (
          <>
            <h2 className="mt-5 text-[15px] font-medium text-white/80 [@media(max-height:720px)]:mt-3">Where do you want to start?</h2>
            <ul className="scroll mt-2 grid max-h-[256px] grid-cols-[minmax(0,1fr)] gap-2 [@media(max-height:720px)]:max-h-[190px]">
              {open.map((g, i) => {
                const on = picked.includes(g.id);
                const fit = fitsMe(s, g);
                return (
                  <motion.li key={g.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + i * 0.08, ...spring }}>
                    <button type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== g.id) : [...picked, g.id])} className="press flex min-h-[58px] w-full min-w-0 items-center gap-3 rounded-[18px] px-3.5 text-left" style={{ background: on ? "#fff" : "rgba(255,255,255,0.12)", color: on ? "var(--ink)" : "#fff" }}>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold leading-tight">{g.name}</span><span className="block truncate text-[13.5px] opacity-75">{fit ? `For “${fit}”` : g.topic}</span></span>
                      <Faces ids={g.members.slice(0, 2)} size={26} />
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full" style={{ background: on ? "var(--sun)" : "rgba(255,255,255,0.16)", color: "var(--ink)" }}>{on && <Check size={16} />}</span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
        <button type="button" className="btn btn-sun mt-5 w-full" onClick={step}>{picked.length ? `Step in, ${picked.length} ${picked.length === 1 ? "group" : "groups"}` : "Step in"}</button>
      </motion.div>
    </motion.div>
  );
}

/** A group seen from outside: who's in it and what they're saying. */
export function GroupGlance({ g }: { g: Group }) {
  const { s } = useStore();
  const now = useNow(20_000);
  const c = s.communities.find((x) => x.id === g.communityId)!;
  const post = s.posts.find((p) => p.groupId === g.id);
  const fits = byFit(s, g.members).filter((m) => { const p = person(m); return p && overlap(s, p).fits; });
  return (
    <>
      <div className="flex items-center gap-4"><GroupMark g={g} hue={c.hue} size={58} /><div className="min-w-0"><p className="text-[21px] font-semibold leading-tight tracking-[-0.01em]">{g.name}</p><p className="text-[14.5px] text-[var(--soft)]">{c.name}, {count(g.size)} people</p></div></div>
      <p className="mt-4 text-[16px] leading-snug">{g.topic}</p>
      {post && <div className="mt-4 rounded-[20px] bg-[var(--sunk)] p-4"><p className="flex items-center gap-2 text-[14px] text-[var(--soft)]"><Avatar id={post.by} size={26} /> {nameOf(post.by)}, {ago(post.at, now)}</p><p className="mt-2 text-[16px] leading-snug">{post.text}</p></div>}
      <div className="mt-4 flex items-center gap-3"><Faces ids={byFit(s, g.members).slice(0, 4)} size={36} /><p className="text-[15px] leading-snug">{fits.length ? `${fits.slice(0, 2).map(firstOf).join(" and ")} ${fits.length === 1 ? "is" : "are"} in here, and worth meeting` : `${g.members.slice(0, 2).map(firstOf).join(" and ")} talk here`}</p></div>
    </>
  );
}

function EventRow({ e }: { e: Event }) {
  const { act } = useStore();
  const now = useNow(20_000);
  const live = e.startsAt <= now;
  return (
    <button type="button" onClick={() => act.push(live && e.ticket ? { t: "room", id: e.id } : { t: "event", id: e.id })} className="press mb-2.5 w-full rounded-[20px] bg-[var(--card)] p-4 text-left">
      <span className="text-[14px] font-medium" style={{ color: live ? "var(--live)" : "var(--brand)" }}>{live ? "Happening now" : when(e.startsAt)}</span>
      <span className="mt-0.5 block text-[17px] font-semibold leading-snug">{e.title}</span>
      <span className="mt-1 flex justify-between text-[14px] text-[var(--soft)]"><span className="truncate">{e.place}</span><span className="font-semibold text-[var(--ink)]">{e.ticket ? "Going" : e.price ? `₹${e.price.toLocaleString("en-IN")}` : "Free"}</span></span>
    </button>
  );
}

export function PostCard({ post: p, now, reason = null, from }: { post: Post; now: number; reason?: string | null; from?: string }) {
  const { s, act } = useStore();
  const total = p.poll?.options.reduce((n, o) => n + o.votes, 0) ?? 0;
  const e = s.events.find((x) => x.id === p.eventId);
  return (
    <article className="mb-3 rounded-[22px] bg-[var(--card)] p-4">
      {(reason || from) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {from && <button type="button" onClick={() => p.groupId && act.push({ t: "chat", thread: `g:${p.groupId}`, tab: "feed" })} className="press rounded-full bg-[var(--sunk)] px-3 py-1.5 text-[13px] font-medium">{from}</button>}
          {reason && <span className="text-[13.5px] font-medium text-[var(--brand)]">{reason}</span>}
        </div>
      )}
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => p.by !== "me" && act.push({ t: "person", id: p.by })}>
        <Avatar id={p.by} size={42} />
        <span className="min-w-0 flex-1"><span className="flex items-baseline gap-2 leading-tight"><span className="truncate text-[15.5px] font-semibold">{p.by === "me" ? s.me?.name : nameOf(p.by)}</span><span className="flex-none text-[13px] text-[var(--soft)]">{ago(p.at, now)}</span></span><span className="block truncate text-[13.5px] text-[var(--soft)]">{p.by === "me" ? s.me?.headline : person(p.by)?.headline}</span></span>
        {p.tag && <Tag on>{p.tag}</Tag>}
      </button>
      <p className="mt-3 text-[16px] leading-[1.5]">{p.text}</p>
      {p.poll && (
        <div className="mt-3 grid gap-2">
          {p.poll.options.map((o, i) => {
            const pct = Math.round((o.votes / total) * 100);
            const voted = p.poll!.voted !== null;
            return (
              <button key={o.label} type="button" disabled={voted} onClick={() => act.vote(p.id, i)} className="relative min-h-[46px] overflow-hidden rounded-[14px] bg-[var(--sunk)] px-4 text-left text-[15px]">
                <motion.span className="absolute inset-y-0 left-0" style={{ background: p.poll!.voted === i ? "var(--sun)" : "#e2d7de" }} initial={false} animate={{ width: voted ? `${pct}%` : 0 }} transition={{ duration: 0.5 }} />
                <span className="relative flex justify-between font-medium"><span>{o.label}</span>{voted && <span className="digits">{pct}%</span>}</span>
              </button>
            );
          })}
        </div>
      )}
      {e && !e.dissolved && (
        <button type="button" onClick={() => act.push({ t: "event", id: e.id })} className="press mt-3 flex w-full items-center justify-between rounded-2xl bg-[var(--sunk)] px-4 py-3 text-left"><span><span className="block text-[15px] font-semibold">{e.title}</span><span className="text-[13.5px] text-[var(--soft)]">{when(e.startsAt)}</span></span><span className="text-[15px] font-semibold">{e.ticket ? "Going" : `₹${e.price}`}</span></button>
      )}
      <div className="-mb-2 mt-2 flex gap-1 text-[14.5px] text-[var(--soft)]">
        <button type="button" aria-pressed={p.liked} aria-label={p.liked ? "Unlike" : "Like"} className="press flex min-h-[44px] items-center gap-2 pr-4" style={{ color: p.liked ? "var(--live)" : undefined }} onClick={() => act.like(p.id)}>
          <motion.span key={`${p.liked}${p.by === "me" ? p.likes : ""}`} initial={{ scale: p.liked || (p.by === "me" && p.likes) ? 0.5 : 1 }} animate={{ scale: 1 }} transition={spring}><Heart size={19} fill={p.liked ? "currentColor" : "none"} /></motion.span><span className="digits">{p.likes}</span>
        </button>
        {p.announce && p.seen !== undefined && <span className="order-last ml-auto flex min-h-[44px] items-center text-[13.5px]"><span className="digits mr-1">{count(p.seen)}</span> saw this</span>}
        <button type="button" className="press flex min-h-[44px] items-center gap-2 pr-4" aria-label="Comments" onClick={() => act.sheet({ t: "comments", postId: p.id })}><MessageCircle size={19} /><span className="digits">{p.comments.length}</span></button>
      </div>
    </article>
  );
}
