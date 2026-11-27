"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronRight, DoorOpen, HeartHandshake, KeyRound, Megaphone, Package, PartyPopper, ScanLine, Share2, Sparkles, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import type { Community } from "@/lib/data";
import { rupees, standing } from "@/lib/host";
import { count, isHost, person, useNow, useStore, when } from "@/lib/store";
import { Avatar, Bar, Faces, Glyph, firstOf, spring } from "./ui";

type S = ReturnType<typeof useStore>["s"];
const tone = (c: Community) => `hsl(${c.hue} 46% 28%)`;
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
const and = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const nextOf = (s: S, cid: string) => s.events.filter((e) => e.communityId === cid && !e.dissolved && e.endsAt > Date.now() && !s.called.includes(e.id)).sort((a, b) => a.startsAt - b.startsAt)[0];

/** Who they already know inside: anyone they share another community with. */
function knows(s: S, c: Community, pid: string) {
  const near = new Set(s.communities.filter((o) => o.id !== c.id && o.members.includes(pid)).flatMap((o) => o.members));
  return c.members.filter((m) => m !== pid && near.has(m));
}

/** Regulars who haven't said yes yet: the people worth a personal note. */
function toInvite(s: S, cid: string) {
  const c = s.communities.find((v) => v.id === cid)!;
  const d = s.desk[cid];
  const e = nextOf(s, cid);
  if (!d || !e) return [];
  const quiet = d.drift.map((v) => v.id);
  return c.members.filter((m) => m !== "me" && !e.going.includes(m) && !quiet.includes(m) && !d.invited.includes(m) && (d.came[m] ?? 0) >= 2).sort((a, b) => (d.came[b] ?? 0) - (d.came[a] ?? 0)).slice(0, 3);
}

/** Everything on the desk that wants the host, in one line. */
export function todo(s: S, cid: string) {
  const d = s.desk[cid];
  if (!d) return { n: 0, line: "" };
  const parts = [
    d.door.length && `${d.door.length} at the door`,
    d.fresh.length && `${d.fresh.length} to welcome`,
    toInvite(s, cid).length && `${toInvite(s, cid).length} to invite`,
    d.drift.length && `${d.drift.length} gone quiet`,
    d.key && !d.keyed && "1 key to give",
  ].filter(Boolean) as string[];
  return { n: d.door.length + d.fresh.length + d.drift.length + (toInvite(s, cid).length ? 1 : 0) + (d.key && !d.keyed ? 1 : 0), line: parts.join(" · ") };
}

/** The card that opens the desk: on the community, and on Home. */
export function DeskCard({ c, compact = false }: { c: Community; compact?: boolean }) {
  const { s, act } = useStore();
  const t = todo(s, c.id);
  if (compact && !t.n) return null;
  return (
    <button type="button" onClick={() => act.push({ t: "desk", id: c.id })} className="press mb-3 flex w-full items-center gap-3.5 rounded-[22px] bg-[var(--ink)] p-4 text-left text-white">
      {compact ? <Glyph c={c} size={44} /> : <span className="grid h-11 w-11 flex-none place-items-center rounded-[15px] bg-[var(--sun)] text-[var(--ink)]"><HeartHandshake size={22} /></span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16.5px] font-semibold leading-tight">{compact ? c.name : "Your desk"}</span>
        <span className="block truncate text-[14px] text-white/75">{t.n ? t.line : "All clear. Nothing needs you."}</span>
      </span>
      {t.n > 0 && <span className="num grid h-7 min-w-7 flex-none place-items-center rounded-full bg-[var(--sun)] px-2 text-[14px] font-semibold text-[var(--ink)]">{t.n}</span>}
      <ChevronRight size={20} className="flex-none text-white/60" />
    </button>
  );
}

function Rise({ to, format = (n: number) => count(n) }: { to: number; format?: (n: number) => string }) {
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => format(Math.round(n)));
  useEffect(() => { const a = animate(v, to, { duration: 1.1, ease: [0.22, 1, 0.36, 1] }); return () => a.stop(); }, [to, v]);
  return <motion.span className="num">{text}</motion.span>;
}

function Section({ title, n, children }: { title: string; n?: number; children: React.ReactNode }) {
  return (
    <motion.section layout transition={spring} className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 px-1 text-[16px] font-semibold">{title}{n ? <span className="num rounded-full bg-[var(--sun)] px-2 text-[13px]">{n}</span> : null}</h2>
      {children}
    </motion.section>
  );
}

