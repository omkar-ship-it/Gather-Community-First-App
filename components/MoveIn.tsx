"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { PEOPLE, type Biz } from "@/lib/data";
import { linkTo, pairs, useStore, waLink } from "@/lib/store";
import { Avatar, Bar, Glyph, IdTiles, firstOf, spring } from "./ui";

const LOCAL = PEOPLE.filter((p) => p.zone === "Bengaluru").map((p) => p.id);
const STEPS = ["idea", "place", "invite", "arrive"] as const;

/**
 * Bringing a WhatsApp Business audience into Gather. The host keeps WhatsApp
 * and presses send there themselves: no contacts are uploaded and nothing is
 * connected, which is also why their broadcast lists keep working.
 */
export default function MoveIn({ id }: { id: string }) {
  const { s } = useStore();
  const [i, setI] = useState(0);
  const c = s.communities.find((x) => x.id === id)!;
  const next = () => { navigator.vibrate?.(8); setI((v) => v + 1); };
  const step = STEPS[i];
  return (
    <div className="flex h-full flex-col" style={{ background: step === "idea" || step === "arrive" ? `hsl(${c.hue} 46% 24%)` : "var(--bg)", transition: "background 0.4s" }}>
      <Bar dark={step === "idea" || step === "arrive"} title="" right={<span className="flex gap-1.5 pr-5" role="img" aria-label={`Step ${i + 1} of 4`}>{STEPS.map((x, k) => <motion.span key={x} className="h-2 rounded-full" animate={{ width: k === i ? 22 : 8, opacity: k <= i ? 1 : 0.3 }} style={{ background: step === "idea" || step === "arrive" ? "var(--sun)" : "var(--brand)" }} />)}</span>} />
      <div className="relative min-h-0 flex-1 overflow-clip">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={step} className="absolute inset-0 flex flex-col" initial={{ opacity: 0, x: 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -70 }} transition={spring}>
            {step === "idea" && <Idea onNext={next} />}
            {step === "place" && <Place id={id} onNext={next} />}
            {step === "invite" && <Invite id={id} onNext={next} />}
            {step === "arrive" && <Arrive id={id} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const pos = (i: number, n: number, r = 122) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return { x: 150 + r * Math.cos(a), y: 150 + r * Math.sin(a) }; };

/** Everyone around the host. First they only know the host; then they know each other. */
function Web({ ids, joined, linked }: { ids: string[]; joined: number; linked: boolean }) {
  const at = (id: string) => pos(ids.indexOf(id), ids.length);
  const links = pairs(ids);
  return (
    <div className="relative h-[300px] w-[300px]" aria-hidden="true">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        {ids.map((id, i) => { const p = at(id); return <motion.line key={id} x1="150" y1="150" x2={p.x} y2={p.y} stroke="#fff" strokeWidth="1.5" initial={{ opacity: 0 }} animate={{ opacity: i < joined ? (linked ? 0.14 : 0.5) : 0 }} transition={{ duration: 0.5 }} />; })}
        {linked && links.map((l, i) => { const a = at(l.a), b = at(l.b); return <motion.line key={l.a + l.b} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffb627" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.9 }} transition={{ delay: 0.2 + i * 0.09, duration: 0.6 }} />; })}
      </svg>
      {ids.map((id, i) => { const p = at(id); return <motion.span key={id} className="absolute" style={{ left: p.x - 25, top: p.y - 25 }} initial={{ scale: 0 }} animate={{ scale: i < joined ? 1 : 0 }} transition={{ type: "spring", stiffness: 340, damping: 16 }}><Avatar id={id} size={50} /></motion.span>; })}
      <motion.span className="absolute left-[112px] top-[112px] rounded-full ring-4 ring-[var(--sun)]" animate={{ scale: linked ? 0.86 : 1 }} transition={spring}><Avatar id="me" size={76} /></motion.span>
    </div>
  );
}

function Idea({ onNext }: { onNext: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => { setOn(true); navigator.vibrate?.([8, 40, 14]); }, 2200); return () => window.clearTimeout(t); }, []);
  return (
    <div className="flex flex-1 flex-col text-white">
      <button type="button" aria-label="Show before and after" className="grid min-h-0 flex-1 place-items-center [@media(max-height:720px)]:scale-90" onClick={() => setOn(!on)}><Web ids={LOCAL} joined={LOCAL.length} linked={on} /></button>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="relative min-h-[132px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={String(on)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
              <h1 className="text-[33px] font-semibold leading-[1.04] tracking-[-0.03em]">{on ? "Now they know each other." : "They all know you."}</h1>
              <p className="mt-2.5 text-[16.5px] leading-snug text-white/85">{on ? "Keep your WhatsApp. Give your customers a reason to come back that isn't a discount: one another." : "On a broadcast list, every customer is alone with you."}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" className="btn btn-sun mt-4 w-full" onClick={onNext}>Bring mine in</button>
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hour = (h: number) => `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;

function Place({ id, onNext }: { id: string; onNext: () => void }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const [b, setB] = useState<Biz>(c.biz ?? { kind: "Café", opens: 9, closes: 21, wa: "", catalogue: "" });
  const set = (v: Partial<Biz>) => setB((x) => ({ ...x, ...v }));
  const wa = b.wa.replace(/\D/g, "");
  const waOk = wa === "" || /^[6-9]\d{9}$/.test(wa) || /^91[6-9]\d{9}$/.test(wa);
  const catOk = b.catalogue === "" || /^https:\/\/[^\s]+\.[^\s]+$/.test(b.catalogue);
  const ok = waOk && catOk && b.closes > b.opens;
  const pick = "field digits !w-auto flex-1 appearance-none text-center !text-[16px]";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll flex-1 px-6 pb-6 pt-2">
        <div className="flex items-center gap-4"><Glyph c={c} size={60} /><div><h1 className="text-[27px] font-semibold leading-tight tracking-[-0.02em]">{c.name}</h1><p className="text-[15px] text-[var(--soft)]">What customers see at the door</p></div></div>
        <p className="mb-2 mt-7 text-[15px] font-medium">You run a</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of business">{["Café", "Studio", "Gym", "Shop", "Salon", "Classes"].map((k) => <button key={k} type="button" role="radio" aria-checked={b.kind === k} onClick={() => set({ kind: k })} className="press min-h-[44px] rounded-full px-4 text-[15px] font-medium" style={{ background: b.kind === k ? "var(--sun)" : "var(--card)" }}>{k}</button>)}</div>
        <p className="mb-2 mt-6 text-[15px] font-medium">Open from</p>
        <div className="flex items-center gap-3">
          <select aria-label="Opens" className={pick} value={b.opens} onChange={(e) => set({ opens: Number(e.target.value) })}>{HOURS.map((h) => <option key={h} value={h}>{hour(h)}</option>)}</select>
          <span className="text-[15px] text-[var(--soft)]">to</span>
          <select aria-label="Closes" className={pick} value={b.closes} onChange={(e) => set({ closes: Number(e.target.value) })}>{HOURS.filter((h) => h > 0).map((h) => <option key={h} value={h}>{hour(h)}</option>)}</select>
        </div>
        {b.closes <= b.opens && <p className="mt-2 text-[14.5px] text-[var(--live)]">Closing has to come after opening.</p>}
        <p className="mb-2 mt-6 text-[15px] font-medium">WhatsApp Business number</p>
        <input className="field digits" inputMode="tel" aria-label="WhatsApp Business number" placeholder="Yours, to try it for real" value={b.wa} onChange={(e) => set({ wa: e.target.value })} />
        {!waOk && <p className="mt-2 text-[14.5px] text-[var(--live)]">That isn&apos;t a full Indian mobile number.</p>}
        <p className="mb-2 mt-6 text-[15px] font-medium">Catalogue link</p>
        <input className="field" inputMode="url" aria-label="Catalogue link" placeholder="https://" value={b.catalogue} onChange={(e) => set({ catalogue: e.target.value.trim() })} />
        {!catOk && <p className="mt-2 text-[14.5px] text-[var(--live)]">Use a full link that starts with https://</p>}
      </div>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-3"><button type="button" className="btn btn-main w-full" disabled={!ok} onClick={() => { act.biz(id, { ...b, wa: wa.length === 10 ? `91${wa}` : wa }); onNext(); }}>Write the invite</button></div>
    </div>
  );
}

const REASONS: { label: string; text: (n: string) => string }[] = [
  { label: "First pick", text: (n) => `You're a regular, so you hear first. Our supper club seats open to members of ${n} a day early.` },
  { label: "Meet the regulars", text: (n) => `You've probably sat next to your next good friend at ${n} and never said hello. We made a place to fix that.` },
  { label: "Short", text: (n) => `${n} has a place of its own now. Come in, we saved you a seat.` },
];

function Invite({ id, onNext }: { id: string; onNext: () => void }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const link = linkTo({ kind: "community", id });
  const [why, setWhy] = useState(0);
  const [text, setText] = useState(() => REASONS[0].text(c.name));
  const [poster, setPoster] = useState(false);
  const [sent, setSent] = useState(false);
  const full = `${text.trim()}\n\n${link}`;
  const copy = async (what: string, v: string) => { try { await navigator.clipboard.writeText(v); act.say(`${what} copied`); } catch { act.say("Couldn't copy here"); } };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll flex-1 px-6 pb-4 pt-2">
        <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.02em]">Why should they come?</h1>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">{REASONS.map((r, k) => <button key={r.label} type="button" role="radio" aria-checked={why === k} onClick={() => { setWhy(k); setText(r.text(c.name)); }} className="press min-h-[44px] rounded-full px-4 text-[15px] font-medium" style={{ background: why === k ? "var(--sun)" : "var(--card)" }}>{r.label}</button>)}</div>
        <motion.div layout className="mt-4 rounded-[24px] rounded-bl-[8px] bg-[var(--card)] p-4">
          <textarea aria-label="Invite message" rows={4} className="w-full resize-none bg-transparent text-[16.5px] leading-snug !outline-none" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-2 flex items-center gap-3 overflow-hidden rounded-[18px] p-3 text-white" style={{ background: `hsl(${c.hue} 46% 30%)` }}><Glyph c={c} size={46} /><span className="min-w-0"><span className="block truncate text-[15.5px] font-semibold">{c.name}</span><span className="block truncate text-[13.5px] text-white/80">{link.replace(/^https?:\/\//, "")}</span></span></div>
        </motion.div>
        <p className="mt-3 text-[14.5px] leading-snug text-[var(--soft)]">WhatsApp opens with this ready. Choose your broadcast list there and press send. We never see your contacts.</p>
        <h2 className="mb-2 mt-6 text-[16px] font-semibold">Everywhere else they find you</h2>
        <ul className="overflow-hidden rounded-[22px] bg-[var(--card)]">
          <Kit icon={<QrCode size={20} />} title="Counter card" sub="They scan it while they wait" onClick={() => setPoster(true)} />
          <Kit icon={<Copy size={20} />} title="Greeting message" sub="Copy, then paste in WhatsApp Business" onClick={() => copy("Greeting", `Hi! Thanks for writing to ${c.name}. We'll reply soon. Meanwhile, meet the other regulars: ${link}`)} />
          <Kit icon={<Copy size={20} />} title="Status" sub="Copy for today's status" onClick={() => copy("Status", `The regulars of ${c.name} have a place now. Come in: ${link}`)} />
        </ul>
      </div>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-3">
        {sent ? <button type="button" className="btn btn-sun w-full" onClick={onNext}>I&apos;ve sent it</button>
          : <a className="btn btn-main w-full" aria-disabled={!text.trim()} href={waLink(full)} target="_blank" rel="noreferrer" onClick={() => setSent(true)}>Open WhatsApp</a>}
        <button type="button" className="mt-1 min-h-[44px] w-full text-[14.5px] text-[var(--soft)]" onClick={onNext}>{sent ? "Show me what happens next" : "Skip, show me what happens next"}</button>
      </div>
      <AnimatePresence>
        {poster && (
          <motion.button type="button" aria-label="Close counter card" onClick={() => setPoster(false)} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center text-white" style={{ background: `hsl(${c.hue} 46% 26%)` }} initial={{ opacity: 0, rotate: -3, scale: 0.9 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={spring}>
            <Glyph c={c} size={72} />
            <span className="mt-5 text-[32px] font-semibold leading-[1.06] tracking-[-0.03em]">The person next to you is worth meeting.</span>
            <span className="mt-6 rounded-[26px] bg-white p-5"><QRCodeSVG value={link} size={178} fgColor="#1e1020" /></span>
            <span className="mt-5"><IdTiles digits={c.id} tone="dark" /></span>
            <span className="mt-3 text-[15px] text-white/80">{c.name}. Tap to close, or take a screenshot to print.</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kit({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return <li className="border-t border-[var(--line)] first:border-t-0"><button type="button" onClick={onClick} className="press flex min-h-[64px] w-full items-center gap-3.5 px-4 text-left"><span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span><span><span className="block text-[16px] font-semibold leading-tight">{title}</span><span className="text-[14px] text-[var(--soft)]">{sub}</span></span></button></li>;
}

/** They walk in one by one, and then the lines appear between them. */
function Arrive({ id }: { id: string }) {
  const { act } = useStore();
  const [n, setN] = useState(0);
  const [linked, setLinked] = useState(false);
  const all = LOCAL;
  const total = 38;
  const v = useMotionValue(0);
  const text = useTransform(v, (x) => Math.round(x).toString());
  useEffect(() => {
    const ticks = all.map((_, i) => window.setTimeout(() => { setN(i + 1); navigator.vibrate?.(6); }, 500 + i * 520));
    ticks.push(window.setTimeout(() => { setLinked(true); navigator.vibrate?.([14, 40, 20]); }, 1100 + all.length * 520));
    const a = animate(v, total, { duration: 0.4 + all.length * 0.52, delay: 0.4, ease: "easeOut" });
    return () => { ticks.forEach((t) => window.clearTimeout(t)); a.stop(); };
  }, [all, v]);
  const links = pairs(all);
  const l = links[0];
  return (
    <div className="flex flex-1 flex-col text-white">
      <div className="grid min-h-0 flex-1 place-items-center [@media(max-height:720px)]:scale-90"><Web ids={all} joined={n} linked={linked} /></div>
      <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="min-h-[138px]">
          <AnimatePresence mode="wait" initial={false}>
            {linked ? (
              <motion.div key="l" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.03em]">{links.length} good introductions, all at your place.</h1>
                {l && <p className="mt-2 text-[16.5px] leading-snug text-white/85">{firstOf(l.a)} and {firstOf(l.b)}: {l.why}.</p>}
              </motion.div>
            ) : (
              <motion.div key="n" exit={{ opacity: 0, y: -10 }}>
                <p className="digits text-[58px] font-medium leading-none"><motion.span>{text}</motion.span></p>
                <p className="mt-2 text-[17px] text-white/85">customers walked in from WhatsApp</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button type="button" className="btn btn-sun mt-3 w-full" disabled={!linked} onClick={() => act.moveIn(id, total, all)}><Check size={20} /> See who came</button>
        <p className="mt-2.5 text-center text-[13.5px] text-white/65">Simulated. Nothing was sent from here.</p>
      </div>
    </div>
  );
}
