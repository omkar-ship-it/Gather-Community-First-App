"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { INTENTS } from "@/lib/data";
import { chunked } from "@/lib/ids";
import { person, useStore, type Target } from "@/lib/store";
import { Avatar, spring } from "./ui";

function destination(s: ReturnType<typeof useStore>["s"], t: Target | null) {
  if (!t) return null;
  if (t.kind === "person") return person(t.id)?.name.split(" ")[0] ?? null;
  if (t.kind === "room") return s.events.find((e) => e.id === t.id)?.title.split(":")[0] ?? null;
  if (t.kind === "group") return s.groups.find((g) => g.id === t.id)?.name ?? null;
  return s.communities.find((c) => c.id === t.id)?.name ?? null;
}

export default function Onboarding() {
  const { s } = useStore();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={s.auth} className="absolute inset-0 z-30 flex flex-col bg-[var(--bg)]" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
        {s.auth === "welcome" && <Welcome />}
        {s.auth === "contact" && <Contact />}
        {s.auth === "code" && <Code />}
        {s.auth === "profile" && <Profile />}
        {s.auth === "reveal" && <Reveal />}
      </motion.div>
    </AnimatePresence>
  );
}

function Welcome() {
  const { act } = useStore();
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[var(--brand)] text-white">
      <div className="relative flex flex-1 items-center justify-center" aria-hidden="true">
        {[0, 0.8, 1.6].map((d) => <span key={d} className="ripple absolute h-40 w-40 rounded-full border-2 border-white/40" style={{ animationDelay: `${d}s` }} />)}
        <div className="relative h-[230px] w-[230px]">
          {["319044725", "255183069", "541033870", "382604157", "477319203", "228476195"].map((id, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.span key={id} className="absolute" style={{ left: 115 + 92 * Math.cos(a) - 30, top: 115 + 92 * Math.sin(a) - 30 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 + i * 0.07 }}>
                <span className="block rounded-full ring-4 ring-[var(--brand)]"><Avatar id={id} size={60} /></span>
              </motion.span>
            );
          })}
          <motion.span className="absolute left-[78px] top-[78px] grid h-[74px] w-[74px] place-items-center rounded-full bg-[var(--sun)] text-[34px] font-bold text-[var(--ink)]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.5 }}>g</motion.span>
        </div>
      </div>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),26px)]">
        <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.03em]">Dial in to<br />your people.</h1>
        <p className="mt-3 max-w-[19rem] text-[16.5px] leading-snug text-white/80">Six digits and you&apos;re in the room. No phone numbers handed around.</p>
        <button type="button" className="btn btn-sun mt-7 w-full" onClick={() => act.dial(true)}>I have a number</button>
        <button type="button" className="btn mt-2.5 w-full bg-white/12 text-white" onClick={() => act.auth("contact")}>Get your own</button>
        <button type="button" className="mt-2 min-h-[44px] w-full text-[14.5px] font-medium text-white/75 underline underline-offset-4" onClick={act.lived}>Skip ahead to a lived-in account</button>
      </div>
    </div>
  );
}

function Frame({ title, sub, children, foot }: { title: string; sub: string; children: React.ReactNode; foot: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-[max(env(safe-area-inset-top),64px)]">
      <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.025em]">{title}</h1>
      <p className="mt-2 text-[15.5px] leading-snug text-[var(--soft)]">{sub}</p>
      <div className="scroll mt-7 flex-1">{children}</div>
      {foot}
    </div>
  );
}

function Contact() {
  const { s, act } = useStore();
  const [v, setV] = useState("");
  const to = destination(s, s.pending);
  return (
    <Frame title={to ? `One step from ${to}` : "Your number stays yours"} sub="We check your mobile or email once. Nobody on Gather ever sees it: they get your Gather number instead."
      foot={<button type="button" className="btn btn-main w-full" disabled={v.trim().length < 5} onClick={() => act.auth("code")}>Send me a code</button>}>
      <input className="field" autoFocus placeholder="Mobile or email" aria-label="Mobile or email" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && v.trim().length >= 5 && act.auth("code")} />
    </Frame>
  );
}

