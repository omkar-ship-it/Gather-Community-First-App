"use client";

import { motion } from "framer-motion";
import { Bell, BellOff, CalendarPlus, Check, Hash, IndianRupee, LogOut, Megaphone, PenLine, Share2, Store as Shop, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { GroupGlance } from "./Community";
import { BuySheet, DropSheet, PassSheet, PaySheet } from "./Commerce";
import type { Plan } from "@/lib/data";
import { pretty, type Kind } from "@/lib/ids";
import { byFit, count, day as dayOf, isHost, money, left, linkTo, maskEmail, maskMobile, openNow, pinOpen, waLink, what, useNow, useStore, when, type Sheet } from "@/lib/store";
import { Avatar, Glyph, IdTiles, SheetShell, firstOf, nameOf, spring, Faces, GroupMark } from "./ui";

const LABEL: Record<Sheet["t"], string> = { plus: "What would you like to do?", post: "New post", host: "Host an event", pay: "Get a seat", split: "Split a bill", comments: "Replies", key: "Pass the key", link: "", peek: "Look inside", group: "About this group", newgroup: "Start a group", ask: "Ask on WhatsApp", join: "Membership", about: "About", switch: "Switch group", buy: "Buy", pass: "Your pass", drop: "Drop something" };

export default function Sheets() {
  const { s, act } = useStore();
  const sh = s.sheet;
  return (
    <SheetShell open={Boolean(sh)} onClose={() => act.sheet(null)} label={sh?.t === "link" ? (sh.what === "mobile" ? "Change your mobile" : "Change your email") : sh ? LABEL[sh.t] : ""}>
      {sh?.t === "plus" && <PlusSheet />}
      {sh?.t === "post" && <PostSheet initial={sh.communityId} groupId={sh.groupId} announce={sh.announce} draft={sh.draft} />}
      {sh?.t === "host" && <HostSheet initial={sh.communityId} groupId={sh.groupId} />}
      {sh?.t === "pay" && <PaySheet id={sh.eventId} />}
      {sh?.t === "buy" && <BuySheet id={sh.postId} />}
      {sh?.t === "pass" && <PassSheet id={sh.eventId} />}
      {sh?.t === "drop" && <DropSheet communityId={sh.communityId} />}
      {sh?.t === "split" && <SplitSheet />}
      {sh?.t === "comments" && <CommentsSheet id={sh.postId} />}
      {sh?.t === "key" && <KeySheet kind={sh.kind} id={sh.id} />}
      {sh?.t === "peek" && <PeekSheet kind={sh.kind} id={sh.id} />}
      {sh?.t === "group" && <GroupSheet id={sh.id} />}
      {sh?.t === "newgroup" && <NewGroupSheet communityId={sh.communityId} />}
      {sh?.t === "join" && <JoinSheet key={sh.id} kind={sh.kind} id={sh.id} />}
      {sh?.t === "about" && <AboutSheet id={sh.id} />}
      {sh?.t === "switch" && <SwitchSheet id={sh.id} />}
      {sh?.t === "ask" && <AskSheet id={sh.communityId} about={sh.about} />}
      {sh?.t === "link" && <LinkSheet what={sh.what} />}
    </SheetShell>
  );
}

function PlusSheet() {
  const { s, act } = useStore();
  const mine = s.communities.find((c) => c.joined && c.biz && c.hosts.includes("me"));
  const any = s.communities.some((c) => c.joined);
  const rows = [
    { icon: Users, label: "Start a community", sub: "Run club, café, alumni, gym, anything", go: () => act.push({ t: "start" }), ok: true },
    { icon: Hash, label: "Dial a number", sub: "A person, a community, a group or a PIN", go: () => act.dial(true), ok: true },
    { icon: PenLine, label: "Write a post", sub: "To a community or one of its groups", go: () => act.sheet({ t: "post" }), ok: any },
    { icon: CalendarPlus, label: "Host an event", sub: "Comes with its own room and PIN", go: () => act.sheet({ t: "host" }), ok: any },
    { icon: IndianRupee, label: "Split a bill", sub: "With people you've kept", go: () => act.sheet({ t: "split" }), ok: s.saved.length > 0 },
    ...(mine ? [{ icon: Shop, label: "Bring in my WhatsApp customers", sub: mine.name, go: () => act.push({ t: "movein", id: mine.id }), ok: true }] : []),
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

/** Who will read it comes before what it says: everyone, one group, or (for hosts) an announcement. */
function PostSheet({ initial, groupId, announce = false, draft = "" }: { initial?: string; groupId?: string; announce?: boolean; draft?: string }) {
  const { s, act } = useStore();
  const [where, setWhere] = useState(initial ?? s.communities.find((c) => c.joined)?.id ?? "");
  const [to, setTo] = useState(announce ? "announce" : (groupId ?? "all"));
  const [text, setText] = useState(draft);
  const c = s.communities.find((x) => x.id === where);
  const groups = s.groups.filter((g) => g.communityId === where && g.joined);
  const g = groups.find((x) => x.id === to);
  const choices = [{ id: "all", label: "Everyone", icon: Users }, ...(isHost(s, where) ? [{ id: "announce", label: "Announcement", icon: Megaphone }] : []), ...groups.map((x) => ({ id: x.id, label: x.name, icon: Hash }))];
  const reach = g ? g.size : (c?.size ?? 0);
  return (
    <>
      {!initial && <Where value={where} onChange={(id) => { setWhere(id); setTo("all"); }} />}
      <div className={`scroll -mx-5 flex gap-2 overflow-x-auto px-5 ${initial ? "" : "mt-2.5"}`} role="radiogroup" aria-label="Who sees it">
        {choices.map((x) => { const on = to === x.id; return <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setTo(x.id)} className="press flex min-h-[44px] flex-none items-center gap-2 rounded-full px-4 text-[14.5px] font-medium" style={{ background: on ? "var(--sun)" : "var(--sunk)" }}><x.icon size={16} />{x.label}</button>; })}
      </div>
      <textarea autoFocus rows={5} className="field mt-3 resize-none" aria-label="Your post" placeholder={to === "announce" ? "What does everyone need to know?" : g ? `Something for ${g.name}` : "An ask, an offer, some news"} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="mt-2 text-[14.5px] text-[var(--soft)]">{reach === 1 ? "Just you in here so far" : to === "announce" ? `Goes to all ${count(reach)} in ${c?.name}` : `${count(reach)} people in ${g ? g.name : c?.name} can see this`}</p>
      <button type="button" className="btn btn-main mt-3 w-full" disabled={text.trim().length < 3 || !c} onClick={() => act.post(where, text.trim(), to === "announce" ? { announce: true } : g ? { groupId: g.id } : {})}>{to === "announce" ? "Announce" : "Post"}</button>
    </>
  );
}

/** Inside, before you're in. */
function PeekSheet({ kind, id }: { kind: "community" | "group"; id: string }) {
  const { s, act } = useStore();
  const now = useNow(20_000);
  if (kind === "group") {
    const g = s.groups.find((x) => x.id === id)!;
    return <><GroupGlance g={g} />{g.plan && <PlanBox plan={g.plan} />}<button type="button" className="btn btn-main mt-5 w-full" disabled={s.askedGroups.includes(id)} onClick={() => act.joinGroup(id, !g.ask && !g.plan)}>{s.askedGroups.includes(id) ? "Asked. Someone will let you in" : g.plan ? `Join, ${money(g.plan)}` : g.ask ? "Ask to join" : `Join ${g.name}`}</button></>;
  }
  const c = s.communities.find((x) => x.id === id)!;
  const groups = s.groups.filter((g) => g.communityId === id);
  const e = s.events.filter((x) => x.communityId === id && !x.dissolved).sort((a, b) => a.startsAt - b.startsAt)[0];
  const faces = byFit(s, c.members);
  return (
    <>
      <div className="flex items-center gap-4"><Glyph c={c} size={62} /><div className="min-w-0"><p className="text-[21px] font-semibold leading-tight tracking-[-0.01em]">{c.name}</p><p className="text-[14.5px] text-[var(--soft)]">{what(c)}, {count(c.size)} people</p></div></div>
      <p className="mt-4 text-[16px] leading-snug">{c.about || c.blurb}</p>
      <div className="mt-4 flex items-center gap-3"><Faces ids={faces.slice(0, 4)} size={36} /><p className="text-[15px] leading-snug">{faces.slice(0, 2).map(firstOf).join(" and ")} {faces.length === 1 ? "is" : "are"} in here</p></div>
      <ul className="mt-4 overflow-hidden rounded-[20px] bg-[var(--sunk)]">
        {groups.slice(0, 4).map((g) => <li key={g.id} className="flex items-center gap-3 border-t border-white px-4 py-3 first:border-t-0"><GroupMark g={g} hue={c.hue} size={34} /><span className="min-w-0 flex-1 truncate text-[15.5px] font-medium">{g.name}</span><span className="text-[14px] text-[var(--soft)]">{count(g.size)}</span></li>)}
      </ul>
      {e && <p className="mt-3 text-[15px] leading-snug text-[var(--soft)]">{e.startsAt <= now ? "On now" : when(e.startsAt)}: {e.title}</p>}
      {c.plan && <PlanBox plan={c.plan} />}
      <button type="button" className="btn btn-main mt-5 w-full" onClick={() => act.enter({ kind: "community", id })}>{c.plan ? `Join, ${money(c.plan)}` : c.open ? `Join ${c.name}` : "Ask to join"}</button>
    </>
  );
}

function PlanBox({ plan }: { plan: Plan }) {
  return <div className="mt-4 rounded-[20px] bg-[var(--sun)]/25 p-4"><p className="text-[17px] font-semibold">{money(plan)}</p><ul className="mt-2 grid gap-1.5">{plan.gets.map((x) => <li key={x} className="flex gap-2.5 text-[15px] leading-snug"><Check size={18} className="mt-0.5 flex-none text-[var(--brand)]" />{x}</li>)}</ul></div>;
}

/** Pay to belong. What you get is on the same screen as what it costs, and so is how to leave. */
function JoinSheet({ kind, id }: { kind: "community" | "group"; id: string }) {
  const { s, act } = useStore();
  const g = s.groups.find((x) => x.id === id);
  const c = s.communities.find((x) => x.id === (g?.communityId ?? id))!;
  const plan = (kind === "group" ? g?.plan : c.plan)!;
  const [how, setHow] = useState<"UPI" | "Card">("UPI");
  const [busy, setBusy] = useState(false);
  const go = () => { setBusy(true); window.setTimeout(() => { navigator.vibrate?.([15, 40, 25]); act.pay(kind, id); if (kind === "group") act.joinGroup(id, true); else act.enter({ kind: "community", id }); }, 1300); };
  return (
    <>
      <div className="flex items-center gap-4">{g ? <GroupMark g={g} hue={c.hue} size={56} /> : <Glyph c={c} size={56} />}<div className="min-w-0"><p className="text-[20px] font-semibold leading-tight">{g?.name ?? c.name}</p><p className="text-[14.5px] text-[var(--soft)]">{g ? c.name : what(c)}</p></div></div>
      <PlanBox plan={plan} />
      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pay with">{(["UPI", "Card"] as const).map((h) => <button key={h} type="button" role="radio" aria-checked={how === h} onClick={() => setHow(h)} className="press min-h-[54px] rounded-2xl text-[16px] font-semibold" style={{ border: `2px solid ${how === h ? "var(--brand)" : "var(--line)"}`, color: how === h ? "var(--brand)" : undefined }}>{h}</button>)}</div>
      <button type="button" className="btn btn-main mt-3 w-full" disabled={busy} onClick={go}>{busy ? "Paying" : `Pay ₹${plan.price.toLocaleString("en-IN")} and join`}</button>
      <p className="mt-3 text-center text-[14px] leading-snug text-[var(--soft)]">Renews every {plan.per}. Stop any time, in one tap. Prototype: no money moves.</p>
    </>
  );
}

function AboutSheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === id)!;
  const m = s.paid[id];
  const host = isHost(s, id);
  const row = "press flex min-h-[56px] w-full items-center gap-4 text-left text-[16px] font-medium";
  return (
    <>
      <div className="flex items-center gap-4"><Glyph c={c} size={60} /><div className="min-w-0"><p className="text-[21px] font-semibold leading-tight">{c.name}</p><p className="text-[14.5px] text-[var(--soft)]">{what(c)}, {count(c.size)} {c.size === 1 ? "person" : "people"}</p></div></div>
      {(c.about || c.blurb) && <p className="mt-4 text-[16px] leading-snug">{c.about || c.blurb}</p>}
      {m && c.plan && (
        <div className="mt-4 rounded-[22px] bg-[var(--sun)] p-4"><p className="flex items-baseline justify-between"><span className="text-[17px] font-semibold">{m.ends ? "Ends" : "Renews"} {dayOf(m.until)}</span><span className="digits text-[16px]">{count(m.no)}</span></p><p className="mt-0.5 text-[14.5px]">{money(c.plan)}</p><button type="button" className="press mt-3 min-h-[44px] rounded-full bg-white/70 px-4 text-[14.5px] font-semibold" onClick={() => act.endPlan(id)}>{m.ends ? "Keep renewing" : "Stop renewing"}</button></div>
      )}
      {!m && c.plan && <PlanBox plan={c.plan} />}
      <ul className="mt-3">
        {c.hosts.filter((h) => h !== "me").slice(0, 2).map((h) => <li key={h}><button type="button" className={row} onClick={() => act.push({ t: "person", id: h })}><Avatar id={h} size={38} /><span><span className="block leading-tight">{nameOf(h)}</span><span className="text-[14px] font-normal text-[var(--soft)]">Host</span></span></button></li>)}
        <li><button type="button" className={row} onClick={() => act.sheet({ t: "key", kind: "community", id })}><Share2 size={21} className="text-[var(--brand)]" />Pass the key<span className="ml-auto"><IdTiles digits={c.id} size="sm" /></span></button></li>
        {host && <li><button type="button" className={row} onClick={() => act.push({ t: "movein", id })}><Shop size={21} className="text-[var(--brand)]" />Bring people in from WhatsApp</button></li>}
        {c.biz && !host && <li><button type="button" className={row} onClick={() => act.sheet({ t: "ask", communityId: id })}><Megaphone size={21} className="text-[var(--brand)]" />Ask on WhatsApp</button></li>}
      </ul>
    </>
  );
}