// ------------------------------------------------------------ the desk
/** A host's week, as five jobs, each one tap. When they're done, it says so. */
export function DeskScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const now = useNow(30_000);
  const c = s.communities.find((v) => v.id === id)!;
  const d = s.desk[id];
  const [gone, setGone] = useState<Record<string, "in" | "out">>({});
  if (!d || !isHost(s, id)) return null;
  const e = nextOf(s, id);
  const invite = toInvite(s, id);
  const fresh = d.fresh.map((m) => person(m)).filter((p) => p !== null);
  const clear = todo(s, id).n === 0;
  const empty = c.members.length === 0;
  const welcomeText = `Say hi to ${and(fresh.map((p) => p.name.split(" ")[0]))}, new this week. ${fresh.map((p) => `${p.name.split(" ")[0]}: ${p.bio.split(". ")[0].replace(/\.$/, "")}.`).join(" ")}`;
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="flex-none text-white" style={{ background: tone(c) }}>
        <Bar dark title="Your desk" sub={c.name} right={<button type="button" aria-label="Pass the key" className="press mr-2 grid h-11 w-11 place-items-center" onClick={() => act.sheet({ t: "key", kind: "community", id })}><Share2 size={20} /></button>} />
        {!empty && (
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-1">
            {[
              [d.week.joined, "joined", (n: number) => `+${n}`],
              [d.week.came, "came out", (n: number) => count(n)],
              [d.week.earned, d.week.earned ? "came in" : "free to join", (n: number) => (n ? rupees(n) : "₹0")],
            ].map(([n, label, f]) => (
              <div key={label as string} className="rounded-[18px] bg-white/12 px-3 py-3">
                <p className="text-[22px] font-semibold leading-none tracking-[-0.02em]"><Rise to={n as number} format={f as (n: number) => string} /></p>
                <p className="mt-1.5 text-[13px] text-white/75">{label as string}</p>
              </div>
            ))}
            <p className="col-span-3 px-1 text-[13px] text-white/70">Last week. That was you.</p>
          </div>
        )}
      </div>

      <div className="scroll flex-1 px-4 pb-16">
        {empty && (
          <div className="mt-6 rounded-[24px] bg-[var(--card)] p-5 text-center">
            <DoorOpen size={34} className="mx-auto text-[var(--brand)]" />
            <p className="mt-3 text-[19px] font-semibold leading-tight">Your doors are open. Nobody&apos;s knocked yet.</p>
            <p className="mt-1.5 text-[15px] text-[var(--soft)]">The first ten come from you. Send your number to the people who already turn up.</p>
            <div className="mt-4 grid gap-2">
              <button type="button" className="btn btn-main" onClick={() => act.sheet({ t: "key", kind: "community", id })}><Share2 size={18} />Pass the key</button>
              <button type="button" className="btn btn-quiet" onClick={() => act.push({ t: "movein", id })}>Bring people in from WhatsApp</button>
              {!e && <button type="button" className="btn btn-quiet" onClick={() => act.sheet({ t: "host", communityId: id })}>Plan the first meet-up</button>}
            </div>
          </div>
        )}

        {/* ---------------------------------------------- at the door */}
        {d.door.length > 0 && (
          <Section title="At the door" n={d.door.length}>
            <p className="-mt-1 mb-2 px-1 text-[14px] text-[var(--soft)]">You ask everyone: “{d.question}”</p>
            <AnimatePresence initial={false}>
              {d.door.map((k) => {
                const p = person(k.id)!;
                const kn = knows(s, c, k.id);
                return (
                  <motion.article key={k.id} layout exit={{ opacity: 0, x: gone[k.id] === "in" ? 240 : -240, rotate: gone[k.id] === "in" ? 6 : -6, transition: { duration: 0.32 } }} transition={spring} className="mb-2.5 rounded-[22px] bg-[var(--card)] p-4">
                    <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => act.push({ t: "person", id: k.id })}>
                      <Avatar id={k.id} size={46} />
                      <span className="min-w-0 flex-1"><span className="block text-[16.5px] font-semibold leading-tight">{p.name}</span><span className="block truncate text-[14px] text-[var(--soft)]">{p.headline}</span></span>
                      <span className="flex-none text-[13px] text-[var(--soft)]">{k.hoursAgo}h</span>
                    </button>
                    <p className="mt-3 rounded-[16px] bg-[var(--sunk)] px-3.5 py-2.5 text-[15.5px] leading-snug">“{k.why}”</p>
                    {kn.length > 0 && <p className="mt-2.5 flex items-center gap-2 text-[14px] font-medium text-[var(--brand)]"><Faces ids={kn.slice(0, 3)} size={22} />Knows {kn.length > 2 ? `${kn.slice(0, 2).map(firstOf).join(", ")} and ${kn.length - 2} more` : and(kn.map(firstOf))}</p>}
                    <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
                      <button type="button" className="btn btn-quiet" onClick={() => { setGone((g) => ({ ...g, [k.id]: "out" })); act.notNow(id, k.id); }}>Not now</button>
                      <button type="button" className="btn btn-main" onClick={() => { navigator.vibrate?.(8); setGone((g) => ({ ...g, [k.id]: "in" })); act.letIn(id, k.id); }}><Check size={18} />Let {p.name.split(" ")[0]} in</button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </Section>
        )}

        {/* ---------------------------------------------- new this week */}
        {fresh.length > 0 && (
          <Section title="New this week" n={fresh.length}>
            <div className="rounded-[22px] bg-[var(--card)] p-4">
              <div className="flex items-center gap-3"><Faces ids={d.fresh} size={36} /><p className="min-w-0 flex-1 text-[15.5px] leading-snug"><b className="font-semibold">{and(fresh.map((p) => p.name.split(" ")[0]))}</b> {fresh.length === 1 ? "hasn't" : "haven't"} been welcomed by name yet.</p></div>
              <p className="mt-3 rounded-[16px] bg-[var(--sunk)] px-3.5 py-2.5 text-[14.5px] leading-snug text-[var(--soft)]">{welcomeText}</p>
              <button type="button" className="btn btn-sun mt-3 w-full" onClick={() => act.welcome(id, welcomeText)}><Sparkles size={18} />Welcome them, from you</button>
            </div>
          </Section>
        )}

        {/* ---------------------------------------------- the next thing */}
        {e && (
          <Section title="Next up">
            <div className="rounded-[22px] bg-[var(--card)] p-4">
              <button type="button" className="w-full text-left" onClick={() => act.push({ t: "event", id: e.id })}>
                <span className="block text-[16.5px] font-semibold leading-tight">{e.title}</span>
                <span className="block text-[14px] text-[var(--soft)]">{e.repeats ?? when(e.startsAt)}{e.repeats ? `, next ${when(e.startsAt)}` : ""}</span>
              </button>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--sunk)]"><motion.div className="h-full rounded-full bg-[var(--sun)]" initial={false} animate={{ width: `${Math.min(100, Math.max(4, (e.going.length / e.seats) * 100))}%` }} transition={spring} /></div>
                <span className="num flex-none text-[14px] font-medium">{e.going.length} of {e.seats}</span>
              </div>
              {invite.length > 0 && (
                <div className="mt-3.5 flex items-center gap-3 rounded-[16px] bg-[var(--brand-soft)] p-3">
                  <Faces ids={invite} size={30} />
                  <p className="min-w-0 flex-1 text-[14.5px] leading-snug text-[var(--brand)]"><b className="font-semibold">{and(invite.map(firstOf))}</b> usually come{invite.length === 1 ? "s" : ""} and {invite.length === 1 ? "hasn't" : "haven't"} said yes.</p>
                </div>
              )}
              <div className="mt-3 grid gap-2">
                {invite.length > 0 && <button type="button" className="btn btn-main" onClick={() => { act.fill(e.id, invite); act.say(`Saved ${invite.length === 1 ? "a spot" : `${invite.length} spots`}, from you`); }}><Ticket size={18} />Save {invite.length === 1 ? `${firstOf(invite[0])} a spot` : "them a spot"}</button>}
                <button type="button" className="btn btn-quiet" onClick={() => act.push({ t: "door", id: e.id })}><DoorOpen size={18} />{e.startsAt - now < 3 * 3_600_000 ? "Open the door" : "Open the door when it starts"}</button>
              </div>
            </div>
          </Section>
        )}

        {/* ---------------------------------------------- gone quiet */}
        {d.drift.length > 0 && (
          <Section title="Gone quiet" n={d.drift.length}>
            {d.drift.map((q) => (
              <motion.div key={q.id} layout className="mb-2.5 flex items-center gap-3 rounded-[22px] bg-[var(--card)] p-4">
                <Avatar id={q.id} size={44} />
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold leading-tight">{person(q.id)?.name}</span><span className="block text-[14px] text-[var(--soft)]">Came {times(d.came[q.id] ?? 0)}, then nothing for {q.weeks} weeks</span></span>
                <button type="button" className="press min-h-[44px] flex-none rounded-full bg-[var(--brand)] px-4 text-[14.5px] font-semibold text-white" onClick={() => act.missYou(id, q.id)}>Miss you</button>
              </motion.div>
            ))}
          </Section>
        )}

        {/* ---------------------------------------------- a key to give */}
        {d.key && !d.keyed && (
          <Section title="Hand over a key">
            <div className="rounded-[22px] bg-[var(--card)] p-4">
              <div className="flex items-center gap-3"><Avatar id={d.key.id} size={46} /><p className="min-w-0 flex-1 text-[16px] leading-snug"><b className="font-semibold">{firstOf(d.key.id)}</b> could lead <b className="font-semibold">{s.groups.find((g) => g.id === d.key!.groupId)?.name}</b>.</p></div>
              <p className="mt-2.5 text-[14.5px] leading-snug text-[var(--soft)]">{d.key.why} Communities that last have more than one host.</p>
              <button type="button" className="btn btn-sun mt-3 w-full" onClick={() => act.giveKey(id)}><KeyRound size={18} />Give {firstOf(d.key.id)} the key</button>
            </div>
          </Section>
        )}

        {c.plan && (
          <Section title="Dues">
            <p className="rounded-[22px] bg-[var(--card)] p-4 text-[15px] leading-snug">Renewals go out three days early, from Gather, not from you. <span className="text-[var(--soft)]">You never chase a member for money.</span></p>
          </Section>
        )}

        {clear && !empty && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.2 }} className="mt-8 rounded-[24px] bg-[var(--sun)] p-6 text-center">
            <motion.span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-[var(--sun)]" initial={{ rotate: -30, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ ...spring, delay: 0.35 }}><Check size={30} strokeWidth={3} /></motion.span>
            <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.02em]">Desk clear.</p>
            <p className="mt-1 text-[15px]">{c.kind === "Run club" ? "Go run. They're in good hands." : c.biz ? "Back to the counter. They know where to find you." : "Nothing needs you. That's the point."}</p>
          </motion.div>
        )}

        <div className="mt-6 overflow-hidden rounded-[20px] bg-[var(--card)]">
          <button type="button" onClick={() => act.sheet({ t: "post", communityId: id, announce: true })} className="press flex w-full items-center gap-3 p-4 text-left"><Megaphone size={20} className="text-[var(--brand)]" /><span className="text-[15.5px] font-medium">Say something to everyone</span></button>
          <button type="button" onClick={() => act.sheet({ t: "drop", communityId: id })} className="press flex w-full items-center gap-3 border-t border-[var(--line)] p-4 text-left"><Package size={20} className="text-[var(--brand)]" /><span className="min-w-0 flex-1"><span className="block text-[15.5px] font-medium">Drop something</span><span className="block text-[13.5px] text-[var(--soft)]">A tee, a mug, a tasting. Members buy in two taps.</span></span></button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ the door
