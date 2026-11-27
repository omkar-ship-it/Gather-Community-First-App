"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Hash, MessageCircle, Plus, Users } from "lucide-react";
import { ago, headline, isHost, latest, left, maskEmail, momentsFor, money, overlap, person, suggested, useNow, useStore, what, when, type Tab } from "@/lib/store";
import { Avatar, Glyph, IdTiles, Unread, firstOf, nameOf, rectOf, spring } from "./ui";
import { todo } from "./Host";

function Top({ title, dial = "Dial a number" }: { title: string; dial?: string }) {
  const { act } = useStore();
  return (
    <header className="flex-none px-5 pb-2.5 pt-[max(env(safe-area-inset-top),16px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
        <button type="button" aria-label="Your card" className="press rounded-full" onClick={() => act.push({ t: "me" })}><Avatar id="me" size={36} /></button>
      </div>
      <button type="button" onClick={() => act.dial(true)} className="press mt-3 flex min-h-[44px] w-full items-center gap-2.5 rounded-full bg-[var(--sunk)] px-4 text-left text-[15.5px] text-[var(--soft)]">
        <Hash size={18} className="text-[var(--brand)]" /> {dial}
      </button>
    </header>
  );
}

export function Home() {
  const { s, act } = useStore();
  const now = useNow();
  const joined = s.communities.filter((c) => c.joined).map((c) => ({ c, ...latest(s, c) })).sort((a, b) => b.at - a.at);
  const [more, setMore] = useState(false);
  const all = suggested(s);
  const ideas = more ? all : all.slice(0, 3);
  const waitingFor = momentsFor(s);
  const live = s.events.filter((e) => e.ticket && !e.dissolved && e.startsAt <= now);
  const asked = s.communities.filter((c) => s.asked.includes(c.id));
  return (
    <div className="flex h-full flex-col">
      <Top title="Gather" />
      <div className="scroll flex-1 pb-32">
        {s.me && !s.me.emailOk && (
          <div className="mx-5 mb-3 flex items-center gap-3 rounded-[16px] bg-[var(--brand-soft)] py-2.5 pl-4 pr-2">
            <p className="min-w-0 flex-1 text-[14.5px] leading-snug">Confirm <b className="font-semibold">{maskEmail(s.me.email)}</b> to keep your number safe.</p>
            <button type="button" className="press min-h-[40px] flex-none rounded-full bg-[var(--brand)] px-4 text-[14px] font-semibold text-white" onClick={() => { act.confirmEmail(); act.say("Email confirmed"); }}>Confirm</button>
          </div>
        )}
        {live.map((e) => (
          <button key={e.id} type="button" onClick={() => act.push({ t: "room", id: e.id })} className="press mx-5 mb-2 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-[18px] bg-[var(--ink)] py-2.5 pl-4 pr-2.5 text-left text-white">
            <span className="dot-live h-2 w-2 flex-none rounded-full bg-[var(--live)]" />
            <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold leading-tight">{e.title}</span><span className="block text-[13px] text-white/70">Live now, <span className="num">{left(e.endsAt - now)}</span> left</span></span>
            <span className="flex-none rounded-full bg-white px-3.5 py-2 text-[14px] font-semibold text-[var(--ink)]">Walk in</span>
          </button>
        ))}
        <ul>
          <AnimatePresence initial={false}>
            {waitingFor.length > 0 && !s.caughtUp && (
              <motion.li key="away" layout exit={{ opacity: 0, height: 0 }}>
                <button type="button" onClick={() => act.moments(true)} className="press flex w-full items-center gap-3.5 px-5 py-2.5 text-left">
                  <span className="relative grid h-[52px] w-[52px] flex-none place-items-center"><Avatar id={waitingFor[0].by} size={52} /><span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[var(--sun)] ring-[3px] ring-[var(--bg)]" /></span>
                  <span className="min-w-0 flex-1 border-b border-[var(--line)] py-1.5">
                    <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[16.5px] font-semibold">While you were away</span><span className="flex-none text-[12.5px] font-medium text-[var(--brand)]">new</span></span>
                    <span className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-[14.5px] text-[var(--soft)]">{waitingFor[0].kicker}{waitingFor.length > 1 ? `, and ${waitingFor.length - 1} more` : ""}</span><Unread n={waitingFor.length} /></span>
                  </span>
                </button>
              </motion.li>
            )}
          </AnimatePresence>
          {joined.map(({ c, at, unread }) => {
            const h = headline(s, c);
            const t = isHost(s, c.id) ? todo(s, c.id) : null;
            return (
              <motion.li key={c.id} layout transition={spring}>
                <button type="button" onClick={(e) => act.push({ t: "community", id: c.id, from: rectOf(e.currentTarget) })} className="press flex w-full items-center gap-3.5 px-5 py-2.5 text-left">
                  <Glyph c={c} size={52} />
                  <span className="min-w-0 flex-1 border-b border-[var(--line)] py-1.5">
                    <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[16.5px] font-semibold">{c.name}</span><span className="flex-none text-[12.5px]" style={{ color: unread ? "var(--brand)" : "var(--soft)", fontWeight: unread ? 600 : 400 }}>{at ? ago(at, now) : ""}</span></span>
                    <span className="flex items-center gap-2">
                      {t && t.n > 0
                        ? <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-[var(--brand)]">Your desk: {t.line.split(" · ")[0]}{t.line.includes(" · ") ? " and more" : ""}</span>
                        : <span className="min-w-0 flex-1 truncate text-[14.5px]" style={{ color: unread ? "var(--ink)" : "var(--soft)" }}>{h ? <>{h.by === "me" ? "You" : firstOf(h.by)}: {h.text}</> : what(c)}</span>}
                      <Unread n={unread + (t?.n ?? 0)} />
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
          {asked.map((c) => (
            <li key={c.id} className="flex items-center gap-3.5 px-5 py-2.5 opacity-60">
              <Glyph c={c} size={52} />
              <span className="min-w-0 flex-1 border-b border-[var(--line)] py-1.5"><span className="block truncate text-[16.5px] font-semibold">{c.name}</span><span className="block text-[14.5px] text-[var(--soft)]">Waiting for a host to say yes</span></span>
            </li>
          ))}
        </ul>
        {joined.length === 0 && asked.length === 0 && (
          <div className="px-8 pb-2 pt-8 text-center">
            <p className="text-[15.5px] leading-snug text-[var(--soft)]">Dial a community&apos;s number to step inside, or start your own.</p>
            <button type="button" onClick={() => act.push({ t: "start" })} className="press mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--brand)] px-5 text-[15px] font-semibold text-white"><Plus size={18} />Start a community</button>
          </div>
        )}
        {ideas.length > 0 && (
          <>
            <h2 className="mb-1 mt-6 px-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--soft)]">{joined.length ? "You might belong here" : "Near you"}</h2>
            <ul>
              {ideas.map(({ c, fits }) => (
                <li key={c.id}>
                  <button type="button" onClick={() => act.sheet({ t: "peek", kind: "community", id: c.id })} className="press flex w-full items-center gap-3.5 px-5 py-2 text-left">
                    <Glyph c={c} size={44} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold">{c.name}</span><span className="block truncate text-[14px] text-[var(--soft)]">{fits.length ? `${fits.length === 1 ? `${firstOf(fits[0])} is` : `${firstOf(fits[0])} and ${fits.length - 1} more are`} worth meeting` : `${c.kind}${c.plan ? `, ${money(c.plan)}` : ", free"}`}</span></span>
                    <span className="flex-none rounded-full bg-[var(--brand-soft)] px-3.5 py-1.5 text-[13.5px] font-semibold text-[var(--brand)]">Look</span>
                  </button>
                </li>
              ))}
            </ul>
            {!more && all.length > 3 && <button type="button" onClick={() => setMore(true)} className="press mx-5 mt-1 min-h-[44px] text-[14.5px] font-semibold text-[var(--brand)]">See {all.length - 3} more</button>}
          </>
        )}
      </div>
    </div>
  );
}

export function Messages() {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const dms = Object.entries(s.threads).filter(([k, v]) => k.startsWith("d:") && v.length && !s.requests.includes(k.slice(2))).map(([k, v]) => ({ k, id: k.slice(2), last: v.at(-1)! })).sort((a, b) => b.last.at - a.last.at);
  const quiet = s.saved.filter((id) => !(s.threads[`d:${id}`] ?? []).length);
  return (
    <div className="flex h-full flex-col">
      <Top title="Messages" dial="Message a number" />
      <div className="scroll flex-1 px-5 pb-32">
        {s.saved.length > 0 && (
          <div className="scroll mb-3 flex gap-4 overflow-x-auto pb-1">
            {s.saved.map((id) => <button key={id} type="button" onClick={() => act.push({ t: "person", id })} className="press flex w-[62px] flex-none flex-col items-center gap-1.5"><Avatar id={id} size={58} /><span className="w-full truncate text-center text-[13px]">{firstOf(id)}</span></button>)}
          </div>
        )}
        {s.requests.map((id) => (
          <button key={id} type="button" onClick={() => act.push({ t: "chat", thread: `d:${id}` })} className="press mb-2.5 flex w-full items-center gap-3.5 rounded-[20px] border-2 border-dashed border-[var(--line)] p-4 text-left">
            <Avatar id={id} size={44} />
            <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{firstOf(id)} would like to talk</span><span className="block truncate text-[14.5px] text-[var(--soft)]">{person(id)?.headline}, {person(id)?.zone}</span></span>
          </button>
        ))}
        {quiet.map((id) => {
          const o = overlap(s, person(id)!);
          return (
            <button key={id} type="button" onClick={() => act.push({ t: "chat", thread: `d:${id}`, draft: o.open })} className="press mb-2.5 flex w-full items-center gap-3.5 rounded-[20px] bg-[var(--card)] p-4 text-left">
              <Avatar id={id} size={48} />
              <span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold">Say hello to {firstOf(id)}</span>{o.line && <span className="block text-[14.5px] leading-snug text-[var(--soft)]">{o.line}</span>}</span>
            </button>
          );
        })}
        {dms.length === 0 && quiet.length === 0 && <p className="mt-10 text-center text-[15px] leading-snug text-[var(--soft)]">No messages yet. Enter someone&apos;s<br />number to say hello.</p>}
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
      <span className="relative grid h-8 w-16 place-items-center rounded-full transition-colors" style={{ background: s.tab === t ? "var(--brand-soft)" : "transparent" }}><Icon size={22} strokeWidth={s.tab === t ? 2.3 : 1.9} />{n > 0 && <span className="absolute right-3 top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--sun)] ring-2 ring-white" />}</span>
      {label}
    </button>
  );
  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      <button type="button" aria-label="Create or enter" onClick={() => act.sheet({ t: "plus" })} className="press absolute -top-[70px] right-5 grid h-[58px] w-[58px] place-items-center rounded-[20px] bg-[var(--brand)] text-white shadow-[0_14px_28px_-10px_rgba(107,29,79,0.7)]"><Plus size={28} /></button>
      <nav className="flex border-t border-[var(--line)] bg-[var(--card)] px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5">
        {item("communities", "Communities", Users, s.communities.filter((c) => c.joined).reduce((n, c) => n + latest(s, c).unread, 0))}
        {item("messages", "Messages", MessageCircle, u("d:"))}
        {item("events", "Events", CalendarDays, 0)}
      </nav>
    </div>
  );
}

export { IdTiles };
