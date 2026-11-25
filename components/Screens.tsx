"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MapPin, Send, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import type { Event } from "@/lib/data";
import { pretty } from "@/lib/ids";
import { byFit, count, left, linkTo, maskEmail, maskMobile, overlap, person, pinOpen, stranger, useNow, useStore, when } from "@/lib/store";
import { Avatar, Bar, Glyph, IdTiles, Tag, firstOf, nameOf, spring } from "./ui";

// ------------------------------------------------------------ chat
export function Thread({ thread, draft = "", dark = false }: { thread: string; draft?: string; dark?: boolean }) {
  const { s, act } = useStore();
  const [text, setText] = useState(draft);
  const end = useRef<HTMLDivElement>(null);
  const msgs = s.threads[thread] ?? [];
  const dm = thread.startsWith("d:");
  const typing = s.typing[thread];
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs.length, typing]);
  const send = () => { const t = text.trim(); if (!t) return; act.send(thread, t); setText(""); };
  return (
    <>
      <div className="scroll flex-1 px-4 pt-3">
        <div className="flex min-h-full flex-col justify-end pb-3">
          {msgs.map((m, i) => {
            if (m.kind === "note") return <motion.p key={m.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mt-3 rounded-full px-3.5 py-1.5 text-[13px]" style={{ background: dark ? "rgba(255,255,255,0.1)" : "var(--sunk)", color: dark ? "rgba(255,255,255,0.7)" : "var(--soft)" }}>{m.text}</motion.p>;
            const me = m.by === "me";
            const head = !me && !dm && msgs[i - 1]?.by !== m.by;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${me ? "justify-end" : ""} ${head || msgs[i - 1]?.by !== m.by ? "mt-3" : "mt-1"}`}>
                {!me && !dm && <span className="w-8 flex-none">{head && <button type="button" aria-label={nameOf(m.by)} onClick={() => act.push({ t: "person", id: m.by })}><Avatar id={m.by} size={32} /></button>}</span>}
                <div className="max-w-[76%]">
                  {head && <button type="button" className="mb-1 block text-[13.5px] font-semibold" style={{ color: dark ? "#f3c6dd" : "var(--brand)" }} onClick={() => act.push({ t: "person", id: m.by })}>{nameOf(m.by)} <span className="font-normal" style={{ color: dark ? "rgba(255,255,255,0.55)" : "var(--soft)" }}>{person(m.by)?.intents[0]}</span></button>}
                  <p className="rounded-[20px] px-4 py-2.5 text-[16px] leading-[1.4]" style={{ background: me ? "var(--sun)" : dark ? "rgba(255,255,255,0.11)" : "var(--card)", color: me ? "var(--ink)" : undefined, borderBottomRightRadius: me ? 6 : 20, borderBottomLeftRadius: me ? 20 : 6 }}>{m.text}</p>
                </div>
              </motion.div>
            );
          })}
          {typing && <p className="mt-3 pl-1 text-[14px]" style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--soft)" }}>{firstOf(typing)} is typing</p>}
          <div ref={end} />
        </div>
      </div>
      <form className="flex flex-none items-end gap-2 px-3 pb-[max(env(safe-area-inset-bottom),14px)] pt-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea rows={Math.min(4, Math.max(1, Math.ceil(text.length / 34)))} aria-label="Message" placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} className="field scroll resize-none !rounded-[24px]" style={dark ? { background: "rgba(255,255,255,0.1)", borderColor: "transparent", color: "#fff" } : undefined} />
        <button type="submit" aria-label="Send" disabled={!text.trim()} className="press grid h-[52px] w-[52px] flex-none place-items-center rounded-full bg-[var(--brand)] text-white disabled:opacity-40"><Send size={20} /></button>
      </form>
    </>
  );
}

export function ChatScreen({ thread, draft }: { thread: string; draft?: string }) {
  const { s, act } = useStore();
  const id = thread.slice(2);
  if (thread.startsWith("d:")) {
    const p = person(id)!;
    const o = overlap(s, p);
    const shared = [...o.communities.map((c) => c.name), ...o.events.map((e) => e.title.split(":")[0])];
    return (
      <div className="flex h-full flex-col bg-[var(--bg)]">
        <div className="flex-none border-b border-[var(--line)] bg-[var(--card)]">
          <Bar title={p.name} sub={p.headline} onTitle={() => act.push({ t: "person", id })} right={<button type="button" aria-label={`${p.name}'s profile`} className="mr-3" onClick={() => act.push({ t: "person", id })}><Avatar id={id} size={40} /></button>} />
          {shared.length > 0 && <p className="truncate px-5 pb-2.5 text-[13.5px] text-[var(--brand)]">You both: {shared.join(", ")}</p>}
        </div>
        {s.requests.includes(id) ? (
          <>
            <div className="scroll flex-1 px-4 pt-5">{(s.threads[thread] ?? []).map((m) => <p key={m.id} className="max-w-[82%] rounded-[20px] rounded-bl-md bg-[var(--card)] px-4 py-2.5 text-[16px] leading-[1.4]">{m.text}</p>)}</div>
            <div className="flex-none border-t border-[var(--line)] bg-[var(--card)] px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-4">
              <p className="text-[15px] leading-snug text-[var(--soft)]">{o.communities[0] ? `All you share is ${o.communities[0].name}, with ${count(o.communities[0].size)} others.` : `You don't share a community with ${p.name.split(" ")[0]}.`} {p.name.split(" ")[0]} won&apos;t know you&apos;ve read this.</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5"><button type="button" className="btn btn-quiet" onClick={() => act.answer(id, false)}>Decline</button><button type="button" className="btn btn-main" onClick={() => act.answer(id, true)}>Accept</button></div>
            </div>
          </>
        ) : (
          <>
            {stranger(s, id) && !(s.threads[thread] ?? []).length && <p className="mx-4 mt-4 flex-none rounded-2xl bg-[var(--sunk)] px-4 py-3 text-[14.5px] leading-snug text-[var(--soft)]">{p.name.split(" ")[0]} doesn&apos;t know you yet. Your first message arrives as a request.</p>}
            <Thread thread={thread} draft={draft} />
          </>
        )}
      </div>
    );
  }
  return null;
}

// ------------------------------------------------------------ people
export function PersonScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const p = person(id)!;
  const n = p.name.split(" ")[0];
  const o = overlap(s, p);
  const saved = s.saved.includes(id);
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <Bar title="" right={<button type="button" aria-pressed={saved} aria-label={saved ? `Remove ${n} from saved` : `Save ${n}`} className="press mr-2 grid h-11 w-11 place-items-center rounded-full" onClick={() => { act.save(id); act.say(saved ? `${n} removed` : `${n} saved`); }}>{saved ? <BookmarkCheck size={23} className="text-[var(--brand)]" /> : <Bookmark size={23} />}</button>} />
      <div className="scroll flex-1 px-5 pb-32">
        <div className="flex flex-col items-center text-center">
          <Avatar id={id} size={104} />
          <h1 className="mt-4 text-[27px] font-semibold tracking-[-0.02em]">{p.name}</h1>
          <p className="text-[16px] text-[var(--soft)]">{p.headline}</p>
          <p className="mt-1 flex items-center gap-1 text-[14.5px] text-[var(--soft)]"><MapPin size={15} /> {p.city}</p>
          <span className="mt-4"><IdTiles digits={id} /></span>
        </div>
        {o.line && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ...spring }} className="mt-6 rounded-[24px] bg-[var(--sun)] p-5">
            <h2 className="text-[14.5px] font-medium opacity-75">Why you two should talk</h2>
            <p className="mt-1 text-[20px] font-semibold leading-snug tracking-[-0.01em]">{o.line}</p>
            {(o.communities.length > 0 || o.events.length > 0) && <p className="mt-2 text-[14.5px] leading-snug">You share {[...o.communities.map((c) => c.name), ...o.events.map((e) => e.title.split(":")[0])].join(", ")}.</p>}
          </motion.section>
        )}
        <section className="mt-3 rounded-[24px] bg-[var(--card)] p-5">
          <p className="text-[16px] leading-[1.5]">{p.bio}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">{p.intents.map((i) => <Tag key={i}>{i}</Tag>)}</div>
        </section>
        <section className="mt-3 rounded-[24px] bg-[var(--card)] p-5">
          <h2 className="text-[14.5px] text-[var(--soft)]">Ask me about</h2>
          <p className="mt-0.5 text-[17px] font-semibold leading-snug">{p.askMe}</p>
          <h2 className="mt-4 text-[14.5px] text-[var(--soft)]">Good at</h2>
          <p className="mt-0.5 text-[16px]">{p.skills.join(", ")}</p>
        </section>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-8">
        <button type="button" className="btn btn-main w-full" onClick={() => act.push({ t: "chat", thread: `d:${id}`, draft: (s.threads[`d:${id}`] ?? []).length ? "" : o.open })}>Message {n}</button>
      </div>
    </div>
  );
}

