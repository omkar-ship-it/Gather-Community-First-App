"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { count, momentsFor, overlap, person, useStore, type Moment, type Nudge } from "@/lib/store";
import { Avatar, firstOf, spring } from "./ui";

// ------------------------------------------------------------ a person, tapping your shoulder
export function NudgeBanner() {
  const { s, act } = useStore();
  return <AnimatePresence mode="wait">{s.nudge && s.me && s.auth === null && !s.arrival && !s.sending && <Banner key={s.nudge.key} n={s.nudge} onGo={() => act.go(s.nudge!.go)} onDone={act.quiet} />}</AnimatePresence>;
}

function Banner({ n, onGo, onDone }: { n: Nudge; onGo: () => void; onDone: () => void }) {
  useEffect(() => { navigator.vibrate?.(14); const t = window.setTimeout(onDone, 5200); return () => window.clearTimeout(t); }, [n.key, onDone]);
  return (
    <motion.button type="button" role="status" onClick={onGo} initial={{ y: -120, scale: 0.92 }} animate={{ y: 0, scale: 1 }} exit={{ y: -140, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 26 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.6, bottom: 0.1 }} onDragEnd={(_, i) => i.offset.y < -24 && onDone()}
      className="absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] z-[60] flex items-center gap-3 rounded-[24px] bg-[var(--ink)] p-3 text-left text-white shadow-[0_20px_40px_-16px_rgba(30,16,32,0.8)]">
      <motion.span className="rounded-full ring-[3px] ring-[var(--sun)]" initial={{ rotate: -14, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 320, damping: 10, delay: 0.12 }}><Avatar id={n.by} size={44} /></motion.span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold">{n.title}</span><span className="line-clamp-2 block text-[14px] leading-snug text-white/75">{n.text}</span></span>
    </motion.button>
  );
}

// ------------------------------------------------------------ sending something into the world
export function Sending() {
  const { s } = useStore();
  return (
    <AnimatePresence>
      {s.sending && (
        <motion.div className="absolute inset-0 z-[55] grid place-items-center overflow-hidden text-white" style={{ background: `hsl(${s.sending.hue} 46% 26%)` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.28 }} role="status">
          <div className="relative grid h-[300px] w-[300px] place-items-center">
            {[0, 0.28, 0.56].map((d) => <motion.span key={d} className="absolute h-24 w-24 rounded-full border-2 border-[var(--sun)]" initial={{ scale: 0.8, opacity: 0.9 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.4, delay: 0.1 + d, ease: "easeOut" }} aria-hidden="true" />)}
            {s.sending.faces.map((id, i, all) => { const a = (i / all.length) * Math.PI * 2 - Math.PI / 2; return <motion.span key={id} className="absolute" style={{ left: 150 + 112 * Math.cos(a) - 25, top: 150 + 112 * Math.sin(a) - 25 }} initial={{ opacity: 0.25, scale: 0.7 }} animate={{ opacity: 1, scale: [0.7, 1.2, 1] }} transition={{ delay: 0.5 + i * 0.07, duration: 0.4 }}><Avatar id={id} size={50} /></motion.span>; })}
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.15, 1] }} transition={{ duration: 0.5 }} className="relative rounded-full ring-4 ring-[var(--sun)]"><Avatar id="me" size={76} /></motion.span>
          </div>
          <div className="absolute inset-x-6 bottom-[16%] text-center"><p className="digits text-[42px] font-medium leading-none"><Up to={s.sending.reach} /></p><p className="mt-2 text-[17px] text-white/85">{s.sending.reach === 1 ? "just you, for now" : "people can hear you"}</p><p className="mt-0.5 text-[15px] text-white/65">{s.sending.label}</p></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Up({ to }: { to: number }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (x) => count(Math.round(x)));
  useEffect(() => { const a = animate(v, to, { duration: 1.1, ease: [0.22, 1, 0.36, 1] }); return () => a.stop(); }, [v, to]);
  return <motion.span>{text}</motion.span>;
}

