"use client";

import { motion } from "framer-motion";
import { CalendarPlus, Check, Hash, IndianRupee, PenLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { pretty } from "@/lib/ids";
import { linkTo, useStore, when, type Sheet } from "@/lib/store";
import { Avatar, Glyph, IdTiles, SheetShell, firstOf, nameOf, spring } from "./ui";

const LABEL: Record<Sheet["t"], string> = { plus: "What would you like to do?", post: "New post", host: "Host an event", pay: "Get a seat", split: "Split a bill", comments: "Comments", key: "Pass the key" };

export default function Sheets() {
  const { s, act } = useStore();
  const sh = s.sheet;
  return (
    <SheetShell open={Boolean(sh)} onClose={() => act.sheet(null)} label={sh ? LABEL[sh.t] : ""}>
      {sh?.t === "plus" && <PlusSheet />}
      {sh?.t === "post" && <PostSheet initial={sh.communityId} />}
      {sh?.t === "host" && <HostSheet initial={sh.communityId} />}
      {sh?.t === "pay" && <PaySheet id={sh.eventId} />}
      {sh?.t === "split" && <SplitSheet />}
      {sh?.t === "comments" && <CommentsSheet id={sh.postId} />}
      {sh?.t === "key" && <KeySheet kind={sh.kind} id={sh.id} />}
    </SheetShell>
  );
}

function PlusSheet() {
  const { s, act } = useStore();
  const any = s.communities.some((c) => c.joined);
  const rows = [
    { icon: Hash, label: "Enter an ID", sub: "A person, a community or a room", go: () => act.dial(true), ok: true },
    { icon: PenLine, label: "Write a post", sub: "To one of your communities", go: () => act.sheet({ t: "post" }), ok: any },
    { icon: CalendarPlus, label: "Host an event", sub: "Comes with its own room and PIN", go: () => act.sheet({ t: "host" }), ok: any },
    { icon: IndianRupee, label: "Split a bill", sub: "With people you've kept", go: () => act.sheet({ t: "split" }), ok: s.saved.length > 0 },
  ];
  return (
    <ul>
      {rows.map((r) => (
        <li key={r.label}>
          <button type="button" disabled={!r.ok} onClick={r.go} className="press flex min-h-[66px] w-full items-center gap-4 text-left disabled:opacity-40">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><r.icon size={22} /></span>
            <span><span className="block text-[17px] font-semibold leading-tight">{r.label}</span><span className="text-[14.5px] text-[var(--soft)]">{r.ok ? r.sub : r.icon === IndianRupee ? "Keep someone first" : "Join a community first"}</span></span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Where({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { s } = useStore();
  return (
    <div className="scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="Community">
      {s.communities.filter((c) => c.joined).map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={value === c.id} onClick={() => onChange(c.id)} className="press flex min-h-[46px] flex-none items-center gap-2 rounded-full pl-1.5 pr-4 text-[14.5px] font-medium" style={{ background: value === c.id ? "var(--brand-soft)" : "var(--sunk)", color: value === c.id ? "var(--brand)" : undefined }}><Glyph c={c} size={34} />{c.name}</button>
      ))}
    </div>
  );
}

function PostSheet({ initial }: { initial?: string }) {
  const { s, act } = useStore();
  const [where, setWhere] = useState(initial ?? s.communities.find((c) => c.joined)?.id ?? "");
  const [text, setText] = useState("");
  return (
    <>
      <Where value={where} onChange={setWhere} />
      <textarea autoFocus rows={5} className="field mt-3 resize-none" aria-label="Your post" placeholder="An ask, an offer, some news" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" className="btn btn-main mt-3 w-full" disabled={text.trim().length < 3 || !where} onClick={() => { act.post(where, text.trim()); act.say("Posted"); }}>Post</button>
    </>
  );
}

function HostSheet({ initial }: { initial?: string }) {
  const { s, act } = useStore();
  const [where, setWhere] = useState(initial ?? s.communities.find((c) => c.joined)?.id ?? "");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [price, setPrice] = useState("");
  const [day, setDay] = useState(24);
  const days = [[24, "Tomorrow"], [72, "In 3 days"], [168, "Next week"]] as const;
  return (
    <>
      <Where value={where} onChange={setWhere} />
      <input autoFocus className="field mt-3" aria-label="What's happening?" placeholder="What's happening?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="field mt-2.5" aria-label="Where?" placeholder="Where?" value={place} onChange={(e) => setPlace(e.target.value)} />
      <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="When">{days.map(([h, l]) => <button key={h} type="button" role="radio" aria-checked={day === h} onClick={() => setDay(h)} className="press min-h-[48px] rounded-2xl text-[15px] font-medium" style={{ background: day === h ? "var(--brand)" : "var(--sunk)", color: day === h ? "#fff" : undefined }}>{l}</button>)}</div>
      <input className="field mt-2.5" inputMode="numeric" aria-label="Price in rupees" placeholder="Price in ₹, or leave empty for free" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 5))} />
      <p className="mt-3 text-[14.5px] leading-snug text-[var(--soft)]">You&apos;ll get a six-digit room PIN. The room closes itself two hours after it starts.</p>
      <button type="button" className="btn btn-main mt-3 w-full" disabled={title.trim().length < 3 || place.trim().length < 2 || !where} onClick={() => { act.host(where, title.trim(), place.trim(), Number(price) || 0, day); act.say("Your event is up"); }}>Create event</button>
    </>
  );
}

function PaySheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const e = s.events.find((x) => x.id === id)!;
  const [how, setHow] = useState<"UPI" | "Card">("UPI");
  const [state, setState] = useState<"ready" | "paying" | "done">("ready");
  const pay = () => { setState("paying"); window.setTimeout(() => { setState("done"); navigator.vibrate?.([15, 40, 25]); act.ticket(id); }, 1300); };
  if (state === "done")
    return (
      <div className="pb-2 text-center">
        <motion.div initial={{ y: -60, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: -1.5, opacity: 1 }} transition={spring} className="mx-auto max-w-[19rem] rounded-[24px] bg-[var(--brand)] p-6 text-white">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--sun)] text-[var(--ink)]"><Check size={24} /></span>
          <p className="mt-3 text-[20px] font-semibold leading-tight">{e.title}</p>
          <p className="mt-1 text-[15px] text-white/80">{when(e.startsAt)}</p>
          <div className="my-4 border-t-2 border-dashed border-white/30" />
          <p className="text-[14px] text-white/75">Your way into the room</p>
          <span className="mt-2 block"><IdTiles digits={e.room} tone="dark" /></span>
        </motion.div>
        <button type="button" className="btn btn-main mt-5 w-full" onClick={() => act.sheet({ t: "key", kind: "room", id: e.room })}>Bring a friend</button>
        <button type="button" className="mt-1 min-h-[44px] w-full text-[15px] text-[var(--soft)]" onClick={() => act.sheet(null)}>Done</button>
      </div>
    );
  return (
    <>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[17px] font-semibold leading-snug">{e.title}</p><p className="mt-0.5 text-[15px] text-[var(--soft)]">{when(e.startsAt)}</p></div><p className="digits flex-none text-[24px] font-medium">₹{e.price.toLocaleString("en-IN")}</p></div>
      <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pay with">{(["UPI", "Card"] as const).map((h) => <button key={h} type="button" role="radio" aria-checked={how === h} onClick={() => setHow(h)} className="press min-h-[56px] rounded-2xl text-[16px] font-semibold" style={{ border: `2px solid ${how === h ? "var(--brand)" : "var(--line)"}`, color: how === h ? "var(--brand)" : undefined }}>{h}</button>)}</div>
      <button type="button" className="btn btn-main mt-4 w-full" disabled={state === "paying"} onClick={pay}>{state === "paying" ? "Paying" : `Pay ₹${e.price.toLocaleString("en-IN")}`}</button>
      <p className="mt-3 text-center text-[14px] text-[var(--soft)]">Prototype: no money moves.</p>
    </>
  );
}