/** From one group to the next without going back first. */
function SwitchSheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const at = s.groups.find((x) => x.id === id)!;
  const c = s.communities.find((x) => x.id === at.communityId)!;
  return (
    <>
      <button type="button" onClick={() => act.go({ t: "community", id: c.id })} className="press flex min-h-[60px] w-full items-center gap-3.5 text-left"><Glyph c={c} size={42} /><span><span className="block text-[16.5px] font-semibold leading-tight">{c.name}</span><span className="text-[14px] text-[var(--soft)]">All groups</span></span></button>
      <ul className="border-t border-[var(--line)] pt-1">{s.groups.filter((g) => g.communityId === c.id && g.joined).map((g) => <li key={g.id}><button type="button" aria-current={g.id === id ? "true" : undefined} onClick={() => act.go({ t: "group", id: g.id })} className="press flex min-h-[60px] w-full items-center gap-3.5 text-left"><GroupMark g={g} hue={c.hue} size={42} /><span className="min-w-0 flex-1"><span className="block truncate text-[16.5px]" style={{ fontWeight: g.id === id ? 600 : 500 }}>{g.name}</span><span className="text-[14px] text-[var(--soft)]">{count(g.size)} {g.size === 1 ? "person" : "people"}</span></span>{g.id === id ? <Check size={20} className="text-[var(--brand)]" /> : (s.unread[`f:${g.id}`] ?? 0) > 0 && <span className="h-3 w-3 rounded-full bg-[var(--sun)]" />}</button></li>)}</ul>
    </>
  );
}

