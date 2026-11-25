"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { INTENTS } from "@/lib/data";
import { maskMobile, person, useStore, waiting, type Target } from "@/lib/store";
import { Claim, Held, Pick } from "./Pick";
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
        {s.auth === "pick" && <Pick />}
        {s.auth === "profile" && <Profile />}
        {s.auth === "reveal" && <Claim to={destination(s, s.pending)} />}
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
          {["31904472311", "25518306683", "54103387403", "38260415924", "47731920156", "22847619537"].map((id, i) => {
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
        <button type="button" className="btn mt-2.5 w-full bg-white/12 text-white" onClick={() => act.auth("contact")}>Choose my number</button>
        <span className="mt-2 flex justify-center gap-6"><button type="button" className="min-h-[44px] text-[14.5px] font-medium text-white/75 underline underline-offset-4" onClick={act.lived}>Skip ahead</button><button type="button" className="min-h-[44px] text-[14.5px] font-medium text-white/75 underline underline-offset-4" onClick={act.place}>I run a place</button></span>
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
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const to = destination(s, s.pending);
  const m = mobile.replace(/\D/g, "").slice(-10);
  const ok = /^[6-9]\d{9}$/.test(m) && /.+@.+\..+/.test(email.trim());
  return (
    <Frame title={to ? `One step from ${to}` : "First, who holds it?"} sub="Next you choose your own number, for life. One mobile and one email keep it yours, and nobody you meet sees either."
      foot={<button type="button" className="btn btn-main w-full" disabled={!ok} onClick={() => act.contact(m, email.trim())}>Text me a code</button>}>
      <input className="field" autoFocus inputMode="tel" autoComplete="tel" placeholder="Mobile" aria-label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      <input className="field mt-3" inputMode="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ok && act.contact(m, email.trim())} />
      <p className="mt-4 text-[14.5px] leading-snug text-[var(--soft)]">Already have one? Use the same mobile. Here, 98765 43210 belongs to Omkar.</p>
    </Frame>
  );
}

function Code() {
  const { s, act } = useStore();
  const [v, setV] = useState("");
  const go = () => {
    if (s.contact.mobile !== "9876543210") return act.auth("pick");
    const t = s.pending;
    act.back();
    if (t) act.enter(t);
    act.welcomeBack();
  };
  return (
    <Frame title="Four digits" sub={`Sent to ${maskMobile(s.contact.mobile)}. This is a prototype, so any four will do.`} foot={<button type="button" className="min-h-[44px] text-[14.5px] font-medium text-[var(--soft)]" onClick={() => act.auth("contact")}>Use a different mobile</button>}>
      <label className="relative flex gap-3 pt-3">
        <input className="absolute inset-0 opacity-0" inputMode="numeric" autoComplete="one-time-code" autoFocus aria-label="Verification code" value={v} onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setV(d); if (d.length === 4) { navigator.vibrate?.([8, 30, 14]); window.setTimeout(go, 620); } }} />
        {[0, 1, 2, 3].map((i) => <motion.span key={i} className="digits grid h-[68px] w-[60px] place-items-center rounded-2xl text-[28px]" animate={v.length === 4 ? { backgroundColor: "#ffb627", y: [0, -9, 0] } : { backgroundColor: "#ffffff", y: 0 }} transition={{ delay: v.length === 4 ? i * 0.06 : 0, duration: 0.34 }} style={{ border: `2px solid ${v.length === 4 ? "var(--sun)" : v.length === i ? "var(--brand)" : "var(--line)"}` }}>{v[i] ?? ""}</motion.span>)}
      </label>
    </Frame>
  );
}

function Profile() {
  const { act } = useStore();
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const ok = name.trim().length >= 2 && tags.length === 3;
  const who = waiting(tags);
  return (
    <Frame title="What should people know?" sub="Your name and three things you're here for, and the number is yours."
      foot={<><AnimatePresence>{who.length > 0 && (
        <motion.div className="flex flex-none items-center gap-3 pb-3" initial={{ opacity: 0, y: 12, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={spring}>
          <span className="flex flex-none -space-x-2.5"><AnimatePresence>{who.slice(0, 5).map((p) => <motion.span key={p.id} layout initial={{ scale: 0, x: -10 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0 }} transition={spring} className="rounded-full ring-[3px] ring-[var(--bg)]"><Avatar id={p.id} size={38} /></motion.span>)}</AnimatePresence></span>
          <span className="text-[15px] leading-snug" aria-live="polite">{who[0].name.split(" ")[0]}{who.length > 1 ? ` and ${who.length - 1} more` : ""} would like to meet you</span>
        </motion.div>
      )}</AnimatePresence><button type="button" className="btn btn-main w-full" disabled={!ok} onClick={() => act.signUp(name.trim(), tags)}>{ok ? "Claim my number" : name.trim().length < 2 ? "Add your name" : `Pick ${3 - tags.length} more`}</button></>}>
      <Held />
      <input className="field" placeholder="Your name" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
      <div className="mt-5 flex flex-wrap gap-2 pb-4">
        {INTENTS.map((t) => {
          const on = tags.includes(t);
          return <button key={t} type="button" aria-pressed={on} disabled={!on && tags.length === 3} className="press min-h-[44px] rounded-full px-4 text-[15px] font-medium disabled:opacity-40" style={{ background: on ? "var(--sun)" : "var(--card)", border: `1.5px solid ${on ? "var(--sun)" : "var(--line)"}` }} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>;
        })}
      </div>
    </Frame>
  );
}
