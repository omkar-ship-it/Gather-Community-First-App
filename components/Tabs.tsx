"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronRight, Hash, Megaphone, MessageCircle, Plus, Users } from "lucide-react";
import { ago, count, latest, left, maskEmail, overlap, person, suggested, useNow, useStore, when, type Tab } from "@/lib/store";
import { Avatar, Faces, Glyph, IdTiles, Unread, firstOf, nameOf, spring } from "./ui";

function Top({ title }: { title: string }) {
  const { act } = useStore();
  return (
    <header className="flex-none px-5 pb-3 pt-[max(env(safe-area-inset-top),18px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[31px] font-semibold tracking-[-0.03em]">{title}</h1>
        <button type="button" aria-label="Your card" className="press rounded-full" onClick={() => act.push({ t: "me" })}><Avatar id="me" size={42} /></button>
      </div>
      <button type="button" onClick={() => act.dial(true)} className="press mt-3 flex min-h-[52px] w-full items-center gap-3 rounded-[18px] bg-[var(--card)] px-4 text-left text-[16px] text-[var(--soft)]">
        <Hash size={20} className="text-[var(--brand)]" /> Dial a number
      </button>
    </header>
  );
}

export function Home() {
  const { s, act } = useStore();
  const now = useNow();
  const joined = s.communities.filter((c) => c.joined).map((c) => ({ c, ...latest(s, c) })).sort((a, b) => b.at - a.at);
  const ideas = suggested(s);
  const live = s.events.filter((e) => e.ticket && !e.dissolved && e.startsAt <= now);
  return (
    <div className="flex h-full flex-col">
      <Top title="Communities" />
      <div className="scroll flex-1 px-5 pb-32">
        {s.me && !s.me.emailOk && (
          <div className="mb-4 flex items-center gap-3 rounded-[20px] bg-[var(--brand-soft)] p-4">
            <p className="min-w-0 flex-1 text-[15px] leading-snug">Confirm <b className="font-semibold">{maskEmail(s.me.email)}</b> so you can always get your number back.</p>
            <button type="button" className="press min-h-[44px] flex-none rounded-full bg-[var(--brand)] px-4 text-[14.5px] font-semibold text-white" onClick={() => { act.confirmEmail(); act.say("Email confirmed"); }}>Confirm</button>
          </div>
        )}
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
        {s.communities.filter((c) => s.asked.includes(c.id)).map((c) => (
          <div key={c.id} className="flex items-center gap-4 py-3 opacity-70"><Glyph c={c} size={58} /><span><span className="block text-[17px] font-semibold">{c.name}</span><span className="text-[14.5px] text-[var(--soft)]">Waiting for a host to say yes</span></span></div>
        ))}
        <ul>
          {joined.map(({ c, rows, note, fresh, at, unread }) => {
            const lines = rows.slice(0, fresh ? 1 : 2);
            const more = rows.length - lines.length;
            const open = s.groups.filter((g) => g.communityId === c.id && !g.joined).length;
            return (
              <motion.li key={c.id} layout transition={spring} className="mb-3 overflow-hidden rounded-[24px] bg-[var(--card)]">
                <button type="button" onClick={() => act.push({ t: "community", id: c.id })} className="press flex w-full items-center gap-3.5 px-4 pb-2.5 pt-4 text-left">
                  <Glyph c={c} size={48} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[17.5px] font-semibold leading-tight tracking-[-0.01em]">{c.name}</span><span className="text-[13.5px] text-[var(--soft)]">{count(c.size)} members</span></span>
                  <span className="flex flex-none flex-col items-end gap-1"><span className="text-[13px] text-[var(--soft)]">{at ? ago(at, now) : ""}</span><Unread n={unread} /></span>
                </button>
                <div className="relative pb-2.5 pl-[39px] pr-2">
                  <span className="absolute bottom-[30px] left-[39px] top-0 w-[2px] rounded-full" style={{ background: `hsl(${c.hue} 40% 86%)` }} aria-hidden="true" />
                  <AnimatePresence initial={false}>
                    {fresh > 0 && note && <Nested key="a" hue={c.hue} icon={<Megaphone size={16} />} name="Announcements" text={note.text} n={fresh} onClick={() => act.push({ t: "channel", id: c.id })} />}
                    {lines.map(({ group: g, msg, unread: n }) => <Nested key={g.id} hue={c.hue} icon={g.name[0]} name={g.name} text={msg ? (msg.kind === "note" ? msg.text : `${msg.by === "me" ? "You" : firstOf(msg.by)}: ${msg.text}`) : g.topic} n={n} onClick={() => act.push({ t: "chat", thread: `g:${g.id}` })} />)}
                    {(more > 0 || open > 0) && <Nested key="more" hue={c.hue} quiet icon={<ChevronRight size={16} />} name={more > 0 ? `${more} more of yours${open ? `, ${open} to join` : ""}` : `${open} ${open === 1 ? "group" : "groups"} to join`} onClick={() => act.push({ t: "community", id: c.id })} />}
                  </AnimatePresence>
                </div>
              </motion.li>
            );
          })}
        </ul>
        {ideas.length > 0 && (
          <>
            <h2 className="mb-2.5 mt-5 px-1 text-[16px] font-semibold">{joined.length ? "You might belong here" : "People here want what you want"}</h2>
            <ul>
              {ideas.map(({ c, fits }) => (
                <motion.li key={c.id} layout transition={spring} className="mb-2.5">
                  <button type="button" onClick={() => act.sheet({ t: "peek", kind: "community", id: c.id })} className="press flex w-full items-center gap-3.5 rounded-[22px] border-2 border-dashed border-[var(--line)] p-3.5 text-left">
                    <Glyph c={c} size={48} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[16.5px] font-semibold">{c.name}</span><span className="block text-[14px] leading-snug text-[var(--soft)]">{fits.length ? `${fits.length === 1 ? `${firstOf(fits[0])} is` : `${firstOf(fits[0])} and ${fits.length - 1} more are`} worth meeting` : c.blurb}</span></span>
                    <Faces ids={(fits.length ? fits : c.members).slice(0, 2)} size={30} />
                  </button>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** One line under a community, hanging off its spine. */
function Nested({ hue, icon, name, text, n = 0, quiet = false, onClick }: { hue: number; icon: React.ReactNode; name: string; text?: string; n?: number; quiet?: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={spring} onClick={onClick} className="press relative flex w-full items-center gap-3 overflow-hidden rounded-[16px] text-left">
      <span className="h-[2px] w-3 flex-none" style={{ background: `hsl(${hue} 40% 86%)` }} aria-hidden="true" />
      <span className="-ml-3 grid h-[34px] w-[34px] flex-none translate-x-3 place-items-center rounded-[12px] text-[15px] font-semibold" style={{ background: quiet ? "var(--sunk)" : `hsl(${hue} 50% 92%)`, color: quiet ? "var(--soft)" : `hsl(${hue} 50% 30%)` }} aria-hidden="true">{icon}</span>
      <span className="ml-3 flex min-h-[50px] min-w-0 flex-1 flex-col justify-center py-1.5">
        <span className="truncate text-[15px] leading-tight" style={{ fontWeight: quiet ? 400 : 500, color: quiet ? "var(--soft)" : undefined }}>{name}</span>
        {text && <span className="truncate text-[14px]" style={{ color: n ? "var(--ink)" : "var(--soft)" }}>{text}</span>}
      </span>
      <span className="flex-none pr-2"><Unread n={n} /></span>
    </motion.button>
  );
}

export function Messages() {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const dms = Object.entries(s.threads).filter(([k, v]) => k.startsWith("d:") && v.length && !s.requests.includes(k.slice(2))).map(([k, v]) => ({ k, id: k.slice(2), last: v.at(-1)! })).sort((a, b) => b.last.at - a.last.at);
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
      <span className="relative"><Icon size={23} strokeWidth={s.tab === t ? 2.4 : 2} />{n > 0 && <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--sun)] ring-2 ring-white" />}</span>
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