/** A customer asks; the business answers where it already works. The question is written for them. */
function AskSheet({ id, about }: { id: string; about?: string }) {
  const { s, act } = useStore();
  const now = useNow(60_000);
  const c = s.communities.find((x) => x.id === id)!;
  const b = c.biz!;
  const asks = about ? [`Is there still room at ${about}?`, `I'm coming to ${about}. Anything I should know?`] : ["Do you have a table this evening?", "What's good today?", "Could you keep something aside for me?"];
  const [text, setText] = useState(asks[0]);
  return (
    <>
      <div className="flex items-center gap-3"><Glyph c={c} size={46} /><div><p className="text-[17px] font-semibold leading-tight">{c.name}</p><p className="text-[14.5px] text-[var(--soft)]">{b.kind}. {openNow(b, now)}</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2">{asks.map((a) => <button key={a} type="button" aria-pressed={text === a} onClick={() => setText(a)} className="press min-h-[44px] rounded-[18px] px-4 py-2 text-left text-[14.5px] font-medium" style={{ background: text === a ? "var(--sun)" : "var(--sunk)" }}>{a}</button>)}</div>
      <textarea rows={3} className="field mt-3 resize-none" aria-label="Your question" value={text} onChange={(e) => setText(e.target.value)} />
      <p className="mt-2 text-[14.5px] leading-snug text-[var(--soft)]">They see your mobile only once you press send in WhatsApp.</p>
      {b.wa ? <a href={waLink(`Hi ${c.name}! ${text}`, b.wa)} target="_blank" rel="noreferrer" className="btn btn-main mt-4 w-full" onClick={() => act.sheet(null)}>Open WhatsApp</a>
        : <button type="button" className="btn btn-main mt-4 w-full" onClick={() => { act.sheet(null); act.say("No number added yet, so nothing was sent"); }}>Open WhatsApp</button>}
    </>
  );
}

