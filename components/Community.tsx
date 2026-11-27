"use client";

import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { BellOff, Check, ChevronRight, ChevronsUpDown, Heart, Info, Lock, Megaphone, MessageCircle, Plus, Search, Share2, Store as Shop } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INTENTS, type Community, type Event, type Group, type Post } from "@/lib/data";
import { ago, announcements, byFit, count, day, feedFor, fitsMe, isHost, latest, openGroups, openNow, overlap, person, useNow, useStore, what, when } from "@/lib/store";
import { Avatar, Bar, Faces, Glyph, GroupMark, Tag, Unread, firstOf, nameOf, rectOf, spring } from "./ui";
import { DeskCard } from "./Host";
import { DropCard, known } from "./Commerce";
import { standing } from "@/lib/host";

// ------------------------------------------------------------ the shape every place shares
/** Tabs on top, pages underneath; swipe or tap. Communities and groups both use it, so nothing has to be learnt twice. */
function Place<T extends string>({ id, tabs, dark, badge, children }: { id: string; tabs: readonly (readonly [T, string])[]; dark: string; badge?: Partial<Record<T, number>>; children: (t: T) => React.ReactNode }) {
  const { s, act } = useStore();
  const at = s.spot[id]?.at;
  const index = Math.max(0, tabs.findIndex(([k]) => k === at));
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
  const ready = useRef(false);
  useEffect(() => {
    if (!w) return;
    if (!ready.current) { ready.current = true; x.set(-index * w); return; }
    const a = animate(x, -index * w, { type: "spring", stiffness: 360, damping: 38 });
    return () => a.stop();
  }, [index, w, x]);
  const onDragEnd = (_: unknown, i: PanInfo) => {
    const step = i.offset.x + i.velocity.x * 0.18;
    const next = Math.max(0, Math.min(tabs.length - 1, index + (step < -w * 0.32 ? 1 : step > w * 0.32 ? -1 : 0)));
    if (next === index) animate(x, -index * w, { type: "spring", stiffness: 360, damping: 38 });
    else { navigator.vibrate?.(5); act.spot(id, tabs[next][0]); }
  };
  return (
    <>
      <div className="flex flex-none px-2 text-white" style={{ background: dark }} role="tablist">
        {tabs.map(([k, label], i) => (
          <button key={k} type="button" role="tab" aria-selected={i === index} onClick={() => act.spot(id, k)} className="relative flex min-h-[46px] flex-1 items-center justify-center gap-1.5 text-[15px] font-medium" style={{ opacity: i === index ? 1 : 0.72 }}>
            {label}{badge?.[k] ? <Unread n={badge[k]!} /> : null}
            {i === index && <motion.span layoutId={`tab-${id}`} transition={spring} className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[var(--sun)]" />}
          </button>
        ))}
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-clip">
        <motion.div className="flex h-full touch-pan-y" style={{ x, width: w ? w * tabs.length : "100%" }} drag={w ? "x" : false} dragDirectionLock dragMomentum={false} dragElastic={0.14} dragConstraints={{ left: -(tabs.length - 1) * w, right: 0 }} onDragEnd={onDragEnd}>
          {tabs.map(([k, label], i) => <div key={k} className="relative h-full flex-none" style={{ width: w || "100%" }} inert={i !== index} role="tabpanel" aria-label={label}>{Math.abs(i - index) < 2 && children(k)}</div>)}
        </motion.div>
      </div>
    </>
  );
}

const tone = (c: Community) => `hsl(${c.hue} 46% 28%)`;

// ------------------------------------------------------------ community
/** Groups first, because a community is its groups. Then the feed, the people and the events of all of it. */
export function CommunityScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const c = s.communities.find((x) => x.id === id)!;
  const groups = s.groups.filter((g) => g.communityId === id).length;
  useEffect(() => { const t = window.setTimeout(() => act.seen(id), 2500); return () => window.clearTimeout(t); }, [act, id]);
  return (
    <div className="relative flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none text-white" style={{ background: tone(c) }}>
        <Bar dark title="" right={<span className="flex pr-2"><button type="button" aria-label="Pass the key" className="press grid h-11 w-11 place-items-center" onClick={() => act.sheet({ t: "key", kind: "community", id })}><Share2 size={20} /></button><button type="button" aria-label="About" className="press grid h-11 w-11 place-items-center" onClick={() => act.sheet({ t: "about", id })}><Info size={21} /></button></span>} />
        <button type="button" onClick={() => act.sheet({ t: "about", id })} className="flex w-full items-center gap-3.5 px-5 pb-2 text-left">
          <span className="rounded-[18px] ring-[3px] ring-white/25"><Glyph c={c} size={54} /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[22px] font-semibold leading-tight tracking-[-0.02em]">{c.name}</span><span className="block truncate text-[14px] text-white/80">{c.biz ? c.kind : what(c)}, {groups} {groups === 1 ? "group" : "groups"}</span></span>
          {s.paid[id] && <span className="flex-none rounded-full bg-[var(--sun)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)]">Member</span>}
        </button>
      </div>
      <Place id={id} dark={tone(c)} tabs={[["groups", "Groups"], ["feed", "Feed"], ["people", "People"], ["events", "Events"]] as const}>
        {(t) => t === "groups" ? <GroupsTab c={c} now={now} /> : t === "feed" ? <FeedTab c={c} now={now} /> : t === "people" ? <div className="scroll h-full px-4 pb-10 pt-4"><People cid={c.id} ids={c.members} size={c.size} hosts={c.hosts} me hint={c.kind === "Alumni" ? "Name, company, city or class" : undefined} /></div> : <EventsTab c={c} />}
      </Place>
    </div>
  );
}