function SplitSheet() {
  const { s, act } = useStore();
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState<string[]>([]);
  const each = Math.ceil((Number(amount) || 0) / (who.length + 1));
  return (
    <>
      <label className="flex items-center justify-center gap-1 py-3 text-[44px] font-semibold"><span className="text-[var(--soft)]">₹</span><input autoFocus aria-label="Amount" inputMode="numeric" className="digits w-[4.2ch] bg-transparent outline-none" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))} /></label>
      <div className="mt-2 flex flex-wrap justify-center gap-4">{s.saved.map((id) => { const on = who.includes(id); return <button key={id} type="button" aria-pressed={on} className="press flex w-[66px] flex-col items-center gap-1" onClick={() => setWho(on ? who.filter((x) => x !== id) : [...who, id])}><span className="rounded-full p-[3px]" style={{ background: on ? "var(--sun)" : "transparent" }}><Avatar id={id} size={54} /></span><span className="text-[13.5px]">{firstOf(id)}</span></button>; })}</div>
      <button type="button" className="btn btn-main mt-5 w-full" disabled={!who.length || !Number(amount)} onClick={() => { who.forEach((id) => act.addMsg(`d:${id}`, "me", `Your share is ₹${each}. Pay whenever.`)); act.sheet(null); act.say(`Asked ${who.map(firstOf).join(", ")} for ₹${each} each`); }}>{who.length && Number(amount) ? `Ask for ₹${each} each` : "Pick an amount and people"}</button>
    </>
  );
}

function CommentsSheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const p = s.posts.find((x) => x.id === id)!;
  const [text, setText] = useState("");
  return (
    <>
      {p.comments.length === 0 && <p className="py-4 text-[15px] text-[var(--soft)]">Be the first to reply.</p>}
      {p.comments.map((c, i) => <div key={i} className="flex gap-3 py-2"><Avatar id={c.by} size={38} /><div><p className="text-[14.5px] font-semibold">{c.by === "me" ? s.me?.name : nameOf(c.by)}</p><p className="text-[16px] leading-snug">{c.text}</p></div></div>)}
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { act.comment(id, text.trim()); setText(""); } }}><input className="field" aria-label="Add a comment" placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} /><button type="submit" className="btn btn-main !px-5" disabled={!text.trim()}>Send</button></form>
    </>
  );
}

/** Pass the key: an invitation that opens the exact door you came through. */
function KeySheet({ kind, id }: { kind: string; id: string }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id);
  const g = s.groups.find((x) => x.id === id);
  const e = s.events.find((x) => x.room === id);
  const name = c?.name ?? g?.name ?? e?.title.split(":")[0] ?? "";
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="rounded-[28px] bg-[var(--bg)] p-6">
        <p className="text-[18px] font-semibold">{name}</p>
        <span className="mx-auto mt-4 grid w-fit rounded-[20px] bg-white p-4"><QRCodeSVG value={linkTo(id)} size={130} fgColor="#1e1020" /></span>
        <span className="mt-5 block"><IdTiles digits={id} size="lg" /></span>
      </motion.div>
      <p className="mx-auto mt-4 max-w-[18rem] text-[15px] leading-snug text-[var(--soft)]">{kind === "room" ? "Works until the event ends, then it's gone." : "Whoever gets this walks straight in, not to a sign-up page."}</p>
      <button type="button" className="btn btn-main mt-4 w-full" onClick={async () => {
        const text = `${s.me?.name.split(" ")[0]} passed you the key to ${name} on Gather: ${pretty(id)} ${linkTo(id)}`;
        try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); act.say("Invitation copied"); } } catch { /* they changed their mind */ }
      }}>Send the key</button>
    </div>
  );
}