function GroupSheet({ id }: { id: string }) {
  const { s, act } = useStore();
  const g = s.groups.find((x) => x.id === id)!;
  const c = s.communities.find((x) => x.id === g.communityId)!;
  const row = "press flex min-h-[58px] w-full items-center gap-4 text-left text-[16.5px] font-medium";
  return (
    <>
<p className="flex items-center gap-2 text-[14.5px] text-[var(--soft)]"><Glyph c={c} size={24} /> Part of {c.name}</p>
      <div className="mt-4 flex items-center gap-4"><GroupMark g={g} hue={c.hue} size={58} /><div className="min-w-0"><p className="text-[21px] font-semibold leading-tight">{g.name}</p><p className="text-[14.5px] text-[var(--soft)]">{g.topic || "No topic yet"}</p></div></div>
      <span className="mt-4 block"><IdTiles digits={g.id} size="sm" /></span>
      {g.plan && s.paid[id] && <div className="mt-4 rounded-[22px] bg-[var(--sun)] p-4"><p className="text-[17px] font-semibold">{s.paid[id].ends ? "Ends" : "Renews"} {dayOf(s.paid[id].until)}</p><p className="mt-0.5 text-[14.5px]">{money(g.plan)}</p><button type="button" className="press mt-3 min-h-[44px] rounded-full bg-white/70 px-4 text-[14.5px] font-semibold" onClick={() => act.endPlan(id)}>{s.paid[id].ends ? "Keep renewing" : "Stop renewing"}</button></div>}
      <ul className="mt-2">
        <li><button type="button" className={row} onClick={() => { act.sheet(null); act.spot(id, "people"); }}><Users size={21} className="text-[var(--brand)]" />See {count(g.size)} {g.size === 1 ? "person" : "people"}</button></li>
        <li><button type="button" className={row} onClick={() => act.sheet({ t: "key", kind: "group", id })}><Share2 size={21} className="text-[var(--brand)]" />Pass the key</button></li>
        <li><button type="button" className={row} aria-pressed={Boolean(g.muted)} onClick={() => act.mute(id)}>{g.muted ? <Bell size={21} className="text-[var(--brand)]" /> : <BellOff size={21} className="text-[var(--brand)]" />}{g.muted ? "Unmute" : "Mute"}</button></li>
        <li><button type="button" className={`${row} text-[var(--live)]`} onClick={() => { act.leaveGroup(id); act.say(`You left ${g.name}`); }}><LogOut size={21} />Leave group</button></li>
      </ul>
    </>
  );
}

