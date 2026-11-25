"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Search, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chunked, pretty } from "@/lib/ids";
import { STYLES, TIER, containing, offers, one, type Offer, type Style, type Tier } from "@/lib/numbers";
import { left, linkTo, useNow, useStore } from "@/lib/store";
import { spring } from "./ui";

const TONE: Record<Tier, { bg: string; fg: string }> = {
  free: { bg: "rgba(255,255,255,0.1)", fg: "#fff" },
  catchy: { bg: "#f3c6dd", fg: "#1e1020" },
  premium: { bg: "#ffb627", fg: "#1e1020" },
  rare: { bg: "#e8452f", fg: "#fff" },
};
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const hidden = (id: string) => `@••• •••• ${chunked(id)[2]}`;

type Row = Offer & { key: number; gone?: boolean };
let k = 0;
const rows = (list: Offer[]): Row[] => list.map((o) => ({ ...o, key: ++k }));

/**
 * Choosing a number. There is exactly one of each, so the urgency is real:
 * while you look, other people are choosing too. (Here they are simulated;
 * in the product a row may only go when somebody really takes it.)
 */
export function Pick() {
  const { s, act } = useStore();
  const [style, setStyle] = useState<Style>("mix");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Row[]>(() => rows([...(s.lapsed ? [s.lapsed] : []), ...offers("mix")]));
  const [pick, setPick] = useState<Offer | null>(null);
  const [news, setNews] = useState<string | null>(null);
  const own = q.length >= 5 && s.contact.mobile.includes(q);

  const load = (st: Style, digits = "") => { setStyle(st); setPick(null); setList(rows(digits ? containing(digits) : offers(st))); };
  const type = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 6); setQ(d); if (d.length >= 5 && s.contact.mobile.includes(d)) { setPick(null); setList([]); } else load("mix", d); };

  // Somebody else takes one. Never the one under your thumb.
  const chosen = pick?.id;
  useEffect(() => {
    const id = window.setInterval(() => {
      setList((old) => {
        const free = old.filter((o) => !o.gone && o.id !== chosen);
        if (free.length < 3) return old;
        const hit = free[Math.floor(Math.random() * free.length)];
        window.setTimeout(() => setNews(`${hidden(hit.id)} was just taken`), 0);
        window.setTimeout(() => setList((now) => now.map((o) => (o.key === hit.key ? { ...(q ? (containing(q, 1)[0] ?? one(style, new Set())) : one(style, new Set(now.map((x) => x.id)), style === "mix" ? hit.tier : undefined)), key: ++k } : o))), 1700);
        return old.map((o) => (o.key === hit.key ? { ...o, gone: true } : o));
      });
    }, 6200);
    return () => window.clearInterval(id);
  }, [chosen, style, q]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--ink)] text-white">
      <div className="flex-none px-6 pt-[max(env(safe-area-inset-top),34px)]">
        <h1 className="text-[31px] font-semibold leading-[1.05] tracking-[-0.03em]">Choose your number</h1>
        <p className="mt-2 text-[15.5px] leading-snug text-white/75">There&apos;s one of each, and it&apos;s for life. Once it&apos;s someone&apos;s, it&apos;s gone.</p>
        <label className="mt-4 flex min-h-[52px] items-center gap-3 rounded-[18px] bg-white/10 px-4 focus-within:ring-2 focus-within:ring-white/50">
          <Search size={20} className="flex-none text-white/60" />
          <input className="digits w-full bg-transparent text-[17px] !outline-none placeholder:text-white/55" inputMode="numeric" placeholder="A date, a jersey, a lucky 7" aria-label="Digits you'd like" value={q} onChange={(e) => type(e.target.value)} />
        </label>
        <div className="scroll -mx-6 mt-3 flex gap-2 overflow-x-auto px-6" role="radiogroup" aria-label="Style">
          {STYLES.map((x) => { const on = !q && style === x.id; return <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => { setQ(""); load(x.id); }} className="press min-h-[44px] flex-none rounded-full px-4 text-[14.5px] font-medium" style={{ background: on ? "#fff" : "rgba(255,255,255,0.1)", color: on ? "var(--ink)" : "#fff" }}>{x.label}</button>; })}
        </div>
      </div>

      <div className="scroll mt-3 min-h-0 flex-1 px-4 pb-3">
        {own && <p className="mx-2 mt-6 text-[15.5px] leading-snug text-white/80">That&apos;s from your mobile number. Pick something that doesn&apos;t give it away.</p>}
        <ul>
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((o, i) => {
              const on = pick?.id === o.id;
              const t = TONE[o.tier];
              return (
                <motion.li layout key={o.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: o.gone ? 0.4 : 1, y: 0, transition: { ...spring, delay: Math.min(i, 8) * 0.03 } }} exit={{ opacity: 0, x: -60 }}>
                  <button type="button" disabled={o.gone} aria-pressed={on} onClick={() => { navigator.vibrate?.(6); setPick(on ? null : o); }} className="press relative mb-2 flex w-full items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-left transition-colors" style={{ background: on ? "#fff" : "rgba(255,255,255,0.07)", color: on ? "var(--ink)" : "#fff" }}>
                    <span className="min-w-0">
                      <span className="digits relative block text-[clamp(18px,5.4vw,21px)] font-medium"><Digits o={o} on={on} />{o.gone && <motion.span className="absolute left-0 top-1/2 h-[2px] bg-[var(--live)]" initial={{ width: 0 }} animate={{ width: "100%" }} />}</span>
                      <span className="block truncate text-[13.5px] opacity-70">{o.gone ? "Just taken" : o.why}</span>
                    </span>
                    <span className="flex-none rounded-full px-3 py-1.5 text-center text-[13.5px] font-semibold" style={on ? { background: "var(--brand)", color: "#fff" } : { background: t.bg, color: t.fg }}>{o.gone ? "Gone" : o.price ? rupees(o.price) : "Free"}</span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {!own && <button type="button" onClick={() => load(q ? "mix" : style, q)} className="press mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 text-[15px] font-medium text-white/80"><RefreshCw size={17} /> Show me others</button>}
      </div>

      <div className="flex-none border-t border-white/10 px-6 pb-[max(env(safe-area-inset-bottom),20px)] pt-3">
        <p className="mb-2.5 flex min-h-[20px] items-center justify-center gap-2 text-[13.5px] text-white/70" aria-live="polite">
          {pick ? `${TIER[pick.tier].label}. ${pick.why}.` : news ? <><span className="dot-live h-2 w-2 rounded-full bg-[var(--live)]" />{news}</> : "Others are choosing right now"}
        </p>
        <button type="button" className="btn btn-sun w-full" disabled={!pick} onClick={() => { if (pick) { navigator.vibrate?.([10, 30, 10]); act.hold(pick); } }}>{pick ? `Hold ${pretty(pick.id)}` : "Tap the one that's you"}</button>
      </div>
    </div>
  );
}