function Code() {
  const { act } = useStore();
  const [v, setV] = useState("");
  return (
    <Frame title="Four digits" sub="This is a prototype, so any four will do." foot={<button type="button" className="min-h-[44px] text-[14.5px] font-medium text-[var(--soft)]" onClick={() => act.auth("contact")}>Use a different mobile or email</button>}>
      <label className="relative flex gap-3">
        <input className="absolute inset-0 opacity-0" inputMode="numeric" autoComplete="one-time-code" autoFocus aria-label="Verification code" value={v} onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setV(d); if (d.length === 4) window.setTimeout(() => act.auth("profile"), 260); }} />
        {[0, 1, 2, 3].map((i) => <span key={i} className="digits grid h-[68px] w-[60px] place-items-center rounded-2xl bg-[var(--card)] text-[28px]" style={{ border: `2px solid ${v.length === i ? "var(--brand)" : "var(--line)"}` }}>{v[i] ?? ""}</span>)}
      </label>
    </Frame>
  );
}

function Profile() {
  const { act } = useStore();
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const ok = name.trim().length >= 2 && tags.length === 3;
  return (
    <Frame title="What should people know?" sub="Your name and three things you're here for. The rest can wait."
      foot={<button type="button" className="btn btn-main w-full" disabled={!ok} onClick={() => act.signUp(name.trim(), tags)}>{ok ? "Get my Gather number" : name.trim().length < 2 ? "Add your name" : `Pick ${3 - tags.length} more`}</button>}>
      <input className="field" autoFocus placeholder="Your name" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
      <div className="mt-5 flex flex-wrap gap-2 pb-4">
        {INTENTS.map((t) => {
          const on = tags.includes(t);
          return <button key={t} type="button" aria-pressed={on} disabled={!on && tags.length === 3} className="press min-h-[44px] rounded-full px-4 text-[15px] font-medium disabled:opacity-40" style={{ background: on ? "var(--sun)" : "var(--card)", border: `1.5px solid ${on ? "var(--sun)" : "var(--line)"}` }} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>;
        })}
      </div>
    </Frame>
  );
}

/** The first peak: your ID rolls in like a number being chosen for you. */
function Reveal() {
  const { s, act } = useStore();
  const id = s.me!.id;
  const [shown, setShown] = useState(0);
  const done = shown >= id.length;
  const ref = useRef(0);
  const [spin, setSpin] = useState(0);
  useEffect(() => {
    const roll = window.setInterval(() => setSpin((x) => x + 1), 55);
    const land = window.setInterval(() => { ref.current += 1; setShown(ref.current); navigator.vibrate?.(6); if (ref.current >= id.length) { window.clearInterval(land); window.clearInterval(roll); navigator.vibrate?.([20, 40, 40]); } }, 260);
    return () => { window.clearInterval(roll); window.clearInterval(land); };
  }, [id.length]);
  const to = destination(s, s.pending);
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-[var(--ink)] px-6 pb-[max(env(safe-area-inset-bottom),26px)] text-center text-white">
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[17px] text-white/70">{done ? `${s.me!.name.split(" ")[0]}, this one's yours` : "Finding your number"}</p>
        <div className="relative mt-6 flex items-center gap-2">
          {done && [0, 0.5, 1].map((d) => <span key={d} className="ripple absolute left-1/2 top-1/2 -ml-24 -mt-24 h-48 w-48 rounded-full border-2 border-[var(--sun)]" style={{ animationDelay: `${d}s` }} aria-hidden="true" />)}
          {chunked(id).map((part, pi) => (
            <motion.span key={pi} className="digits relative flex rounded-full px-4 py-3 text-[30px] font-medium" animate={{ background: done ? "#FFB627" : "rgba(255,255,255,0.10)", color: done ? "#1E1020" : "#ffffff" }} transition={{ duration: 0.4 }}>
              {part.split("").map((d, i) => { const n = pi * 3 + i; return <span key={i} className="inline-block w-[0.66em]" style={{ opacity: n < shown ? 1 : 0.35 }}>{n < shown ? d : (spin * 7 + n * 3) % 10}</span>; })}
            </motion.span>
          ))}
        </div>
        <motion.p className="mt-8 max-w-[18rem] text-[16px] leading-snug text-white/75" initial={false} animate={{ opacity: done ? 1 : 0, y: done ? 0 : 10 }}>
          Say it out loud, write it on a napkin. Anyone can reach you with it, and nobody learns your phone number.
        </motion.p>
      </div>
      <motion.button type="button" className="btn btn-sun w-full" disabled={!done} animate={{ opacity: done ? 1 : 0 }} onClick={() => { const t = s.pending; act.auth(null); if (t) act.enter(t); }}>{to ? `Take me to ${to}` : "Start"}</motion.button>
    </div>
  );
}