function NewGroupSheet({ communityId }: { communityId: string }) {
  const { s, act } = useStore();
  const c = s.communities.find((x) => x.id === communityId)!;
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [who, setWho] = useState<string[]>([]);
  return (
    <>
      <p className="text-[15px] text-[var(--soft)]">Inside {c.name}. Everyone in it can find it.</p>
      <input autoFocus className="field mt-3" aria-label="Group name" placeholder="Group name" maxLength={28} value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field mt-2.5" aria-label="What it's for" placeholder="What it's for" maxLength={60} value={topic} onChange={(e) => setTopic(e.target.value)} />
      <div className="scroll -mx-5 mt-4 flex gap-4 overflow-x-auto px-5">{byFit(s, c.members).slice(0, 8).map((id) => { const on = who.includes(id); return <button key={id} type="button" aria-pressed={on} className="press flex w-[64px] flex-none flex-col items-center gap-1" onClick={() => setWho(on ? who.filter((x) => x !== id) : [...who, id])}><span className="rounded-full p-[3px]" style={{ background: on ? "var(--sun)" : "transparent" }}><Avatar id={id} size={52} /></span><span className="text-[13.5px]">{firstOf(id)}</span></button>; })}</div>
      <button type="button" className="btn btn-main mt-5 w-full" disabled={name.trim().length < 2} onClick={() => act.makeGroup(communityId, name.trim(), topic.trim(), who)}>{who.length ? `Start with ${who.slice(0, 2).map(firstOf).join(" and ")}${who.length > 2 ? ` and ${who.length - 2} more` : ""}` : "Start the group"}</button>
    </>
  );
}