/** A number with the part that makes it special picked out. */
function Digits({ o, on }: { o: Offer; on: boolean }) {
  const parts = chunked(o.id);
  return <>{parts.map((part, pi) => { const from = parts.slice(0, pi).join("").length; return <span key={pi} className={pi ? "ml-[0.55em]" : ""}>{[...part].map((d, i) => <span key={i} style={{ color: from + i >= o.hot[0] && from + i < o.hot[1] ? (on ? "var(--brand)" : "var(--sun)") : undefined }}>{d}</span>)}</span>; })}</>;
}

/** The clock on a number you're holding. When it runs out, the number goes back on the shelf. */
export function Held() {
  const { s, act } = useStore();
  const now = useNow();
  const h = s.held;
  const ms = h ? h.until - now : 0;
  useEffect(() => { if (h && ms <= 0) { act.hold(null); act.say(`${pretty(h.id)} went back on the list`); } }, [h, ms, act]);
  if (!h) return null;
  const last = ms < 60_000;
  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-[20px] bg-[var(--ink)] px-4 py-3 text-white">
      <span className="min-w-0"><span className="digits block text-[18px] font-medium">{pretty(h.id)}</span><span className="text-[13.5px] text-white/70">Held for you. <button type="button" className="underline underline-offset-4" onClick={() => act.hold(null)}>Change</button></span></span>
      <span className="digits flex-none rounded-full px-3 py-1.5 text-[16px] font-medium" style={{ background: last ? "var(--live)" : "rgba(255,255,255,0.14)" }} role="timer" aria-label="Time left on your number">{left(ms)}</span>
    </div>
  );
}

const HOLD = 1400;

