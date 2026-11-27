"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, MapPin, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { Event, Post } from "@/lib/data";
import { pretty } from "@/lib/ids";
import { feeOn, inr } from "@/lib/money";
import { isHost, linkTo, pinOpen, useNow, useStore, when } from "@/lib/store";
import { IdTiles, spring } from "./ui";

/**
 * Money, done once and done the same way everywhere: a seat, a mug, a tee.
 * Price, the fee, the total, how you pay, one button. Then the thing itself:
 * a pass for an event, a numbered receipt for a drop.
 */

const WAYS = ["GPay", "PhonePe", "Paytm", "Card"] as const;
type Way = (typeof WAYS)[number];

function Checkout({ title, sub, price, onPaid, children }: { title: string; sub: string; price: number; onPaid: () => void; children: React.ReactNode }) {
  const [way, setWay] = useState<Way>("GPay");
  const [state, setState] = useState<"ready" | "paying" | "done">("ready");
  const fee = feeOn(price);
  const pay = () => { setState("paying"); window.setTimeout(() => { setState("done"); navigator.vibrate?.([15, 40, 25]); onPaid(); }, 1200); };
  if (state === "done") return <>{children}</>;
  return (
    <>
      <p className="text-[17px] font-semibold leading-snug">{title}</p>
      <p className="mt-0.5 text-[15px] text-[var(--soft)]">{sub}</p>
      <dl className="mt-5 grid gap-2 border-y border-[var(--line)] py-4 text-[15.5px]">
        <div className="flex justify-between"><dt className="text-[var(--soft)]">Price</dt><dd className="num">{inr(price)}</dd></div>
        <div className="flex justify-between"><dt className="text-[var(--soft)]">Convenience fee</dt><dd className="num">{inr(fee)}</dd></div>
        <div className="mt-1 flex justify-between text-[17px] font-semibold"><dt>Total</dt><dd className="num">{inr(price + fee)}</dd></div>
      </dl>
      <p className="mb-2 mt-4 text-[14px] text-[var(--soft)]">Pay with</p>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Pay with">
        {WAYS.map((w) => <button key={w} type="button" role="radio" aria-checked={way === w} onClick={() => setWay(w)} className="press min-h-[52px] rounded-[14px] text-[14.5px] font-semibold transition-colors" style={{ border: `1.5px solid ${way === w ? "var(--brand)" : "var(--line)"}`, color: way === w ? "var(--brand)" : "var(--ink)", background: way === w ? "var(--brand-soft)" : "transparent" }}>{w}</button>)}
      </div>
      <button type="button" className="btn btn-main mt-5 w-full" disabled={state === "paying"} onClick={pay}>
        {state === "paying" ? <><Loader2 size={18} className="animate-spin" />Paying</> : `Pay ${inr(price + fee)}`}
      </button>
      <p className="mt-3 text-center text-[13.5px] text-[var(--soft)]">Prototype: no money moves.</p>
    </>
  );
}

/** A ticket that drops in from above. */
function Stub({ children, tone = "var(--brand)" }: { children: React.ReactNode; tone?: string }) {
  return <motion.div initial={{ y: -60, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: -1.5, opacity: 1 }} transition={spring} className="mx-auto max-w-[19rem] rounded-[24px] p-6 text-center text-white" style={{ background: tone }}>{children}</motion.div>;
}

export function PaySheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  const e = s.events.find((x) => x.id === id)!;
  const live = e.startsAt <= now && !e.dissolved;
  return (
    <Checkout title={e.title} sub={`${when(e.startsAt)}, ${e.place}`} price={e.price} onPaid={() => act.ticket(id)}>
      <div className="pb-2">
        <Stub>
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--sun)] text-[var(--ink)]"><Check size={24} /></span>
          <p className="mt-3 text-[20px] font-semibold leading-tight">You&apos;re in</p>
          <p className="mt-1 text-[15px] text-white/80">{e.title}</p>
          <div className="my-4 border-t-2 border-dashed border-white/30" />
          {pinOpen(e, now) ? <div className="flex justify-center"><IdTiles digits={e.room} tone="dark" /></div> : <p className="text-[15px] leading-snug text-white/80">Your pass is ready. The room&apos;s PIN opens an hour before.</p>}
        </Stub>
        <button type="button" className="btn btn-main mt-5 w-full" onClick={() => (live ? act.push({ t: "room", id }) : act.sheet({ t: "pass", eventId: id }))}>{live ? "Walk in" : "See your pass"}</button>
        <button type="button" className="mt-1 min-h-[44px] w-full text-[15px] text-[var(--soft)]" onClick={() => act.sheet({ t: "key", kind: "room", id })}>Bring a friend</button>
      </div>
    </Checkout>
  );
}

export function BuySheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const p = s.posts.find((x) => x.id === id)!;
  const d = p.drop!;
  const c = s.communities.find((x) => x.id === p.communityId)!;
  const [no] = useState(d.of - d.left + 1);
  return (
    <Checkout title={d.name} sub={`${c.name}, ${d.left} left`} price={d.price} onPaid={() => act.buy(id)}>
      <div className="pb-2">
        <Stub tone={`hsl(${c.hue} 46% 30%)`}>
          <Package size={30} className="mx-auto text-[var(--sun)]" />
          <p className="mt-3 text-[20px] font-semibold leading-tight">It&apos;s yours</p>
          <p className="mt-1 text-[15px] text-white/80">{d.name}</p>
          <div className="my-4 border-t-2 border-dashed border-white/30" />
          <p className="num text-[28px] font-semibold leading-none text-[var(--sun)]">No. {no} <span className="text-[16px] text-white/70">of {d.of}</span></p>
          <p className="mt-2 text-[15px] text-white/80">{d.collect}</p>
        </Stub>
        <button type="button" className="btn btn-main mt-5 w-full" onClick={() => act.sheet(null)}>Done</button>
      </div>
    </Checkout>
  );
}