function GroupsTab({ c, now }: { c: Community; now: number }) {
  const { s, act } = useStore();
  const { rows, note, fresh } = latest(s, c);
  const open = openGroups(s, c.id);
  const [q, setQ] = useState("");
  const next = s.events.filter((e) => e.communityId === c.id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt)[0];
  const hit = open.filter((g) => `${g.name} ${g.topic}`.toLowerCase().includes(q.toLowerCase()));
  const forYou = q ? [] : hit.filter((g) => fitsMe(s, g)).slice(0, 3);
  const others = hit.filter((g) => !forYou.includes(g));
  const sects = [...new Set(others.map((g) => g.sect ?? ""))];
  return (
    <div className="relative h-full">
      <LayoutGroup id={c.id}>
        <div className="scroll h-full px-4 pb-28 pt-4">
          {isHost(s, c.id) && s.desk[c.id] && <DeskCard c={c} />}
          {c.biz && isHost(s, c.id) && s.movedIn[c.id] === undefined && (
            <button type="button" onClick={() => act.push({ t: "movein", id: c.id })} className="press mb-3 flex w-full items-center gap-3.5 rounded-[22px] bg-[var(--sun)] p-4 text-left"><Shop size={24} className="flex-none" /><span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold leading-tight">Bring in your WhatsApp customers</span><span className="text-[14px]">They know you. Let them know each other.</span></span><ChevronRight size={20} className="flex-none" /></button>
          )}
          {c.biz && (
            <div className="mb-3 flex items-center gap-3 rounded-[20px] bg-[var(--card)] py-2 pl-4 pr-2">
              <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-medium leading-tight">{openNow(c.biz, now)}</span>{c.biz.catalogue ? <a className="text-[14px] text-[var(--brand)] underline underline-offset-2" href={c.biz.catalogue} target="_blank" rel="noreferrer">See the catalogue</a> : <span className="text-[14px] text-[var(--soft)]">{c.kind}</span>}</span>
              {!isHost(s, c.id) || s.movedIn[c.id] !== undefined ? <button type="button" onClick={() => act.sheet({ t: "ask", communityId: c.id })} className="press flex min-h-[44px] flex-none items-center gap-2 rounded-[16px] bg-[var(--brand-soft)] px-4 text-[14.5px] font-semibold text-[var(--brand)]"><MessageCircle size={17} />Ask on WhatsApp</button> : null}
            </div>
          )}
          {next && <EventRow e={next} compact />}

          <h2 className="mb-2 mt-4 px-1 text-[16px] font-semibold">Your groups</h2>
          <ul className="overflow-hidden rounded-[22px] bg-[var(--card)]">
            <li>
              <button type="button" onClick={() => act.push({ t: "channel", id: c.id })} className="press flex w-full items-center gap-3.5 p-4 text-left">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-[17px] text-white" style={{ background: `hsl(${c.hue} 48% 38%)` }}><Megaphone size={22} /></span>
                <span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-2"><span className="text-[16.5px] font-semibold">Announcements</span><span className="text-[13px] text-[var(--soft)]">{note ? ago(note.at, now) : ""}</span></span><span className="line-clamp-2 text-[14.5px] leading-snug" style={{ color: fresh ? "var(--ink)" : "var(--soft)" }}>{note ? `${note.by === "me" ? "You" : firstOf(note.by)}: ${note.text}` : "Only hosts post here"}</span></span>
                <Unread n={fresh} />
              </button>
            </li>
            {rows.map(({ group: g, post, unread }) => (
              <motion.li key={g.id} layoutId={`g-${g.id}`} transition={spring} className="border-t border-[var(--line)] bg-[var(--card)]">
                <button type="button" onClick={(e) => act.push({ t: "group", id: g.id, from: rectOf(e.currentTarget) })} className="press flex w-full items-center gap-3.5 p-4 text-left">
                  <GroupMark g={g} hue={c.hue} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-[16.5px] font-semibold">{g.name}</span>{g.muted && <BellOff size={14} className="flex-none text-[var(--soft)]" aria-label="Muted" />}</span><span className="flex-none text-[13px] text-[var(--soft)]">{post ? ago(post.at, now) : ""}</span></span>
                    <span className="block truncate text-[14.5px]" style={{ color: unread ? "var(--ink)" : "var(--soft)" }}>{post ? `${post.by === "me" ? "You" : firstOf(post.by)}: ${post.text}` : g.topic || "Waiting for its first post"}</span>
                  </span>
                  <Unread n={unread} />
                </button>
              </motion.li>
            ))}
          </ul>

          {open.length > 0 && <h2 className="mb-2 mt-6 px-1 text-[16px] font-semibold">Groups you can join</h2>}
          {open.length > 8 && <label className="mb-2.5 flex min-h-[50px] items-center gap-3 rounded-[18px] bg-[var(--card)] px-4"><Search size={19} className="flex-none text-[var(--soft)]" /><input className="w-full bg-transparent text-[16px] !outline-none" placeholder={`Search ${open.length} groups`} aria-label="Search groups" value={q} onChange={(e) => setQ(e.target.value)} /></label>}
          {forYou.length > 0 && <ul className="mb-2 overflow-hidden rounded-[22px] bg-[var(--card)]">{forYou.map((g) => <JoinRow key={g.id} g={g} c={c} />)}</ul>}
          {sects.map((sect) => (
            <div key={sect || "all"}>
              {sect && <h3 className="mb-1.5 mt-4 px-1 text-[14.5px] text-[var(--soft)]">{sect}</h3>}
              <ul className="mb-2 overflow-hidden rounded-[22px] bg-[var(--card)]">{others.filter((g) => (g.sect ?? "") === sect).sort((a, b) => (sect === "Classes" ? b.name.localeCompare(a.name) : 0)).map((g) => <JoinRow key={g.id} g={g} c={c} />)}</ul>
            </div>
          ))}
          {q && hit.length === 0 && <p className="py-6 text-center text-[15px] text-[var(--soft)]">No group by that name. You could start it.</p>}
        </div>
      </LayoutGroup>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-8"><button type="button" className="btn btn-main pointer-events-auto w-full" onClick={() => act.sheet({ t: "newgroup", communityId: c.id })}><Plus size={20} /> Add group</button></div>
    </div>
  );
}