/** The claim: press, and your number locks in one digit at a time. Let go early and it slips. */
export function Claim({ to }: { to: string | null }) {
  const { s, act } = useStore();
  const me = s.me!;
  const id = me.id;
  const price = s.held?.price ?? 0;
  const [paid, setPaid] = useState<"no" | "paying" | "yes">(price ? "no" : "yes");
  const [how, setHow] = useState<"UPI" | "Card">("UPI");
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef(0);
  const v = useRef(0);
  const seen = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const finish = () => { cancelAnimationFrame(raf.current); setP(1); setDone(true); navigator.vibrate?.([20, 40, 60]); };
  const run = (dir: 1 | -1) => {
    if (done) return;
    cancelAnimationFrame(raf.current);
    let at: number | null = null;
    const step = (t: number) => {
      const dt = at === null ? 0 : t - at;
      at = t;
      v.current = Math.max(0, Math.min(1, v.current + (dir * dt) / (dir > 0 ? HOLD : 500)));
      const n = Math.floor(v.current * id.length);
      if (n > seen.current) navigator.vibrate?.(8);
      seen.current = n;
      setP(v.current);
      if (v.current >= 1) return finish();
      if (dir > 0 || v.current > 0) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const lit = Math.floor(p * id.length);
  const pay = () => { setPaid("paying"); window.setTimeout(() => setPaid("yes"), 1200); };
  const share = async () => {
    const text = `My Gather number is ${pretty(id)}. There's only one. Get yours before someone else does: ${linkTo({ kind: "person", id })}`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); act.say("Copied. Show it off"); } } catch { /* they changed their mind */ }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-[var(--ink)] px-6 pb-[max(env(safe-area-inset-bottom),26px)] text-center text-white">
      {done && <Burst />}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p key={done ? "d" : paid} className="text-[19px] font-medium" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {done ? `${me.name.split(" ")[0]}, it's yours.` : paid === "yes" ? "Make it yours" : "One payment. Yours for life."}
          </motion.p>
        </AnimatePresence>
        <motion.div className="relative mt-7 flex items-center gap-1.5" animate={done ? { scale: [1, 1.12, 1] } : { scale: 1 + p * 0.04 }} transition={done ? { duration: 0.5 } : { duration: 0.1 }}>
          {done && [0, 0.5, 1].map((d) => <span key={d} className="ripple absolute left-1/2 top-1/2 -ml-24 -mt-24 h-48 w-48 rounded-full border-2 border-[var(--sun)]" style={{ animationDelay: `${d}s` }} aria-hidden="true" />)}
          {chunked(id).map((part, pi) => {
            const from = chunked(id).slice(0, pi).join("").length;
            return (
              <span key={pi} className="digits relative flex overflow-hidden rounded-full px-3.5 py-3 text-[clamp(21px,6.6vw,27px)] font-medium" style={{ background: done ? "#FFB627" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }}>
                {part.split("").map((d, i) => { const on = from + i < lit; return <span key={i} className="inline-block w-[0.66em]" style={{ color: done ? "#1E1020" : on ? "#FFB627" : "rgba(255,255,255,0.55)", transform: on && !done ? "translateY(-2px)" : undefined, transition: "color 0.15s, transform 0.15s" }}>{d}</span>; })}
              </span>
            );
          })}
        </motion.div>
        <p className="mt-7 min-h-[66px] max-w-[18rem] text-[16px] leading-snug text-white/75">
          {done ? "Nobody else will ever have this number. Anyone can reach you with it, and nobody learns your mobile or email." : s.held?.why ?? ""}
        </p>
      </div>

      <div className="relative w-full flex-none">
        {paid !== "yes" ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pay with">{(["UPI", "Card"] as const).map((h) => <button key={h} type="button" role="radio" aria-checked={how === h} onClick={() => setHow(h)} className="press min-h-[52px] rounded-2xl text-[16px] font-semibold" style={{ border: `2px solid ${how === h ? "var(--sun)" : "rgba(255,255,255,0.2)"}`, color: how === h ? "var(--sun)" : "#fff" }}>{h}</button>)}</div>
            <button type="button" className="btn btn-sun w-full" disabled={paid === "paying"} onClick={pay}>{paid === "paying" ? "Paying" : `Pay ${rupees(price)}`}</button>
            <p className="mt-2.5 text-[13.5px] text-white/60">Prototype: no money moves.</p>
          </>
        ) : !done ? (
          <button
            type="button" aria-label={`Hold to claim ${pretty(id)}`}
            className="btn relative w-full touch-none select-none overflow-hidden bg-white/12 !min-h-[60px] text-white"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); run(1); }} onPointerUp={() => run(-1)} onPointerCancel={() => run(-1)} onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!e.repeat) run(1); } }} onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") run(-1); }}
            onClick={(e) => { if (e.detail === 0) finish(); }}
          >
            <span className="absolute inset-y-0 left-0 bg-[var(--sun)]" style={{ width: `${p * 100}%` }} aria-hidden="true" />
            <span className="relative">{p > 0.05 ? "Keep holding" : "Press and hold to claim it"}</span>
            <span className="absolute inset-0 grid place-items-center text-[var(--ink)]" style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} aria-hidden="true">{p > 0.05 ? "Keep holding" : "Press and hold to claim it"}</span>
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, ...spring }}>
            <button type="button" className="btn btn-sun w-full" onClick={() => { const t = s.pending; act.auth(null); if (t) act.enter(t); }}><Check size={20} /> {to ? `Take me to ${to}` : "Find my people"}</button>
            <button type="button" className="btn mt-2.5 w-full bg-white/12 text-white" onClick={share}><Share2 size={18} /> Show it off</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Confetti made of digits: the number itself, let loose. */
function Burst() {
  const [bits] = useState(() => Array.from({ length: 34 }, (_, i) => ({ d: i % 10, x: (Math.random() - 0.5) * 420, y: -120 - Math.random() * 380, r: (Math.random() - 0.5) * 320, s: 13 + Math.random() * 16, c: ["#ffb627", "#f3c6dd", "#e8452f", "#ffffff"][i % 4], t: 1.3 + Math.random() * 0.9 })));
  return (
    <div className="pointer-events-none absolute left-1/2 top-[44%]" aria-hidden="true">
      {bits.map((b, i) => <motion.span key={i} className="digits absolute font-medium" style={{ color: b.c, fontSize: b.s }} initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }} animate={{ x: b.x, y: [0, b.y, b.y + 460], opacity: [1, 1, 0], rotate: b.r, scale: 1 }} transition={{ duration: b.t, ease: "easeOut" }}>{b.d}</motion.span>)}
    </div>
  );
}