function HostSheet({ initial, groupId }: { initial?: string; groupId?: string }) {
  const { s, act } = useStore();
  const [where, setWhere] = useState(initial ?? s.communities.find((c) => c.joined)?.id ?? "");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [price, setPrice] = useState("");
  const [day, setDay] = useState(24);
  const [to, setTo] = useState(groupId ?? "all");
  const [weekly, setWeekly] = useState(false);
  const groups = s.groups.filter((g) => g.communityId === where && g.joined);
  const weekday = (h: number) => new Date(new Date().getTime() + h * 3_600_000).toLocaleDateString("en-IN", { weekday: "long" });
  const days = [[24, "Tomorrow"], [72, "In 3 days"], [168, "Next week"]] as const;
  return (
    <>
      {!initial && <Where value={where} onChange={(id) => { setWhere(id); setTo("all"); }} />}
      <div className={`scroll -mx-5 flex gap-2 overflow-x-auto px-5 ${initial ? "" : "mt-2.5"}`} role="radiogroup" aria-label="Who it's for">{[["all", "Everyone"], ...groups.map((g) => [g.id, g.name])].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={to === v} onClick={() => setTo(v)} className="press min-h-[44px] flex-none rounded-full px-4 text-[14.5px] font-medium" style={{ background: to === v ? "var(--sun)" : "var(--sunk)" }}>{l}</button>)}</div>
      <input autoFocus className="field mt-3" aria-label="What's happening?" placeholder="What's happening?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="field mt-2.5" aria-label="Where?" placeholder="Where?" value={place} onChange={(e) => setPlace(e.target.value)} />
      <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="When">{days.map(([h, l]) => <button key={h} type="button" role="radio" aria-checked={day === h} onClick={() => setDay(h)} className="press min-h-[48px] rounded-2xl text-[15px] font-medium" style={{ background: day === h ? "var(--brand)" : "var(--sunk)", color: day === h ? "#fff" : undefined }}>{l}</button>)}</div>
      <input className="field mt-2.5" inputMode="numeric" aria-label="Price in rupees" placeholder="Price in ₹, or leave empty for free" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 5))} />
      <button type="button" role="switch" aria-checked={weekly} onClick={() => setWeekly(!weekly)} className="press mt-2.5 flex min-h-[50px] w-full items-center justify-between rounded-2xl bg-[var(--sunk)] px-4 text-[15.5px] font-medium">{weekly ? `Every ${weekday(day)}` : "Repeat every week"}<span className="flex h-7 w-12 items-center rounded-full p-1" style={{ background: weekly ? "var(--brand)" : "#cfc3cb", justifyContent: weekly ? "flex-end" : "flex-start" }}><motion.span layout transition={spring} className="h-5 w-5 rounded-full bg-white" /></span></button>
      <p className="mt-3 text-[14.5px] leading-snug text-[var(--soft)]">It gets a six-digit PIN an hour before. The room closes itself two hours after it starts.</p>
      <button type="button" className="btn btn-main mt-3 w-full" disabled={title.trim().length < 3 || place.trim().length < 2 || !where} onClick={() => { act.host(where, title.trim(), place.trim(), Number(price) || 0, day, to === "all" ? undefined : to, weekly ? `Every ${weekday(day)}` : undefined); act.say("Your event is up"); }}>Create event</button>
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
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { act.comment(id, text.trim()); setText(""); } }}><input className="field" aria-label="Write a reply" placeholder="Write a reply" value={text} onChange={(e) => setText(e.target.value)} /><button type="submit" className="btn btn-main !px-5" disabled={!text.trim()}>Send</button></form>
    </>
  );
}