// ------------------------------------------------------------ you kept each other
export function Meet() {
  const { s, act } = useStore();
  return <AnimatePresence>{s.meet && <Met key={s.meet} id={s.meet} onClose={act.met} />}</AnimatePresence>;
}

function Met({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, act } = useStore();
  const p = person(id)!;
  const o = overlap(s, p);
  const n = p.name.split(" ")[0];
  useEffect(() => { const t = window.setTimeout(() => navigator.vibrate?.([14, 50, 30]), 520); return () => window.clearTimeout(t); }, []);
  return (
    <motion.div className="absolute inset-0 z-[55] flex flex-col overflow-hidden bg-[var(--brand)] text-white" initial={{ clipPath: "circle(0% at 92% 6%)" }} animate={{ clipPath: "circle(150% at 92% 6%)" }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} role="dialog" aria-modal="true" aria-label={`You and ${n} kept each other`}>
      <div className="relative grid flex-1 place-items-center">
        {[0.5, 0.85, 1.2].map((d) => <motion.span key={d} className="absolute h-40 w-40 rounded-full border-2 border-[var(--sun)]" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 3, opacity: [0, 0.8, 0] }} transition={{ delay: d, duration: 1.6 }} aria-hidden="true" />)}
        <div className="flex items-center">
          <motion.span className="relative z-10 rounded-full ring-4 ring-[var(--brand)]" initial={{ x: -240, rotate: -30 }} animate={{ x: 14, rotate: 0 }} transition={{ type: "spring", stiffness: 190, damping: 15, delay: 0.2 }}><Avatar id="me" size={118} /></motion.span>
          <motion.span className="rounded-full ring-4 ring-[var(--sun)]" initial={{ x: 240, rotate: 30 }} animate={{ x: -14, rotate: 0 }} transition={{ type: "spring", stiffness: 190, damping: 15, delay: 0.2 }}><Avatar id={id} size={118} /></motion.span>
        </div>
      </div>
      <motion.div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),24px)]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, ...spring }}>
        <h1 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.03em]">{n} kept you too.</h1>
        {o.line && <p className="mt-2 text-[17px] leading-snug text-white/85">{o.line}</p>}
        <button type="button" className="btn btn-sun mt-6 w-full" onClick={() => { onClose(); act.go({ t: "dm", id, draft: (s.threads[`d:${id}`] ?? []).length ? "" : o.open }); }}>{(s.threads[`d:${id}`] ?? []).length ? `Message ${n}` : "Say the first thing"}</button>
        <button type="button" className="mt-1 min-h-[48px] w-full text-[15px] text-white/75" onClick={onClose}>Not yet</button>
      </motion.div>
    </motion.div>
  );
}

// ------------------------------------------------------------ while you were away
const STEP = 7000;

export function Moments() {
  const { s } = useStore();
  return <AnimatePresence>{s.moments && <Deck key="m" />}</AnimatePresence>;
}