export function MeScreen() {
  const { s, act } = useStore();
  const me = s.me!;
  return (
    <div className="flex h-full flex-col bg-[var(--brand)] text-white">
      <Bar dark title="Your card" />
      <div className="scroll flex-1 px-6 pb-10">
        <motion.div initial={{ rotateX: -24, opacity: 0, y: 30 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={spring} className="mt-3 rounded-[32px] bg-white p-7 text-center text-[var(--ink)]">
          <span className="flex justify-center"><Avatar id="me" size={76} /></span>
          <p className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">{me.name}</p>
          <p className="text-[15px] text-[var(--soft)]">{me.headline}</p>
          <span className="mx-auto mt-5 grid w-fit place-items-center rounded-[24px] bg-[var(--bg)] p-5"><QRCodeSVG value={linkTo({ kind: "person", id: me.id })} size={148} bgColor="transparent" fgColor="#1e1020" /></span>
          <span className="mt-5 block"><IdTiles digits={me.id} size="md" /></span>
          {me.why && <p className="mt-2 text-[14.5px] font-medium text-[var(--brand)]">{me.why}. The only one.</p>}
          <span className="mt-4 flex flex-wrap justify-center gap-1.5">{me.intents.map((i) => <Tag key={i}>{i}</Tag>)}</span>
        </motion.div>
        <p className="mx-auto mt-5 max-w-[17rem] text-center text-[15px] leading-snug text-white/80">The same number everywhere, for life. Your mobile and email stay private.</p>
        <button type="button" className="btn btn-sun mt-5 w-full" onClick={async () => { try { await navigator.clipboard.writeText(pretty(me.id)); act.say("Number copied"); } catch { act.say(pretty(me.id)); } }}>Copy my number</button>
        <section className="mt-4 rounded-[24px] bg-white/10 p-5">
          <h2 className="text-[16px] font-semibold">Tied to</h2>
          {([["mobile", maskMobile(me.mobile), "Confirmed"], ["email", maskEmail(me.email), me.emailOk ? "Confirmed" : "Not confirmed yet"]] as const).map(([what, v, st]) => (
            <div key={what} className="mt-3 flex items-center justify-between gap-3">
              <span className="min-w-0"><span className="digits block truncate text-[16px]">{v}</span><span className="text-[14px] text-white/65">{st}</span></span>
              <button type="button" className="press min-h-[44px] flex-none rounded-full bg-white/15 px-4 text-[14.5px] font-medium" onClick={() => (what === "email" && !me.emailOk ? (act.confirmEmail(), act.say("Email confirmed")) : !me.emailOk ? act.say("Confirm your email first") : act.sheet({ t: "link", what }))}>{what === "email" && !me.emailOk ? "Confirm" : "Change"}</button>
            </div>
          ))}
          <p className="mt-4 text-[14.5px] leading-snug text-white/75">Change either one and your number stays the same. Lose one and the other brings it back.</p>
        </section>
        <button type="button" className="mt-2 min-h-[44px] w-full text-[14.5px] text-white/70" onClick={act.restart}>Start the prototype over</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ events
export function EventScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow();
  const e = s.events.find((x) => x.id === id)!;
  const c = s.communities.find((x) => x.id === e.communityId)!;
  const live = e.startsAt <= now && !e.dissolved;
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none pb-6 text-white" style={{ background: `hsl(${c.hue} 46% 30%)` }}>
        <Bar dark title="" right={<button type="button" className="press mr-2 flex min-h-[44px] items-center gap-2 rounded-full bg-white/15 px-4 text-[14.5px] font-medium" onClick={() => act.sheet({ t: "key", kind: "room", id })}><Share2 size={16} /> Pass the key</button>} />
        <div className="px-5"><p className="text-[15px] text-white/80">{c.name}</p><h1 className="mt-1 text-[29px] font-semibold leading-[1.1] tracking-[-0.025em]">{e.title}</h1></div>
      </div>
      <div className="scroll flex-1 px-5 pb-32 pt-5">
        <p className="text-[17px] font-semibold">{live ? "Happening now" : when(e.startsAt)}</p>
        <p className="mt-0.5 text-[15.5px] text-[var(--soft)]">{e.place}</p>
        <p className="mt-4 text-[16px] leading-[1.5]">{e.blurb}</p>
        <section className="mt-5 rounded-[24px] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold">{count(e.inside + (e.ticket ? 1 : 0))} going</h2><span className="text-[14px] text-[var(--soft)]">{count(Math.max(0, e.seats - e.inside - (e.ticket ? 1 : 0)))} seats left</span></div>
          <div className="mt-3 flex flex-wrap gap-2.5">{e.ticket && <Avatar id="me" size={44} />}{e.going.map((m) => <button key={m} type="button" aria-label={nameOf(m)} className="press" onClick={() => act.push({ t: "person", id: m })}><Avatar id={m} size={44} /></button>)}</div>
        </section>
        <section className="mt-3 rounded-[24px] border-2 border-dashed border-[var(--line)] p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-semibold">The room</h2>{pinOpen(e, now) && <IdTiles digits={e.room} />}</div>
          <p className="mt-2 text-[14.5px] leading-snug text-[var(--soft)]">{pinOpen(e, now) ? "Anyone with this PIN can walk in." : "Its six-digit PIN appears an hour before."} Closes for good at {new Date(e.endsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}. Keep who you meet.</p>
        </section>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-8">
        {live && e.ticket ? <button type="button" className="btn btn-main w-full" onClick={() => act.push({ t: "room", id })}>Walk in</button>
          : e.ticket ? <p className="rounded-2xl bg-[var(--brand-soft)] py-4 text-center text-[16px] font-semibold text-[var(--brand)]">You&apos;re going</p>
          : <button type="button" className="btn btn-main w-full" onClick={() => (e.price ? act.sheet({ t: "pay", eventId: id }) : (act.ticket(id), act.say("You're going")))}>{e.price ? `Get a seat, ₹${e.price.toLocaleString("en-IN")}` : "I'm going"}</button>}
      </div>
    </div>
  );
}

/** The magic room: everyone who dialled the PIN, until the clock runs out. */
export function RoomScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(500);
  const e = s.events.find((x) => x.id === id)!;
  const ms = e.endsAt - now;
  const over = e.dissolved || ms <= 0;
  useEffect(() => { if (ms <= 0 && !e.dissolved) act.dissolve(id); }, [ms, e.dissolved, act, id]);
  const [order] = useState(() => byFit(s, e.going));
  const closing = ms < 10 * 60_000;
  const last = ms < 13_000;
  return (
    <div className="relative flex h-full flex-col bg-[var(--ink)] text-white">
      <AnimatePresence>
        {over ? <Dissolved key="over" e={e} /> : (
          <motion.div key="room" className="flex min-h-0 flex-1 flex-col" exit={{ opacity: 0, filter: "blur(18px)", scale: 1.06 }} transition={{ duration: 1.1 }} animate={{ opacity: last ? Math.max(0.35, ms / 13_000) : 1 }}>
            <Bar dark title={e.title.split(":")[0]} sub={`${count(e.inside + 1)} inside`} right={<span className="digits mr-4 rounded-full px-3.5 py-1.5 text-[17px] font-medium" style={{ background: closing ? "var(--live)" : "rgba(255,255,255,0.12)" }} role="timer" aria-label="Time left">{left(ms)}</span>} />
            <div className="scroll flex flex-none gap-3 overflow-x-auto px-5 pb-3 pt-1">
              {order.map((m, i) => (
                <motion.button key={m} type="button" onClick={() => act.push({ t: "person", id: m })} initial={{ scale: 0, y: 24 }} animate={{ scale: 1, y: 0 }} transition={{ ...spring, delay: 0.12 + i * 0.08 }} className="relative flex w-[74px] flex-none flex-col items-center">
                  <Avatar id={m} size={60} />
                  {s.saved.includes(m) && <span className="absolute right-1.5 top-0 grid h-5 w-5 place-items-center rounded-full bg-[var(--sun)] text-[var(--ink)]"><BookmarkCheck size={12} /></span>}
                  <span className="mt-1.5 text-[14px] font-medium">{firstOf(m)}</span>
                  <span className="w-full truncate text-center text-[12.5px] text-white/60">{person(m)?.intents[0]}</span>
                </motion.button>
              ))}
            </div>
            <p className="flex-none px-5 pb-1 text-[14px] text-white/65">{closing ? "Closing soon. Tap anyone you want to keep." : e.inside > 500 ? "The people here most worth meeting, for you." : "Everyone here dialled the same six digits."} <button type="button" className="underline underline-offset-4" onClick={() => act.hurry(id)}>Skip to the end</button></p>
            <Thread thread={`r:${id}`} dark />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dissolved({ e }: { e: Event }) {
  const { s, act } = useStore();
  const sorted = byFit(s, e.going);
  const kept = sorted.filter((m) => s.saved.includes(m));
  const rest = sorted.filter((m) => !s.saved.includes(m));
  const said = (s.threads[`r:${e.id}`] ?? []).length;
  const c = s.communities.find((x) => x.id === e.communityId)!;
  const [offer] = useState(!c.joined);
  return (
    <motion.div className="absolute inset-0 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.7 }}>
      <div className="scroll flex-1 px-6 pb-6 pt-[max(env(safe-area-inset-top),56px)]">
      <h1 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em]">The room<br />is gone.</h1>
      <p className="mt-3 text-[16.5px] leading-snug text-white/75">{count(e.inside + 1)} people, {said} messages, one evening. What you keep is who you met.</p>
      <h2 className="mt-8 text-[16px] font-semibold">{rest.length ? "Anyone you don't want to lose?" : "You kept everyone"}</h2>
      <ul className="mt-2">
        {[...rest, ...kept].map((m) => {
          const on = s.saved.includes(m);
          const why = overlap(s, person(m)!).line;
          return (
            <motion.li layout key={m} className="flex items-center gap-3.5 py-2.5">
              <Avatar id={m} size={48} />
              <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{nameOf(m)}</span><span className="block truncate text-[14px] text-white/65">{why ?? person(m)?.headline}</span></span>
              <button type="button" aria-pressed={on} onClick={() => act.save(m)} className="press min-h-[44px] rounded-full px-4 text-[14.5px] font-semibold" style={{ background: on ? "var(--sun)" : "rgba(255,255,255,0.14)", color: on ? "var(--ink)" : "#fff" }}>{on ? "Kept" : "Keep"}</button>
            </motion.li>
          );
        })}
      </ul>
      {offer && (
        <div className="mt-4 flex flex-none items-center gap-3.5 rounded-[22px] bg-white/10 p-4">
          <Glyph c={c} size={46} />
          <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold">{c.name}</span><span className="text-[14px] text-white/65">They hosted tonight. They do this often.</span></span>
          <button type="button" disabled={c.joined} onClick={() => act.joinCommunity(c.id)} className="press min-h-[44px] rounded-full px-4 text-[14.5px] font-semibold" style={{ background: c.joined ? "var(--sun)" : "#fff", color: "var(--ink)" }}>{c.joined ? "Joined" : "Join"}</button>
        </div>
      )}
      </div>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-3"><button type="button" className="btn btn-sun w-full" onClick={() => act.tab(kept.length ? "messages" : "communities")}>{kept.length ? "Message the ones you kept" : "Back to communities"}</button></div>
    </motion.div>
  );
}
