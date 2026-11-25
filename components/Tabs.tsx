"use client";

import { motion } from "framer-motion";
import { CalendarDays, Hash, MessageCircle, Plus, Users } from "lucide-react";
import { ago, latest, left, overlap, person, useNow, useStore, when, type Tab } from "@/lib/store";
import { Avatar, Glyph, IdTiles, Unread, firstOf, nameOf, spring } from "./ui";

function Top({ title }: { title: string }) {
  const { act } = useStore();
  return (
    <header className="flex-none px-5 pb-3 pt-[max(env(safe-area-inset-top),18px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[31px] font-semibold tracking-[-0.03em]">{title}</h1>
        <button type="button" aria-label="Your card" className="press rounded-full" onClick={() => act.push({ t: "me" })}><Avatar id="me" size={42} /></button>
      </div>
      <button type="button" onClick={() => act.dial(true)} className="press mt-3 flex min-h-[52px] w-full items-center gap-3 rounded-[18px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]">
        <Hash size={20} className="text-[var(--brand)]" /> Enter an ID
      </button>
    </header>
  );
}

export function Home() {
  const { s, act } = useStore();
  const now = useNow();
  const joined = s.communities.filter((c) => c.joined).map((c) => ({ c, ...latest(s, c) })).sort((a, b) => (b.best?.msg.at ?? 0) - (a.best?.msg.at ?? 0));
  const live = s.events.filter((e) => e.ticket && !e.dissolved && e.startsAt <= now);
  return (
    <div className="flex h-full flex-col">
      <Top title="Communities" />
      <div className="scroll flex-1 px-5 pb-32">
        {live.map((e) => (
          <button key={e.id} type="button" onClick={() => act.push({ t: "room", id: e.id })} className="press mb-5 w-full overflow-hidden rounded-[24px] bg-[var(--ink)] p-5 text-left text-white">
            <span className="flex items-center gap-2 text-[14px] font-medium text-[#ffb3a5]"><span className="dot-live h-2 w-2 rounded-full bg-[var(--live)]" /> Live now<span className="digits ml-auto text-white">{left(e.endsAt - now)}</span></span>
            <span className="mt-2 block text-[21px] font-semibold leading-tight tracking-[-0.015em]">{e.title}</span>
            <span className="mt-4 flex items-center justify-between">
              <span className="flex -space-x-2">{e.going.slice(0, 5).map((m) => <span key={m} className="rounded-full ring-2 ring-[var(--ink)]"><Avatar id={m} size={32} /></span>)}</span>
              <span className="rounded-full bg-white px-4 py-2 text-[14.5px] font-semibold text-[var(--ink)]">Walk in</span>
            </span>
          </button>
        ))}
        {joined.length === 0 && s.asked.length === 0 && (
          <div className="mt-6 rounded-[24px] bg-[var(--card)] p-6 text-center">
            <p className="text-[19px] font-semibold">Nobody here yet</p>
            <p className="mx-auto mt-1 max-w-[17rem] text-[15px] leading-snug text-[var(--soft)]">Got six digits from someone? That&apos;s your way in.</p>
            <button type="button" className="btn btn-main mt-5 w-full" onClick={() => act.dial(true)}>Enter an ID</button>
          </div>
        )}
        {s.communities.filter((c) => s.asked.includes(c.id)).map((c) => (
          <div key={c.id} className="flex items-center gap-4 py-3 opacity-70"><Glyph c={c} size={58} /><span><span className="block text-[17px] font-semibold">{c.name}</span><span className="text-[14.5px] text-[var(--soft)]">Waiting for a host to say yes</span></span></div>
        ))}
        <ul>
          {joined.map(({ c, best, unread }) => (
            <motion.li key={c.id} layout transition={spring}>
              <button type="button" onClick={() => act.push({ t: "community", id: c.id })} className="press flex w-full items-center gap-4 py-3 text-left">
                <Glyph c={c} size={58} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[17px] font-semibold">{c.name}</span><span className="flex-none text-[13px] text-[var(--soft)]">{best ? ago(best.msg.at, now) : ""}</span></span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14.5px]" style={{ color: unread ? "var(--ink)" : "var(--soft)", fontWeight: unread ? 500 : 400 }}>{best ? `${firstOf(best.msg.by)} in ${best.group.name}: ${best.msg.text}` : c.blurb}</span>
                    <Unread n={unread} />
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Messages() {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const dms = Object.entries(s.threads).filter(([k, v]) => k.startsWith("d:") && v.length).map(([k, v]) => ({ k, id: k.slice(2), last: v.at(-1)! })).sort((a, b) => b.last.at - a.last.at);
  const quiet = s.saved.filter((id) => !(s.threads[`d:${id}`] ?? []).length);
  return (
    <div className="flex h-full flex-col">
      <Top title="Messages" />
      <div className="scroll flex-1 px-5 pb-32">
        {s.saved.length > 0 && (
          <div className="scroll mb-3 flex gap-4 overflow-x-auto pb-1">
            {s.saved.map((id) => <button key={id} type="button" onClick={() => act.push({ t: "person", id })} className="press flex w-[62px] flex-none flex-col items-center gap-1.5"><Avatar id={id} size={58} /><span className="w-full truncate text-center text-[13px]">{firstOf(id)}</span></button>)}
          </div>
        )}
        {quiet.map((id) => {
          const o = overlap(s, person(id)!);
          return (
            <button key={id} type="button" onClick={() => act.push({ t: "chat", thread: `d:${id}`, draft: o.open })} className="press mb-2.5 flex w-full items-center gap-3.5 rounded-[20px] bg-[var(--card)] p-4 text-left">
              <Avatar id={id} size={48} />
              <span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold">Say hello to {firstOf(id)}</span>{o.line && <span className="block text-[14.5px] leading-snug text-[var(--soft)]">{o.line}</span>}</span>
            </button>
          );
        })}
        {dms.length === 0 && quiet.length === 0 && <p className="mt-10 text-center text-[15px] leading-snug text-[var(--soft)]">No messages yet. Enter someone&apos;s<br />eight digits to say hello.</p>}
        {dms.map(({ k, id, last }) => {
          const c = s.communities.find((x) => x.joined && x.members.includes(id));
          return (
            <button key={k} type="button" onClick={() => act.push({ t: "chat", thread: k })} className="press flex w-full items-center gap-4 py-3 text-left">
              <Avatar id={id} size={54} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[17px] font-semibold">{nameOf(id)}</span><span className="text-[13px] text-[var(--soft)]">{ago(last.at, now)}</span></span>
                <span className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-[14.5px] text-[var(--soft)]">{last.by === "me" ? "You: " : ""}{last.text}</span><Unread n={s.unread[k] ?? 0} /></span>
                {c && <span className="text-[13px] text-[var(--brand)]">{c.name}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Events() {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const list = s.events.filter((e) => !e.dissolved).sort((a, b) => a.startsAt - b.startsAt);
  const mine = list.filter((e) => e.ticket);
  const rest = list.filter((e) => !e.ticket);
  const card = (e: (typeof list)[number]) => {
    const c = s.communities.find((x) => x.id === e.communityId)!;
    const live = e.startsAt <= now;
    const d = new Date(e.startsAt);
    return (
      <li key={e.id}>
        <button type="button" onClick={() => act.push(live && e.ticket ? { t: "room", id: e.id } : { t: "event", id: e.id })} className="press mb-3 flex w-full gap-4 rounded-[22px] bg-[var(--card)] p-4 text-left">
          <span className="flex h-[62px] w-[54px] flex-none flex-col items-center justify-center rounded-2xl text-white" style={{ background: live ? "var(--live)" : `hsl(${c.hue} 48% 38%)` }}>
            <span className="text-[12.5px] leading-none opacity-85">{live ? "Live" : d.toLocaleString("en-IN", { month: "short" })}</span>
            <span className="digits mt-1 text-[22px] leading-none">{d.getDate()}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16.5px] font-semibold leading-snug">{e.title}</span>
            <span className="mt-0.5 block text-[14px] text-[var(--soft)]">{live ? "Happening now" : when(e.startsAt)}</span>
            <span className="mt-1.5 flex items-center justify-between text-[14px]"><span className="truncate text-[var(--soft)]">{c.name}</span><span className="flex-none font-semibold">{e.ticket ? "You're going" : e.price ? `₹${e.price.toLocaleString("en-IN")}` : "Free"}</span></span>
          </span>
        </button>
      </li>
    );
  };
  return (
    <div className="flex h-full flex-col">
      <Top title="Events" />
      <div className="scroll flex-1 px-5 pb-32">
        {mine.length > 0 && (<><h2 className="mb-2.5 text-[16px] font-semibold">Yours</h2><ul>{mine.map(card)}</ul></>)}
        <h2 className="mb-2.5 mt-4 text-[16px] font-semibold">Around you</h2>
        <ul>{rest.map(card)}</ul>
      </div>
    </div>
  );
}

export function TabBar() {
  const { s, act } = useStore();
  const u = (pre: string) => Object.entries(s.unread).filter(([k]) => k.startsWith(pre)).reduce((n, [, v]) => n + v, 0);
  const item = (t: Tab, label: string, Icon: typeof Users, n: number) => (
    <button key={t} type="button" onClick={() => act.tab(t)} aria-current={s.tab === t ? "page" : undefined} className="press relative flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium" style={{ color: s.tab === t ? "var(--brand)" : "var(--soft)" }}>
      <span className="relative"><Icon size={23} strokeWidth={s.tab === t ? 2.4 : 2} />{n > 0 && <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--sun)] ring-2 ring-white" />}</span>
      {label}
    </button>
  );
  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      <button type="button" aria-label="Create or enter" onClick={() => act.sheet({ t: "plus" })} className="press absolute -top-[70px] right-5 grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[var(--brand)] text-white shadow-[0_14px_28px_-10px_rgba(107,29,79,0.7)]"><Plus size={28} /></button>
      <nav className="flex border-t border-[var(--line)] bg-[var(--card)] px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5">
        {item("communities", "Communities", Users, u("g:"))}
        {item("messages", "Messages", MessageCircle, u("d:"))}
        {item("events", "Events", CalendarDays, 0)}
      </nav>
    </div>
  );
}

export { IdTiles };