function Deck() {
  const { s, act } = useStore();
  const [list] = useState<Moment[]>(() => momentsFor(s));
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const p = useMotionValue(0);
  const width = useTransform(p, (v) => `${v * 100}%`);
  const end = i >= list.length;
  const m = list[i];
  useEffect(() => {
    if (end) return;
    p.set(0);
  }, [i, end, p]);
  useEffect(() => {
    if (end || held) return;
    const a = animate(p, 1, { duration: ((1 - p.get()) * STEP) / 1000, ease: "linear", onComplete: () => setI((v) => v + 1) });
    return () => a.stop();
  }, [i, held, end, p]);
  useEffect(() => { if (!end) return; navigator.vibrate?.([10, 30, 16]); const t = window.setTimeout(() => act.moments(false), 2600); return () => window.clearTimeout(t); }, [end, act]);
  const back = () => { p.set(0); setI((v) => Math.max(0, v - 1)); };
  const hue = m?.hue ?? 318;
  return (
    <motion.div className="absolute inset-0 z-[52] flex flex-col overflow-hidden text-white" initial={{ clipPath: "inset(16% 5% 62% 5% round 26px)", opacity: 0 }} animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, backgroundColor: end ? "#6b1d4f" : `hsl(${hue} 46% 26%)` }} exit={{ opacity: 0, y: 80, scale: 0.94 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, d) => d.offset.y > 110 && act.moments(false)} role="dialog" aria-modal="true" aria-label="While you were away">
      <div className="flex flex-none gap-1.5 px-4 pt-[max(env(safe-area-inset-top),16px)]">{list.map((x, k) => <span key={x.key} className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/25">{k === i ? <motion.span className="block h-full rounded-full bg-white" style={{ width }} /> : <span className="block h-full rounded-full bg-white" style={{ width: k < i ? "100%" : 0 }} />}</span>)}</div>
      <div className="flex flex-none items-center justify-between px-4 pt-2"><span className="text-[15px] text-white/80">While you were away</span><button type="button" aria-label="Close" className="press grid h-11 w-11 place-items-center" onClick={() => act.moments(false)}><X size={22} /></button></div>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {end ? (
            <motion.div key="end" className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
              <span className="flex -space-x-4">{list.map((x, k) => <motion.span key={x.key} className="rounded-full ring-4 ring-[var(--brand)]" initial={{ x: (k - list.length / 2) * 70, y: 60, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ ...spring, delay: k * 0.07 }}><Avatar id={x.by} size={64} /></motion.span>)}</span>
              <h1 className="mt-7 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em]">You&apos;re all caught up.</h1>
              <p className="mt-2 text-[17px] text-white/80">Good to have you back, {s.me?.name.split(" ")[0]}.</p>
            </motion.div>
          ) : m && (
            <motion.div key={m.key} className="absolute inset-0 flex flex-col" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex min-h-0 flex-1 flex-col justify-center px-6">
                <motion.span className="w-fit rounded-full ring-4 ring-white/25" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}><Avatar id={m.by} size={92} /></motion.span>
                <p className="mt-6 text-[17px] font-medium text-[var(--sun)]">{m.kicker}</p>
                <p className="mt-2 line-clamp-5 text-[27px] font-semibold leading-[1.16] tracking-[-0.02em]">{m.text}</p>
              </div>
              {/* Tap the sides to move, press to pause. */}
              <div className="absolute inset-x-0 bottom-[110px] top-0 flex" onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerLeave={() => setHeld(false)} onPointerCancel={() => setHeld(false)}>
                <button type="button" aria-label="Previous" className="w-1/3" onClick={back} /><button type="button" aria-label="Next" className="w-2/3" onClick={() => setI((v) => v + 1)} />
              </div>
              <div className="relative flex-none px-6 pb-[max(env(safe-area-inset-bottom),26px)]"><button type="button" className="btn btn-sun w-full" onClick={() => { act.moments(false); act.go(m.go); }}>{m.cta}</button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------ walking into a room
export function Doors({ n, who }: { n: number; who: string | undefined }) {
  const panel = (side: "left" | "right") => <motion.span className="absolute inset-y-0 w-1/2 bg-[var(--brand)]" style={{ [side]: 0 }} initial={{ x: 0 }} animate={{ x: side === "left" ? "-101%" : "101%" }} transition={{ delay: 0.75, duration: 0.7, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true" />;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {panel("left")}{panel("right")}
      <motion.div className="absolute inset-0 grid place-items-center text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 1.15] }} transition={{ duration: 1.3, times: [0, 0.2, 0.62, 1] }}><div><p className="text-[32px] font-semibold tracking-[-0.03em]">You&apos;re number <span className="digits">{count(n)}</span></p>{who && <p className="mt-1 text-[17px] text-white/80">{firstOf(who)} is already inside</p>}</div></motion.div>
    </div>
  );
}
