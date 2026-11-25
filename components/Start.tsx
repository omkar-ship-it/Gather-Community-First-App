"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Check, Coffee, Dumbbell, Footprints, GraduationCap, Laptop, Sparkles, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import type { CKind } from "@/lib/data";
import { money, useStore } from "@/lib/store";
import { Avatar, Bar, GroupMark, IdTiles, spring } from "./ui";

/** Each kind starts with the groups it usually ends up with, so nobody faces an empty room. */
const KINDS: { k: CKind; icon: typeof Coffee; hue: number; eg: string; biz: boolean; groups: string[]; gets: string[]; price: number; per: "month" | "year" }[] = [
  { k: "Run club", icon: Footprints, hue: 150, eg: "Lake Road Runners", biz: false, groups: ["Routes", "First 10K", "Race weekends", "Coffee after"], gets: ["Coached long runs", "Race entries together"], price: 299, per: "month" },
  { k: "Professional", icon: Briefcase, hue: 318, eg: "Pune Product People", biz: false, groups: ["Hiring", "Asks and offers", "Monthly dinner", "New here"], gets: ["A dinner every month", "Introductions, made by a person"], price: 4999, per: "year" },
  { k: "Alumni", icon: GraduationCap, hue: 160, eg: "Class of 2014 and friends", biz: false, groups: ["By city", "Hiring and looking", "Mentors", "Reunion"], gets: ["The full directory", "Reunion seats first"], price: 999, per: "year" },
  { k: "Café", icon: Coffee, hue: 32, eg: "The Window Seat", biz: true, groups: ["Today's specials", "Window seat", "Tastings"], gets: ["First pick of tastings", "A free coffee a week"], price: 399, per: "month" },
  { k: "Restaurant", icon: UtensilsCrossed, hue: 42, eg: "Eleven Tables", biz: true, groups: ["Off-menu nights", "Cook with us", "Regulars"], gets: ["Off-menu nights first", "Your table, held"], price: 799, per: "month" },
  { k: "Gym", icon: Dumbbell, hue: 8, eg: "Northside Strength", biz: true, groups: ["6am squad", "Open floor", "Comeback club"], gets: ["Coached classes", "Every open-floor hour"], price: 1800, per: "month" },
  { k: "Work", icon: Laptop, hue: 250, eg: "Our team", biz: false, groups: ["Monday plan", "New people", "Trips"], gets: [], price: 0, per: "month" },
  { k: "Interest", icon: Sparkles, hue: 225, eg: "Saturday Birders", biz: false, groups: ["This week", "Beginners", "Show and tell"], gets: ["Members-only meets"], price: 199, per: "month" },
];