/** What WhatsApp won't tell you before you join: who's inside, and whether it's for you. */
function JoinRow({ g, c }: { g: Group; c: Community }) {
  const { s, act } = useStore();
  const fit = fitsMe(s, g);
  const who = byFit(s, g.members);
  const asked = s.askedGroups.includes(g.id);
  return (
    <motion.li layoutId={`g-${g.id}`} transition={spring} className="flex items-center border-t border-[var(--line)] bg-[var(--card)] pr-3 first:border-t-0">
      <button type="button" onClick={() => act.sheet({ t: "peek", kind: "group", id: g.id })} className="press flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-4 pr-2 text-left">
        <GroupMark g={g} hue={c.hue} size={44} quiet />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5"><span className="truncate text-[16px] font-semibold">{g.name}</span>{g.ask && <Lock size={13} className="flex-none text-[var(--soft)]" aria-label="Someone lets you in" />}</span>
          <span className="block truncate text-[14px] text-[var(--soft)]">{fit ? <span className="font-medium text-[var(--brand)]">For “{fit}”</span> : who.length ? `${who.slice(0, 2).map(firstOf).join(", ")}${g.size > 2 ? ` and ${count(g.size - 2)} more` : ""}` : `${count(g.size)} people`}</span>
        </span>
      </button>
      <button type="button" disabled={asked} aria-label={`${g.plan ? "Join, paid" : g.ask ? "Ask to join" : "Join"} ${g.name}`} onClick={() => { navigator.vibrate?.(8); act.joinGroup(g.id); }} className="press min-h-[40px] flex-none rounded-full px-4 text-[14px] font-semibold" style={{ background: asked ? "var(--sunk)" : g.plan ? "var(--sun)" : "var(--brand-soft)", color: asked ? "var(--soft)" : g.plan ? "var(--ink)" : "var(--brand)" }}>{asked ? "Asked" : g.plan ? `₹${g.plan.price.toLocaleString("en-IN")}` : g.ask ? "Ask" : "Join"}</button>
    </motion.li>
  );
}