/** Event night. Tick people in as they arrive; first-timers glow, so the host greets them by name. */
export function DoorScreen({ id }: { id: string }) {
  const { s, act } = useStore();
  const e = s.events.find((v) => v.id === id)!;
  const c = s.communities.find((v) => v.id === e.communityId)!;
  const d = s.desk[c.id];
  const here = s.here[id] ?? [];
  const [missed, setMissed] = useState(true);
  const [scan, setScan] = useState(false);
  const list = e.going.filter((m) => m !== "me");
  const first = (m: string) => (d?.came[m] ?? 0) === 0;
  const order = [...list].sort((a, b) => Number(first(b)) - Number(first(a)));
  const no = list.length - here.length;
  return (
    <div className="flex h-full flex-col bg-[var(--ink)] text-white">
      <Bar dark title={e.title} sub={e.place} right={<button type="button" disabled={scan || here.length === list.length} onClick={() => {
        const next = order.find((m) => !here.includes(m));
        if (!next) return;
        setScan(true);
        window.setTimeout(() => { setScan(false); navigator.vibrate?.(12); act.arrived(id, next); act.say(`${firstOf(next)}'s pass, checked in`); }, 1100);
      }} className="press mr-3 flex min-h-[40px] items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-[14px] font-medium disabled:opacity-40"><ScanLine size={17} />Scan a pass</button>} />
      <AnimatePresence>
        {scan && (
          <motion.div className="absolute inset-0 z-20 grid place-items-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative h-56 w-56 rounded-[28px] border-2 border-white/70">
              <motion.span className="absolute inset-x-3 h-[2px] rounded-full bg-[var(--sun)] shadow-[0_0_16px_var(--sun)]" initial={{ top: 12 }} animate={{ top: 208 }} transition={{ duration: 0.9, ease: "easeInOut" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-none px-5 pb-4 text-center">
        <motion.p key={here.length} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="num text-[64px] font-semibold leading-none tracking-[-0.04em] text-[var(--sun)]">{here.length + 1}</motion.p>
        <p className="mt-1 text-[15px] text-white/75">here, counting you. {list.length - here.length > 0 ? `${list.length - here.length} still on the way.` : "Everyone came."}</p>
      </div>
      <div className="scroll flex-1 px-4 pb-6">
        {order.map((m) => {
          const on = here.includes(m);
          const st = standing(d?.came[m]);
          return (
            <motion.button key={m} layout type="button" aria-pressed={on} onClick={() => { navigator.vibrate?.(on ? 4 : 12); act.arrived(id, m); }} className="press mb-2 flex w-full items-center gap-3.5 rounded-[20px] p-3.5 text-left" style={{ background: on ? "rgba(255,182,39,0.16)" : "rgba(255,255,255,0.07)" }} transition={spring}>
              <Avatar id={m} size={46} />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold leading-tight">{person(m)?.name}</span>
                <span className="block text-[14px]" style={{ color: first(m) ? "var(--sun)" : "rgba(255,255,255,0.65)" }}>{first(m) ? `First time. Say hi to ${firstOf(m)} by name.` : `${st?.label}, came ${times(d?.came[m] ?? 0)}`}</span>
              </span>
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full border-2" style={{ borderColor: on ? "var(--sun)" : "rgba(255,255,255,0.25)", background: on ? "var(--sun)" : "transparent" }}>
                <AnimatePresence>{on && <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}><Check size={22} strokeWidth={3} className="text-[var(--ink)]" /></motion.span>}</AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex-none border-t border-white/10 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
        {no > 0 && here.length > 0 && (
          <button type="button" role="switch" aria-checked={missed} onClick={() => setMissed(!missed)} className="mb-3 flex w-full items-center justify-between gap-3 text-left text-[14.5px]">
            <span>Tell the {no} who didn&apos;t make it they were missed</span>
            <span className="relative h-7 w-12 flex-none rounded-full transition-colors" style={{ background: missed ? "var(--sun)" : "rgba(255,255,255,0.2)" }}><motion.span className="absolute top-1 h-5 w-5 rounded-full bg-white" animate={{ left: missed ? 24 : 4 }} transition={spring} /></span>
          </button>
        )}
        <button type="button" className="btn btn-sun w-full" disabled={here.length === 0} onClick={() => act.rollCall(id, missed && no > 0)}><PartyPopper size={19} />Close the door, post the roll call</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ a round number
/** 60 people. 100 people. Everything stops for a second. */
export function Milestone() {
  const { s, act } = useStore();
  const m = s.milestone;
  const c = m && s.communities.find((v) => v.id === m.id);
  return (
    <AnimatePresence>
      {m && c && (
        <motion.div key={m.n} className="absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden px-8 text-center text-white" style={{ background: tone(c) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {c.members.slice(0, 10).map((pid, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <motion.span key={pid} className="absolute rounded-full ring-[3px] ring-white/30" initial={{ x: 0, y: 0, scale: 0 }} animate={{ x: Math.cos(a) * 150, y: Math.sin(a) * 210, scale: 1 }} transition={{ ...spring, delay: 0.25 + i * 0.05 }}><Avatar id={pid} size={40} /></motion.span>;
          })}
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }} className="relative">
            <p className="num text-[96px] font-semibold leading-none tracking-[-0.05em] text-[var(--sun)]"><Rise to={m.n} /></p>
            <p className="mt-3 text-[22px] font-semibold leading-tight">{c.name} is {m.n} people</p>
            <p className="mt-1 text-[15px] text-white/80">Every one of them let in by someone.</p>
          </motion.div>
          <div className="absolute inset-x-6 bottom-[max(env(safe-area-inset-bottom),28px)] grid gap-2">
            <button type="button" className="btn btn-sun" onClick={() => { act.quietMilestone(); act.post(c.id, `We're ${m.n}. Thank you for bringing the people you bring. Next one's on the house.`, { announce: true, stay: true }); }}><Megaphone size={18} />Tell everyone</button>
            <button type="button" className="btn text-white/85" onClick={act.quietMilestone}>Later</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