export default function StartCommunity() {
  const { act } = useStore();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<(typeof KINDS)[number] | null>(null);
  const [name, setName] = useState("");
  const [biz, setBiz] = useState(false);
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [per, setPer] = useState<"month" | "year">("month");
  const [ask, setAsk] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [own, setOwn] = useState("");
  const [made, setMade] = useState<string | null>(null);

  const choose = (k: (typeof KINDS)[number]) => { navigator.vibrate?.(8); setKind(k); setBiz(k.biz); setPaid(k.k === "Gym"); setPrice(String(k.price || "")); setPer(k.per); setAsk(k.k === "Work"); setGroups(k.groups.slice(0, 3)); setStep(1); };
  const ok = name.trim().length >= 3 && (!paid || Number(price) > 0);
  const add = () => { const v = own.trim(); if (v.length > 1 && !groups.some((g) => g.toLowerCase() === v.toLowerCase())) setGroups([...groups, v]); setOwn(""); };
  const open = () => { if (!kind) return; setMade(act.startCommunity({ kind: kind.k, name: name.trim(), biz, ask, groups, plan: paid ? { price: Number(price), per, gets: kind.gets.length ? kind.gets : ["Everything inside"] } : undefined })); navigator.vibrate?.([14, 40, 24]); setStep(3); };
  const hue = kind?.hue ?? 318;

  if (step === 3 && made && kind) return <Opened id={made} name={name.trim()} hue={hue} groups={groups} />;
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <Bar title="" right={<span className="flex gap-1.5 pr-5" role="img" aria-label={`Step ${step + 1} of 3`}>{[0, 1, 2].map((k) => <motion.span key={k} className="h-2 rounded-full bg-[var(--brand)]" animate={{ width: k === step ? 22 : 8, opacity: k <= step ? 1 : 0.25 }} />)}</span>} />
      <div className="relative min-h-0 flex-1 overflow-clip">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={step} className="absolute inset-0 flex flex-col" initial={{ opacity: 0, x: 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -70 }} transition={spring}>
            {step === 0 && (
              <div className="scroll flex-1 px-5 pb-8 pt-1">
                <h1 className="text-[30px] font-semibold leading-[1.06] tracking-[-0.025em]">Who are your people?</h1>
                <div className="mt-5 grid grid-cols-2 gap-2.5">{KINDS.map((k, i) => (
                  <motion.button key={k.k} type="button" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.035 }} onClick={() => choose(k)} className="press flex min-h-[116px] flex-col justify-between rounded-[24px] p-4 text-left text-white" style={{ background: `hsl(${k.hue} 46% 32%)` }}>
                    <k.icon size={28} /><span><span className="block text-[17px] font-semibold leading-tight">{k.k}</span><span className="text-[13.5px] text-white/80">{k.eg}</span></span>
                  </motion.button>
                ))}</div>
              </div>
            )}
            {step === 1 && kind && (
              <>
                <div className="scroll flex-1 px-6 pb-4 pt-1">
                  <h1 className="text-[30px] font-semibold leading-[1.06] tracking-[-0.025em]">Give it a name</h1>
                  <input autoFocus className="field mt-5 !text-[19px]" aria-label="Community name" placeholder={kind.eg} maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
                  <p className="mb-2 mt-6 text-[15px] font-medium">Who runs it?</p>
                  <Two a="Me" b="My business" on={biz} set={setBiz} />
                  <p className="mb-2 mt-6 text-[15px] font-medium">What does it cost?</p>
                  <Two a="Free" b="Paid membership" on={paid} set={setPaid} />
                  <AnimatePresence initial={false}>{paid && (
                    <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring}>
                      <div className="mt-2.5 flex gap-2.5"><label className="field flex flex-1 items-center gap-2"><span className="text-[var(--soft)]">₹</span><input className="digits w-full bg-transparent !outline-none" inputMode="numeric" aria-label="Price in rupees" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label><span className="flex-1"><Two a="Month" b="Year" on={per === "year"} set={(v) => setPer(v ? "year" : "month")} /></span></div>
                    </motion.div>
                  )}</AnimatePresence>
                  <p className="mb-2 mt-6 text-[15px] font-medium">Who can come in?</p>
                  <Two a="Anyone with the number" b="I say yes to each" on={ask} set={setAsk} />
                </div>
                <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-3"><button type="button" className="btn btn-main w-full" disabled={!ok} onClick={() => setStep(2)}>{ok ? "Choose its groups" : name.trim().length < 3 ? "Give it a name" : "Set a price"}</button></div>
              </>
            )}
            {step === 2 && kind && (
              <>
                <div className="scroll flex-1 px-6 pb-4 pt-1">
                  <h1 className="text-[30px] font-semibold leading-[1.06] tracking-[-0.025em]">What goes on inside?</h1>
                  <p className="mt-2 text-[15.5px] leading-snug text-[var(--soft)]">Each group gets its own feed, people and events. Announcements come with every community.</p>
                  <ul className="mt-5 grid gap-2">{[...new Set([...kind.groups, ...groups])].map((g) => { const on = groups.includes(g); return (
                    <li key={g}><button type="button" aria-pressed={on} onClick={() => setGroups(on ? groups.filter((x) => x !== g) : [...groups, g])} className="press flex min-h-[62px] w-full items-center gap-3.5 rounded-[20px] px-4 text-left" style={{ background: on ? "var(--card)" : "transparent", border: `2px solid ${on ? "transparent" : "var(--line)"}` }}><GroupMark g={{ name: g }} hue={kind.hue} size={40} quiet={!on} /><span className="min-w-0 flex-1 truncate text-[16.5px] font-medium">{g}</span><span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: on ? "var(--sun)" : "var(--sunk)" }}>{on && <Check size={16} />}</span></button></li>
                  ); })}</ul>
                  <form className="mt-2.5 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}><input className="field" aria-label="Another group" placeholder="Another group" maxLength={28} value={own} onChange={(e) => setOwn(e.target.value)} /><button type="submit" className="btn btn-quiet !px-5" disabled={own.trim().length < 2}>Add</button></form>
                </div>
                <div className="flex-none px-6 pb-[max(env(safe-area-inset-bottom),22px)] pt-3">{paid && <p className="mb-2 text-center text-[14.5px] text-[var(--soft)]">{money({ price: Number(price), per, gets: [] })}</p>}<button type="button" className="btn btn-main w-full" onClick={open}>Open the doors</button></div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Two({ a, b, on, set }: { a: string; b: string; on: boolean; set: (v: boolean) => void }) {
  return <div className="grid grid-cols-2 gap-1 rounded-[18px] bg-[var(--sunk)] p-1" role="radiogroup">{[a, b].map((l, i) => { const sel = on === Boolean(i); return <button key={l} type="button" role="radio" aria-checked={sel} onClick={() => set(Boolean(i))} className="press min-h-[46px] rounded-[14px] px-2 text-[15px] font-medium leading-tight" style={{ background: sel ? "var(--card)" : "transparent", boxShadow: sel ? "0 2px 8px -3px rgba(30,16,32,0.3)" : undefined }}>{l}</button>; })}</div>;
}