function Composer({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="press mb-3 flex min-h-[56px] w-full items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]"><Avatar id="me" size={34} /> {label}</button>;
}

/** Everyone's posts and your groups', each marked with where it was said. */
function FeedTab({ c, now }: { c: Community; now: number }) {
  const { s, act } = useStore();
  const feed = feedFor(s, c.id);
  return (
    <div className="scroll h-full px-4 pb-16 pt-4">
      <Composer label={`Share with ${c.name}`} onClick={() => act.sheet({ t: "post", communityId: c.id })} />
      <AnimatePresence initial={false}>
        {feed.map(({ p, reason }) => (
          <motion.div key={p.id} layout="position" initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
            <PostCard post={p} now={now} reason={reason} from={p.groupId ? s.groups.find((g) => g.id === p.groupId)?.name : undefined} onFrom={() => p.groupId && act.go({ t: "group", id: p.groupId })} />
          </motion.div>
        ))}
      </AnimatePresence>
      <CaughtUp hue={c.hue} ids={c.members} empty={feed.length === 0} />
    </div>
  );
}

function EventsTab({ c, group }: { c: Community; group?: Group }) {
  const { s, act } = useStore();
  const list = s.events.filter((e) => e.communityId === c.id && !e.dissolved && (!group || e.groupId === group.id)).sort((a, b) => a.startsAt - b.startsAt);
  return (
    <div className="scroll h-full px-4 pb-16 pt-4">
      {list.length === 0 && <p className="mb-4 mt-6 text-center text-[16px] text-[var(--soft)]">Nothing planned. Someone has to go first.</p>}
      {list.map((e) => <EventRow key={e.id} e={e} showGroup={!group} />)}
      <button type="button" className="btn btn-quiet mt-1 w-full" onClick={() => act.sheet({ t: "host", communityId: c.id, groupId: group?.id })}><Plus size={19} /> {group ? `Host for ${group.name}` : "Host something"}</button>
    </div>
  );
}

// ------------------------------------------------------------ group
const STARTERS = [["Introduce yourself", "Hi, I'm "], ["Ask for one thing", "I'm stuck on "], ["Offer one thing", "Happy to help anyone with "]];

/** A group: its own feed, its own people, its own events. Same shape as its community, one step in. */
export function GroupScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const g = s.groups.find((x) => x.id === id);
  if (!g) return null;
  const c = s.communities.find((x) => x.id === g.communityId)!;
  return (
    <div className="relative flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none text-white" style={{ background: tone(c) }}>
        <Bar dark title={g.name} sub={`${c.name}, ${count(g.size)} ${g.size === 1 ? "person" : "people"}`} onTitle={() => act.sheet({ t: "switch", id })}
          right={<span className="flex flex-none items-center pr-2"><button type="button" aria-label="Switch group" className="press grid h-11 w-11 place-items-center" onClick={() => act.sheet({ t: "switch", id })}><ChevronsUpDown size={20} /></button><button type="button" aria-label="About this group" className="press grid h-11 w-11 place-items-center" onClick={() => act.sheet({ t: "group", id })}><Info size={21} /></button></span>} />
      </div>
      <Place id={id} dark={tone(c)} tabs={[["feed", "Feed"], ["people", "People"], ["events", "Events"]] as const}>
        {(t) => t === "people" ? <div className="scroll h-full px-4 pb-10 pt-4"><People ids={g.members} size={g.size} /></div> : t === "events" ? <EventsTab c={c} group={g} /> : <GroupFeed g={g} c={c} now={now} />}
      </Place>
    </div>
  );
}