/**
 * Pass the key. The link and QR always work. A six-digit PIN is for saying
 * out loud: an event has one while it's on, a community or group opens one
 * for an hour.
 */
function KeySheet({ kind, id }: { kind: Kind; id: string }) {
  const { s, act } = useStore();
  const now = useNow();
  const c = s.communities.find((x) => x.id === id);
  const g = s.groups.find((x) => x.id === id);
  const e = s.events.find((x) => x.id === id);
  const name = c?.name ?? g?.name ?? e?.title.split(":")[0] ?? "";
  const to = { kind, id };
  const door = Object.entries(s.doors).find(([, d]) => d.to.id === id && d.until > now);
  const pin = e ? (pinOpen(e, now) ? e.room : null) : (door?.[0] ?? null);
  const until = e ? e.endsAt : door?.[1].until;
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="rounded-[28px] bg-[var(--bg)] p-5">
        <p className="text-[18px] font-semibold">{name}</p>
        <span className="mx-auto mt-3 grid w-fit rounded-[20px] bg-white p-3.5"><QRCodeSVG value={linkTo(to)} size={118} fgColor="#1e1020" /></span>
        {!e && <span className="mt-4 block"><IdTiles digits={id} /></span>}
        {pin ? (
          <motion.div key={pin} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-4 border-t border-[var(--line)] pt-4">
            <span className="block"><IdTiles digits={pin} size="lg" /></span>
            <p className="mt-2.5 text-[14px] text-[var(--soft)]">Say it out loud. Closes in <span className="digits">{left((until ?? now) - now)}</span></p>
          </motion.div>
        ) : e ? (
          <p className="mt-4 text-[14.5px] text-[var(--soft)]">The six-digit PIN opens an hour before.</p>
        ) : (
          <button type="button" className="btn btn-quiet mt-4 w-full !bg-white" onClick={() => act.openDoor(to)}>Open a six-digit PIN for an hour</button>
        )}
      </motion.div>
      <button type="button" className="btn btn-main mt-4 w-full" onClick={async () => {
        const text = `${s.me?.name.split(" ")[0]} passed you the key to ${name} on Gather: ${linkTo(to)}`;
        try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); act.say("Invitation copied"); } } catch { /* they changed their mind */ }
      }}>Send the key</button>
      <p className="mx-auto mt-3 max-w-[18rem] text-[14.5px] leading-snug text-[var(--soft)]">Whoever gets this sees {e ? "the event" : "who's inside"} before they sign up.</p>
    </div>
  );
}

/** Replace the mobile or email. The other one vouches for you, and the number doesn't move. */
function LinkSheet({ what }: { what: "mobile" | "email" }) {
  const { s, act } = useStore();
  const me = s.me!;
  const [v, setV] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const ok = what === "mobile" ? /^\d{10}$/.test(v.replace(/\D/g, "")) : /.+@.+\..+/.test(v);
  const other = what === "mobile" ? maskEmail(me.email) : maskMobile(me.mobile);
  return (
    <>
      <p className="text-[15.5px] leading-snug text-[var(--soft)]">{sent ? `We sent four digits to ${other}, to be sure it's you. Any four will do here.` : `Now ${what === "mobile" ? maskMobile(me.mobile) : maskEmail(me.email)}. Your number stays ${pretty(me.id)}.`}</p>
      {sent
        ? <input autoFocus className="field digits mt-4 text-center !text-[24px] tracking-[0.4em]" inputMode="numeric" aria-label="Verification code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        : <input autoFocus className="field mt-4" inputMode={what === "mobile" ? "numeric" : "email"} aria-label={what === "mobile" ? "New mobile" : "New email"} placeholder={what === "mobile" ? "New mobile" : "New email"} value={v} onChange={(e) => setV(e.target.value)} />}
      <button type="button" className="btn btn-main mt-3 w-full" disabled={sent ? code.length < 4 : !ok} onClick={() => { if (!sent) return setSent(true); act.relink(what, v.trim()); act.say(`Changed. Still ${pretty(me.id)}`); }}>{sent ? "Confirm" : "Continue"}</button>
    </>
  );
}