/** The doors open: its groups step out, and its number is spoken for the first time. */
function Opened({ id, name, hue, groups }: { id: string; name: string; hue: number; groups: string[] }) {
  const { act } = useStore();
  return (
    <div className="relative flex h-full flex-col overflow-hidden text-white" style={{ background: `hsl(${hue} 46% 26%)` }}>
      <div className="relative grid flex-1 place-items-center">
        {[0.5, 0.9, 1.3].map((d) => <motion.span key={d} className="absolute h-36 w-36 rounded-full border-2 border-[var(--sun)]" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 3.4, opacity: [0, 0.8, 0] }} transition={{ delay: d, duration: 1.7 }} aria-hidden="true" />)}
        <div className="relative flex flex-col items-center px-6 text-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.4 }} className="rounded-full ring-4 ring-[var(--sun)]"><Avatar id="me" size={84} /></motion.span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, ...spring }} className="mt-6 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em]">{name} is open.</motion.h1>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-4"><IdTiles digits={id} tone="dark" /></motion.span>
          <span className="mt-6 flex flex-wrap justify-center gap-2">{groups.map((g, i) => <motion.span key={g} initial={{ scale: 0, y: -30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 340, damping: 16, delay: 1.2 + i * 0.1 }} className="rounded-full bg-white/15 px-4 py-2 text-[15px] font-medium">{g}</motion.span>)}</span>
        </div>
      </div>
      <motion.div className="relative flex-none px-6 pb-[max(env(safe-area-inset-bottom),24px)]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, ...spring }}>
        <button type="button" className="btn btn-sun w-full" onClick={() => act.push({ t: "movein", id })}>Bring people in from WhatsApp</button>
        <button type="button" className="btn mt-2.5 w-full bg-white/12 text-white" onClick={() => act.opened(id)}>Look around first</button>
      </motion.div>
    </div>
  );
}