function GroupFeed({ g, c, now }: { g: Group; c: Community; now: number }) {
  const { s, act } = useStore();
  const posts = s.posts.filter((p) => p.groupId === g.id).sort((a, b) => b.at - a.at);
  const next = s.events.filter((e) => e.groupId === g.id && !e.dissolved).sort((a, b) => a.startsAt - b.startsAt)[0];
  const write = (draft?: string) => act.sheet({ t: "post", communityId: c.id, groupId: g.id, draft });
  return (
    <div className="scroll h-full px-4 pb-16 pt-4">
      {next && <EventRow e={next} compact />}
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

export function People({ ids, size, hosts = [], me = false, hint, cid }: { ids: string[]; size: number; hosts?: string[]; me?: boolean; hint?: string; cid?: string }) {
  const { s, act } = useStore();
  const [q, setQ] = useState("");
  const [want, setWant] = useState<string | null>(null);
  const big = size > 1000;
  const wants = INTENTS.filter((i) => ids.some((m) => person(m)?.intents.includes(i)));
  const people = byFit(s, ids).map((m) => person(m)).filter((p) => p !== null).filter((p) => !want || p.intents.includes(want)).filter((p) => `${p.name} ${p.headline} ${p.bio} ${p.city} ${p.intents.join(" ")} ${p.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <input className="field mb-3" placeholder={hint ?? (big ? `Search ${count(size)} people` : "Search by name, skill or what they want")} aria-label="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">{wants.map((i) => <button key={i} type="button" aria-pressed={want === i} onClick={() => setWant(want === i ? null : i)} className="press min-h-[44px] flex-none rounded-full px-4 text-[14.5px] font-medium" style={{ background: want === i ? "var(--sun)" : "var(--card)" }}>{i}</button>)}</div>
      {big && !q && !want && <h2 className="mb-2.5 px-1 text-[16px] font-semibold">Start with these</h2>}
      {me && hosts.includes("me") && !q && !want && <p className="mb-2.5 rounded-[18px] bg-[var(--brand-soft)] px-4 py-3 text-[15px] font-medium text-[var(--brand)]">You host this community</p>}
      {people.map((p) => {
        const why = overlap(s, p);
        return (
          <button key={p.id} type="button" onClick={() => act.push({ t: "person", id: p.id })} className="press mb-2.5 flex w-full items-start gap-3.5 rounded-[20px] bg-[var(--card)] p-4 text-left">
            <Avatar id={p.id} size={48} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2"><span className="text-[16.5px] font-semibold leading-tight">{p.name}</span>{hosts.includes(p.id) && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[12.5px] font-medium text-[var(--brand)]">Host</span>}{(() => { const st = cid ? standing(s.desk[cid]?.came[p.id]) : null; return st && st.tone !== "new" ? <span className="rounded-full px-2 py-0.5 text-[12.5px] font-medium" style={{ background: st.tone === "sun" ? "var(--sun)" : "var(--sunk)" }}>{st.label}</span> : null; })()}</span>
              <span className="block text-[14.5px] text-[var(--soft)]">{p.headline}, {p.city}</span>
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
  const open = openGroups(s, c.id).filter((g) => !g.plan && !g.ask || g.id === want).sort((a, b) => Number(b.id === want) - Number(a.id === want)).slice(0, 4);
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
        {s.paid[c.id] && <motion.div initial={{ rotate: -5, y: 30, opacity: 0 }} animate={{ rotate: -1, y: 0, opacity: 1 }} transition={{ ...spring, delay: 1.7 }} className="mt-4 flex items-center justify-between rounded-[20px] bg-[var(--sun)] px-5 py-3.5 text-[var(--ink)]"><span><span className="block text-[14px]">{s.me?.name}</span><span className="text-[17px] font-semibold">Member until {day(s.paid[c.id].until)}</span></span><span className="digits text-[19px] font-medium">{count(s.paid[c.id].no)}</span></motion.div>}
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

/** An event you can say yes to without opening it. */
export function EventRow({ e, compact = false, showGroup = true }: { e: Event; compact?: boolean; showGroup?: boolean }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const live = e.startsAt <= now;
  const g = s.groups.find((x) => x.id === e.groupId);
  const d = new Date(e.startsAt);
  const going = byFit(s, e.going);
  const n = e.inside + (e.ticket ? 1 : 0);
  const k = known(s, e).length;
  return (
    <div className={`flex items-center gap-2 rounded-[20px] bg-[var(--card)] pr-3 ${compact ? "mb-3" : "mb-2.5"}`}>
      <button type="button" onClick={() => act.push(live && e.ticket ? { t: "room", id: e.id } : { t: "event", id: e.id })} className="press flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-3.5 text-left">
        <span className="flex h-[54px] w-[48px] flex-none flex-col items-center justify-center rounded-[15px]" style={{ background: live ? "var(--live)" : "var(--sunk)", color: live ? "#fff" : "var(--ink)" }}><span className="text-[12px] leading-none opacity-80">{live ? "Now" : d.toLocaleString("en-IN", { month: "short" })}</span><span className="num mt-1 text-[19px] font-semibold leading-none">{d.getDate()}</span></span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[16px] font-semibold leading-snug">{e.title}</span>
          <span className="block truncate text-[14px] text-[var(--soft)]">{live ? "On now" : e.repeats ? `${e.repeats}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : when(e.startsAt)}{showGroup && g && !compact ? `, ${g.name}` : ""}</span>
          <span className="mt-1.5 flex items-center gap-2"><Faces ids={[...(e.ticket ? ["me"] : []), ...going].slice(0, 4)} size={22} /><span className="text-[13.5px] text-[var(--soft)]">{count(n)} going{k ? <>, <span className="font-medium text-[var(--brand)]">{k} you know</span></> : null}</span></span>
        </span>
      </button>
      {live ? <button type="button" onClick={() => (e.ticket ? act.push({ t: "room", id: e.id }) : act.push({ t: "event", id: e.id }))} className="press min-h-[42px] flex-none rounded-full bg-[var(--live)] px-4 text-[14px] font-semibold text-white">{e.ticket ? "Walk in" : "See"}</button>
        : <motion.button key={String(e.ticket)} type="button" aria-pressed={e.ticket} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} onClick={() => { if (e.price && !e.ticket) return act.sheet({ t: "pay", eventId: e.id }); if (e.price) return act.push({ t: "event", id: e.id }); navigator.vibrate?.(10); act.rsvp(e.id); }} className="flex min-h-[42px] flex-none items-center gap-1 rounded-full px-4 text-[14px] font-semibold" style={{ background: e.ticket ? "var(--sun)" : "var(--brand-soft)", color: e.ticket ? "var(--ink)" : "var(--brand)" }}>{e.ticket ? <><Check size={16} />Going</> : e.price ? `₹${e.price.toLocaleString("en-IN")}` : "I'm in"}</motion.button>}
    </div>
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
      {p.drop && <DropCard p={p} />}
      {p.crew && (
        <div className="mt-3 rounded-[18px] bg-[var(--ink)] p-4 text-white">
          <div className="flex flex-wrap gap-1.5">{["me", ...p.crew].map((m, i) => <motion.span key={m} className="rounded-full ring-2 ring-[var(--sun)]" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.15 + i * 0.06 }}><Avatar id={m} size={40} /></motion.span>)}</div>
          <p className="mt-3 flex items-baseline justify-between text-[14px]"><span className="font-semibold text-[var(--sun)]">{p.crew.length + 1} came</span><span className="text-white/70">{p.crew.includes("me") || p.by === "me" ? "You were there" : "The ones who turned up"}</span></p>
        </div>
      )}
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
