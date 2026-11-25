"use client";

import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { BellOff, CalendarDays, Check, ChevronRight, Compass, Heart, Megaphone, MessageCircle, Plus, Share2, Store as Shop } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INTENTS, type Community, type Event, type Group, type Post } from "@/lib/data";
import { ago, announcements, byFit, count, feedFor, fitsMe, isHost, latest, openGroups, openNow, overlap, person, useNow, useStore, when } from "@/lib/store";
import { Avatar, Bar, Faces, Glyph, GroupMark, Tag, Unread, firstOf, nameOf, spring } from "./ui";

// ------------------------------------------------------------ the place
/**
 * One screen per community. The rail is its map: everything, then each group
 * you're in, then the ones you could join. Swipe or tap and the feed slides
 * across; there is nowhere deeper to get lost in, and no chat to keep up with.
 */
export function CommunityScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const c = s.communities.find((x) => x.id === id)!;
  const mine = s.groups.filter((g) => g.communityId === id && g.joined);
  const pages = ["all", ...mine.map((g) => g.id), "explore"];
  const spot = s.spot[id] ?? { at: "all" };
  const at = pages.includes(spot.at) ? spot.at : "all";
  const index = pages.indexOf(at);
  const group = mine.find((g) => g.id === at) ?? null;
  const live = s.events.some((e) => e.communityId === id && !e.dissolved && e.startsAt <= now);
  const go = (to: string) => act.spot(id, { at: to });

  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const x = useMotionValue(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // First measure jumps into place; every move after that glides.
  const ready = useRef(false);
  useEffect(() => {
    if (!w) return;
    if (!ready.current) { ready.current = true; x.set(-index * w); return; }
    const a = animate(x, -index * w, { type: "spring", stiffness: 360, damping: 38 });
    return () => a.stop();
  }, [index, w, x]);
  const onDragEnd = (_: unknown, i: PanInfo) => {
    const step = i.offset.x + i.velocity.x * 0.18;
    const next = Math.max(0, Math.min(pages.length - 1, index + (step < -w * 0.32 ? 1 : step > w * 0.32 ? -1 : 0)));
    if (next === index) animate(x, -index * w, { type: "spring", stiffness: 360, damping: 38 });
    else { navigator.vibrate?.(5); go(pages[next]); }
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none text-white" style={{ background: `hsl(${c.hue} 46% 28%)` }}>
        <Bar dark title={c.name} sub={group ? `${group.name}, ${count(group.size)} ${group.size === 1 ? "person" : "people"}` : `${count(c.size)} people${c.online ? ", every city" : ""}`} onTitle={() => act.push({ t: "people", id, groupId: group?.id })}
          right={
            <span className="flex flex-none items-center pr-2">
              <button type="button" aria-label="People" className="press mr-1 flex min-h-[44px] items-center" onClick={() => act.push({ t: "people", id, groupId: group?.id })}><Faces ids={byFit(s, group?.members ?? c.members).slice(0, 3)} size={28} /></button>
              <button type="button" aria-label={live ? "Events, one on now" : "Events"} className="press relative grid h-11 w-10 place-items-center" onClick={() => act.push({ t: "events", id })}><CalendarDays size={21} />{live && <span className="dot-live absolute right-1 top-2 h-2.5 w-2.5 rounded-full bg-[var(--live)] ring-2 ring-white/90" />}</button>
              <button type="button" aria-label="Pass the key" className="press grid h-11 w-10 place-items-center" onClick={() => act.sheet({ t: "key", kind: group ? "group" : "community", id: group?.id ?? id })}><Share2 size={20} /></button>
            </span>
          } />
        <Rail c={c} groups={mine} at={at} onPick={go} />
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-clip">
        <motion.div className="flex h-full touch-pan-y" style={{ x, width: w ? w * pages.length : "100%" }} drag={w ? "x" : false} dragDirectionLock dragMomentum={false} dragElastic={0.14} dragConstraints={{ left: -(pages.length - 1) * w, right: 0 }} onDragEnd={onDragEnd}>
          {pages.map((p, i) => (
            <div key={p} className="relative h-full flex-none" style={{ width: w || "100%" }} inert={i !== index} role="tabpanel" aria-label={p === "all" ? "Everything" : p === "explore" ? "Explore" : mine.find((g) => g.id === p)?.name}>
              {Math.abs(i - index) < 2 && (p === "all" ? <AllPage c={c} now={now} onGo={go} /> : p === "explore" ? <ExplorePage c={c} /> : <GroupPage g={mine.find((g) => g.id === p)!} c={c} now={now} />)}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function Rail({ c, groups, at, onPick }: { c: Community; groups: Group[]; at: string; onPick: (id: string) => void }) {
  const { s } = useStore();
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = row.current?.querySelector<HTMLElement>(`[data-spot="${at}"]`); if (el && row.current) row.current.scrollTo({ left: el.offsetLeft - row.current.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" }); }, [at]);
  const open = openGroups(s, c.id).length;
  const cell = (id: string, label: string, mark: React.ReactNode, n = 0, ring = false) => (
    <motion.button key={id} layout type="button" role="tab" data-spot={id} aria-selected={at === id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={spring} onClick={() => { navigator.vibrate?.(5); onPick(id); }} className="relative flex w-[78px] flex-none flex-col items-center gap-1 pb-2">
      <span className="relative grid h-[54px] w-[54px] place-items-center">
        {at === id && <motion.span layoutId={`spot-${c.id}`} transition={spring} className="absolute inset-0 rounded-[21px] bg-[var(--sun)]" />}
        {ring && at !== id && <span className="absolute inset-0 rounded-[21px] border-[2.5px] border-[var(--sun)]" aria-hidden="true" />}
        <span className="relative">{mark}</span>
        {n > 0 && <span className="absolute -right-1.5 -top-1"><Unread n={n} /></span>}
      </span>
      <span className="w-full truncate px-0.5 text-center text-[12.5px] leading-tight" style={{ fontWeight: at === id ? 600 : 400, opacity: at === id ? 1 : 0.8 }}>{label}</span>
    </motion.button>
  );
  return (
    <div ref={row} className="scroll relative flex overflow-x-auto px-2 pt-1.5" role="tablist" aria-label={`Places in ${c.name}`}>
      <AnimatePresence initial={false}>
        {cell("all", "Everything", <Glyph c={c} size={46} />, 0, (s.unread[`a:${c.id}`] ?? 0) > 0)}
        {groups.map((g) => cell(g.id, g.name, <GroupMark g={g} hue={c.hue} size={46} />, g.muted ? 0 : (s.unread[`f:${g.id}`] ?? 0)))}
        {cell("explore", open ? `${open} more` : "Explore", <span className="grid h-[46px] w-[46px] place-items-center rounded-[17px] bg-white/18 text-white"><Compass size={22} /></span>)}
      </AnimatePresence>
    </div>
  );
}

function Composer({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="press mb-3 flex min-h-[56px] w-full items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]"><Avatar id="me" size={34} /> {label}</button>;
}

/** The whole community: the hosts first, then everyone, then your groups. */
function AllPage({ c, now, onGo }: { c: Community; now: number; onGo: (id: string) => void }) {
  const { s, act } = useStore();
  const { note } = latest(s, c);
  const next = s.events.filter((e) => e.communityId === c.id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt)[0];
  const isNow = next && next.startsAt <= now;
  const feed = feedFor(s, c.id);
  const tease = openGroups(s, c.id).map((g) => ({ g, p: s.posts.find((x) => x.groupId === g.id) })).find((x) => x.p);
  return (
    <div className="scroll h-full px-4 pb-24 pt-4">
      {c.biz && isHost(s, c.id) && s.movedIn[c.id] === undefined && (
        <motion.button type="button" layout exit={{ opacity: 0 }} onClick={() => act.push({ t: "movein", id: c.id })} className="press mb-3 flex w-full items-center gap-3.5 rounded-[22px] bg-[var(--sun)] p-4 text-left">
          <Shop size={24} className="flex-none" /><span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold leading-tight">Bring in your WhatsApp customers</span><span className="text-[14px]">They know you. Let them know each other.</span></span><ChevronRight size={20} className="flex-none" />
        </motion.button>
      )}
      {c.biz && (
        <div className="mb-3 flex items-center gap-3 rounded-[20px] bg-[var(--card)] py-2 pl-4 pr-2">
          <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-medium leading-tight">{openNow(c.biz, now)}</span>{c.biz.catalogue ? <a className="text-[14px] text-[var(--brand)] underline underline-offset-2" href={c.biz.catalogue} target="_blank" rel="noreferrer">See the catalogue</a> : <span className="text-[14px] text-[var(--soft)]">{c.biz.kind}</span>}</span>
          {!isHost(s, c.id) || s.movedIn[c.id] !== undefined ? <button type="button" onClick={() => act.sheet({ t: "ask", communityId: c.id })} className="press flex min-h-[44px] flex-none items-center gap-2 rounded-[16px] bg-[var(--brand-soft)] px-4 text-[14.5px] font-semibold text-[var(--brand)]"><MessageCircle size={17} />Ask on WhatsApp</button> : null}
        </div>
      )}
      {note && (
        <button type="button" onClick={() => act.push({ t: "channel", id: c.id })} className="press mb-3 w-full rounded-[22px] p-4 text-left text-white" style={{ background: `hsl(${c.hue} 46% 36%)` }}>
          <span className="flex items-center gap-2 text-[14px] text-white/85"><Megaphone size={16} /> {note.by === "me" ? "You" : firstOf(note.by)} to everyone, {ago(note.at, now)}<ChevronRight size={17} className="ml-auto" /></span>
          <span className="mt-1.5 block text-[16.5px] font-medium leading-snug">{note.text}</span>
        </button>
      )}
      {next && (
        <button type="button" onClick={() => act.push(isNow && next.ticket ? { t: "room", id: next.id } : { t: "event", id: next.id })} className="press mb-3 flex min-h-[58px] w-full items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 text-left">
          {isNow && <span className="dot-live h-2.5 w-2.5 flex-none rounded-full bg-[var(--live)]" />}
          <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-medium">{next.title}</span><span className="text-[13.5px] text-[var(--soft)]">{isNow ? "On now" : when(next.startsAt)}</span></span>
          <Faces ids={byFit(s, next.going).slice(0, 3)} size={28} />
        </button>
      )}
      <Composer label="Share with everyone" onClick={() => act.sheet({ t: "post", communityId: c.id })} />
      <AnimatePresence initial={false}>
        {feed.map(({ p, reason }, i) => (
          <motion.div key={p.id} layout="position" initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
            <PostCard post={p} now={now} reason={reason} from={p.groupId ? s.groups.find((g) => g.id === p.groupId)?.name : undefined} onFrom={() => p.groupId && onGo(p.groupId)} />
            {i === 1 && tease?.p && (
              <button type="button" onClick={() => act.sheet({ t: "peek", kind: "group", id: tease.g.id })} className="press mb-3 w-full rounded-[22px] border-2 border-dashed border-[var(--line)] p-4 text-left">
                <span className="block text-[14px] text-[var(--soft)]">In {tease.g.name}, a group you&apos;re not in yet</span>
                <span className="mt-1 line-clamp-2 block text-[16px] leading-snug">{firstOf(tease.p.by)}: “{tease.p.text}”</span>
                <span className="mt-2 block text-[14.5px] font-semibold text-[var(--brand)]">Look inside</span>
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <CaughtUp hue={c.hue} ids={c.members} empty={feed.length === 0} />
    </div>
  );
}

const STARTERS = [["Introduce yourself", "Hi, I'm "], ["Ask for one thing", "I'm stuck on "], ["Offer one thing", "Happy to help anyone with "]];

/** A group is its feed. Conversation happens as replies, under the thing it's about. */
function GroupPage({ g, c, now }: { g: Group; c: Community; now: number }) {
  const { s, act } = useStore();
  const posts = s.posts.filter((p) => p.groupId === g.id).sort((a, b) => b.at - a.at);
  const write = (draft?: string) => act.sheet({ t: "post", communityId: c.id, groupId: g.id, draft });
  return (
      <div className="scroll h-full px-4 pb-24 pt-4">
        <button type="button" onClick={() => act.sheet({ t: "group", id: g.id })} className="press mb-3 flex w-full items-center gap-3 px-1 text-left">
          <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-[22px] font-semibold leading-tight tracking-[-0.02em]">{g.name}</span>{g.muted && <BellOff size={16} className="text-[var(--soft)]" aria-label="Muted" />}</span><span className="block truncate text-[14.5px] text-[var(--soft)]">{g.topic || "No topic yet"}</span></span>
          <ChevronRight size={20} className="flex-none text-[var(--soft)]" />
        </button>
        <Composer label={`Share with ${g.name}`} onClick={() => write()} />
        <AnimatePresence initial={false}>
          {posts.map((p) => {
            const who = person(p.by);
            const o = who ? overlap(s, who) : null;
            return <motion.div key={p.id} layout="position" initial={{ opacity: 0, y: -30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}><PostCard post={p} now={now} reason={o?.fits ? o.line : null} /></motion.div>;
          })}
        </AnimatePresence>
        {posts.length === 0 ? (
          <div className="rounded-[24px] bg-[var(--card)] p-5">
            <p className="text-[19px] font-semibold leading-tight">The first post sets the tone</p>
            <div className="mt-3 grid gap-2">{STARTERS.map(([l, d]) => <button key={l} type="button" onClick={() => write(d)} className="press flex min-h-[50px] items-center justify-between rounded-[16px] bg-[var(--sunk)] px-4 text-left text-[15.5px] font-medium">{l}<ChevronRight size={18} className="text-[var(--soft)]" /></button>)}</div>
          </div>
        ) : <CaughtUp hue={c.hue} ids={g.members} />}
      </div>
  );
}

/** Groups from the outside, the ones made for you first. */
function ExplorePage({ c }: { c: Community }) {
  const { s, act } = useStore();
  const open = openGroups(s, c.id);
  return (
    <div className="scroll h-full px-4 pb-24 pt-4">
      <h2 className="px-1 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{open.length ? "Where else you'd fit" : "You're in every group"}</h2>
      <ul className="mt-3">
        {open.map((g, i) => {
          const fit = fitsMe(s, g);
          const post = s.posts.find((p) => p.groupId === g.id);
          return (
            <motion.li key={g.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.04 }} className="mb-3">
              <button type="button" onClick={() => act.sheet({ t: "peek", kind: "group", id: g.id })} className="press w-full rounded-[22px] bg-[var(--card)] p-4 text-left">
                <span className="flex items-center gap-3.5"><GroupMark g={g} hue={c.hue} size={48} /><span className="min-w-0 flex-1"><span className="block truncate text-[17px] font-semibold">{g.name}</span><span className="block truncate text-[14px] text-[var(--soft)]">{fit ? `Because you said “${fit}”` : g.topic}</span></span><span className="flex flex-none flex-col items-end gap-1"><Faces ids={g.members.slice(0, 3)} size={26} /><span className="text-[13px] text-[var(--soft)]">{count(g.size)}</span></span></span>
                {post && <span className="mt-3 line-clamp-2 block text-[15.5px] leading-snug">{firstOf(post.by)}: “{post.text}”</span>}
              </button>
            </motion.li>
          );
        })}
        <li><button type="button" onClick={() => act.sheet({ t: "newgroup", communityId: c.id })} className="press flex min-h-[70px] w-full items-center gap-3.5 rounded-[22px] border-2 border-dashed border-[var(--line)] px-4 text-left"><span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><Plus size={22} /></span><span><span className="block text-[16.5px] font-semibold">Start a group</span><span className="text-[14px] text-[var(--soft)]">Yours from the first word</span></span></button></li>
      </ul>
    </div>
  );
}

/** A feed that ends. The last thing in it is a person, not another post. */
function CaughtUp({ hue, ids, empty = false }: { hue: number; ids: string[]; empty?: boolean }) {
  const { s, act } = useStore();
  const who = byFit(s, ids).map((m) => person(m)).find((p) => p && !s.saved.includes(p.id) && !(s.threads[`d:${p.id}`] ?? []).length);
  const o = who ? overlap(s, who) : null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={spring} className="rounded-[24px] p-5 text-white" style={{ background: `hsl(${hue} 46% 28%)` }}>
      <p className="text-[19px] font-semibold leading-tight">{empty ? "Nothing here yet" : "That's everything"}</p>
      <p className="mt-1 text-[15px] leading-snug text-white/80">{who ? "Now go and meet someone." : "Go outside. We'll keep your seat."}</p>
      {who && o && (
        <button type="button" onClick={() => act.push({ t: "person", id: who.id })} className="press mt-4 flex w-full items-center gap-3.5 rounded-[18px] bg-white/12 p-3 text-left">
          <Avatar id={who.id} size={48} />
          <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{who.name}</span><span className="block text-[14px] leading-snug text-white/80">{o.line ?? who.headline}</span></span>
          <ChevronRight size={20} className="flex-none" />
        </button>
      )}
    </motion.div>
  );
}

// ------------------------------------------------------------ people and events, for wherever you're standing
export function PeopleScreen({ id, groupId }: { id: string; groupId?: string }) {
  const { s } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const g = s.groups.find((x) => x.id === groupId);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none border-b border-[var(--line)] bg-[var(--card)]"><Bar title={`${count(g?.size ?? c.size)} ${(g?.size ?? c.size) === 1 ? "person" : "people"}`} sub={g ? `${g.name}, ${c.name}` : c.name} /></div>
      <div className="scroll flex-1 px-4 pb-10 pt-4"><People ids={g?.members ?? c.members} size={g?.size ?? c.size} hosts={c.hosts} me={!g} /></div>
    </div>
  );
}

export function EventsScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const events = s.events.filter((e) => e.communityId === id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none border-b border-[var(--line)] bg-[var(--card)]"><Bar title="Events" sub={c.name} /></div>
      <div className="scroll flex-1 px-4 pb-10 pt-4">
        {events.length === 0 && <p className="mb-4 mt-6 text-center text-[16px] text-[var(--soft)]">Nothing planned. Someone has to go first.</p>}
        {events.map((e) => <EventRow key={e.id} e={e} />)}
        <button type="button" className="btn btn-quiet mt-1 w-full" onClick={() => act.sheet({ t: "host", communityId: id })}>Host something</button>
      </div>
    </div>
  );
}

export function People({ ids, size, hosts = [], me = false }: { ids: string[]; size: number; hosts?: string[]; me?: boolean }) {
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
      <div className="mt-4 flex items-center gap-3"><Faces ids={byFit(s, g.members).slice(0, 4)} size={36} /><p className="text-[15px] leading-snug">{fits.length ? `${fits.slice(0, 2).map(firstOf).join(" and ")} ${fits.length === 1 ? "is" : "are"} in here, and worth meeting` : `${g.members.slice(0, 2).map(firstOf).join(" and ")} are in here`}</p></div>
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

/** Eight sparks off a heart, once. */
function Burst() {
  return <span className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <motion.span key={i} className="absolute -ml-[2.5px] -mt-[2.5px] h-[5px] w-[5px] rounded-full" style={{ background: i % 2 ? "var(--sun)" : "var(--live)" }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 24, y: Math.sin(a) * 24, opacity: 0, scale: 0.4 }} transition={{ duration: 0.55, ease: "easeOut" }} />; })}</span>;
}

export function PostCard({ post: p, now, reason = null, from, onFrom }: { post: Post; now: number; reason?: string | null; from?: string; onFrom?: () => void }) {
  const { s, act } = useStore();
  const total = p.poll?.options.reduce((n, o) => n + o.votes, 0) ?? 0;
  const e = s.events.find((x) => x.id === p.eventId);
  return (
    <article className="mb-3 rounded-[22px] bg-[var(--card)] p-4">
      {(reason || from) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {from && <button type="button" onClick={onFrom} className="press rounded-full bg-[var(--sunk)] px-3 py-1.5 text-[13px] font-medium">{from}</button>}
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
      {p.comments.length > 0 && (
        <button type="button" onClick={() => act.sheet({ t: "comments", postId: p.id })} className="press mt-3 flex w-full items-start gap-2.5 rounded-[18px] bg-[var(--sunk)] p-3 text-left">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={p.comments.length} className="flex min-w-0 flex-1 items-start gap-2.5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <Avatar id={p.comments.at(-1)!.by} size={26} />
              <span className="min-w-0 flex-1 text-[14.5px] leading-snug"><span className="line-clamp-2"><span className="font-semibold">{p.comments.at(-1)!.by === "me" ? "You" : firstOf(p.comments.at(-1)!.by)}</span> {p.comments.at(-1)!.text}</span>{p.comments.length > 1 && <span className="mt-0.5 block text-[13.5px] text-[var(--soft)]">See all {p.comments.length} replies</span>}</span>
            </motion.span>
          </AnimatePresence>
        </button>
      )}
      <div className="-mb-2 mt-2 flex gap-1 text-[14.5px] text-[var(--soft)]">
        <button type="button" aria-pressed={p.liked} aria-label={p.liked ? "Unlike" : "Like"} className="press flex min-h-[44px] items-center gap-2 pr-4" style={{ color: p.liked ? "var(--live)" : undefined }} onClick={() => { if (!p.liked) navigator.vibrate?.(10); act.like(p.id); }}>
          <span className="relative"><motion.span className="block" key={`${p.liked}${p.by === "me" ? p.likes : ""}`} initial={{ scale: p.liked || (p.by === "me" && p.likes) ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 14 }}><Heart size={19} fill={p.liked ? "currentColor" : "none"} /></motion.span><AnimatePresence initial={false}>{p.liked && <Burst key="b" />}</AnimatePresence></span><span className="digits">{p.likes}</span>
        </button>
        {p.announce && p.seen !== undefined && <span className="order-last ml-auto flex min-h-[44px] items-center text-[13.5px]"><span className="digits mr-1">{count(p.seen)}</span> saw this</span>}
        <button type="button" className="press flex min-h-[44px] items-center gap-2 pr-4" aria-label="Reply" onClick={() => act.sheet({ t: "comments", postId: p.id })}><MessageCircle size={19} />{p.comments.length ? <span className="digits">{p.comments.length}</span> : "Reply"}</button>
      </div>
    </article>
  );
}