/** The ticket you show at the door: a code to scan and a pin on the map. */
export function PassSheet({ id }: { id: string }) {
  const { s } = useStore();
  const now = useNow(20_000);
  const e = s.events.find((x) => x.id === id)!;
  return (
    <div className="pb-2 text-center">
      <div className="mx-auto max-w-[19rem] overflow-hidden rounded-[24px] border border-[var(--line)]">
        <div className="bg-[var(--ink)] px-5 py-4 text-left text-white">
          <p className="text-[17px] font-semibold leading-tight">{e.title}</p>
          <p className="mt-0.5 text-[14px] text-white/70">{when(e.startsAt)}</p>
        </div>
        <div className="px-5 pb-5 pt-4">
          <span className="mx-auto grid w-fit rounded-[16px] bg-white p-2"><QRCodeSVG value={`${linkTo({ kind: "room", id: e.id })}?pass=${s.me?.id ?? ""}`} size={156} fgColor="#1e1020" /></span>
          <p className="mt-3 text-[16px] font-semibold">{s.me?.name}</p>
          <p className="digits text-[14px] text-[var(--soft)]">{s.me ? pretty(s.me.id) : ""}</p>
          {pinOpen(e, now) && <div className="mt-3 flex justify-center"><IdTiles digits={e.room} /></div>}
        </div>
      </div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place)}`} target="_blank" rel="noreferrer" className="press mx-auto mt-4 flex min-h-[48px] max-w-[19rem] items-center gap-3 rounded-[16px] bg-[var(--sunk)] px-4 text-left">
        <MapPin size={19} className="flex-none text-[var(--live)]" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{e.place}</span>
        <span className="text-[14px] text-[var(--brand)]">Map</span>
      </a>
      <p className="mt-3 text-[13.5px] text-[var(--soft)]">Show this at the door. The host scans it and you&apos;re in.</p>
    </div>
  );
}

/** A host puts a few of something on sale. */
export function DropSheet({ communityId }: { communityId: string }) {
  const { act } = useStore();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [of, setOf] = useState("20");
  const [line, setLine] = useState("");
  const ok = name.trim().length > 2 && Number(price) > 0 && Number(of) > 0;
  return (
    <div className="grid gap-2.5">
      <input className="field" placeholder="What is it? e.g. Club tee" aria-label="What is it?" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2.5">
        <label className="field flex items-center gap-1"><span className="text-[var(--soft)]">₹</span><input className="num w-full bg-transparent outline-none" inputMode="numeric" placeholder="Price" aria-label="Price" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
        <label className="field flex items-center gap-2"><input className="num w-full bg-transparent outline-none" inputMode="numeric" aria-label="How many" value={of} onChange={(e) => setOf(e.target.value.replace(/\D/g, "").slice(0, 4))} /><span className="flex-none text-[var(--soft)]">made</span></label>
      </div>
      <input className="field" placeholder="One line about it (optional)" aria-label="About it" value={line} onChange={(e) => setLine(e.target.value)} />
      <p className="px-1 text-[13.5px] text-[var(--soft)]">Members buy in two taps and collect it from you. A small batch sells better than a big one.</p>
      <button type="button" className="btn btn-main mt-1 w-full" disabled={!ok} onClick={() => { act.makeDrop(communityId, line.trim() || `Only ${of} of these. When they're gone, they're gone.`, { name: name.trim(), price: Number(price), left: Number(of), of: Number(of), collect: "Collect from us" }); }}>Drop it</button>
    </div>
  );
}

/** The drop, inside a post: what it is, how many are left, and the button. */
export function DropCard({ p }: { p: Post }) {
  const { s, act } = useStore();
  const d = p.drop!;
  const mine = s.bought.includes(p.id);
  const host = isHost(s, p.communityId);
  const gone = d.left === 0;
  return (
    <div className="mt-3 rounded-[18px] border border-[var(--line)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0"><span className="block text-[16px] font-semibold leading-tight">{d.name}</span><span className="mt-0.5 block text-[14px] text-[var(--soft)]">{d.collect}</span></span>
        <span className="num flex-none text-[18px] font-semibold">{inr(d.price)}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--sunk)]"><motion.div className="h-full rounded-full" style={{ background: d.left / d.of < 0.25 ? "var(--live)" : "var(--sun)" }} initial={false} animate={{ width: `${(d.left / d.of) * 100}%` }} transition={spring} /></div>
        <span className="num flex-none text-[13.5px]" style={{ color: d.left / d.of < 0.25 ? "var(--live)" : "var(--soft)" }}>{gone ? "Sold out" : `${d.left} of ${d.of} left`}</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {mine ? (
          <motion.p key="mine" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-[var(--sun)] text-[15px] font-semibold"><Check size={17} />Yours</motion.p>
        ) : host ? (
          <p key="host" className="mt-3 text-center text-[14px] text-[var(--soft)]">{d.of - d.left} sold, {inr((d.of - d.left) * d.price)} so far</p>
        ) : (
          <motion.button key="buy" type="button" disabled={gone} onClick={() => act.sheet({ t: "buy", postId: p.id })} className="btn btn-main mt-3 w-full">{gone ? "Sold out" : `Buy, ${inr(d.price)}`}</motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** People going whom you already know: kept, or in another community of yours. */
export function known(s: ReturnType<typeof useStore>["s"], e: Event) {
  return e.going.filter((m) => m !== "me" && (s.saved.includes(m) || s.communities.some((c) => c.joined && c.id !== e.communityId && c.members.includes(m))));
}
