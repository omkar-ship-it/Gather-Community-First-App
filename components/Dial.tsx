"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Delete, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CITIES, HOME, KIND_LABEL, checks, cityOf, specOf } from "@/lib/ids";
import { count, left, overlap, parseFull, person, resolve, useNow, useStore, when, type Target } from "@/lib/store";
import { Avatar, Glyph, KIND_COLOR, Tag, firstOf, spring } from "./ui";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
type Miss = "typo" | "nobody" | "city" | "first" | null;

/**
 * One pad for everything. The first digit decides what you're dialling, the
 * city decides where, and 0 plus a city code moves you there as you type.
 */
export default function Dial() {
  const { s, act } = useStore();
  const home = s.me?.zone ?? HOME;
  const [start] = useState(() => parseFull(s.dialWith, home));
  const [zone, setZone] = useState(start.zone);
  const [digits, setDigits] = useState(start.digits);
  const [found, setFound] = useState<Target | null>(() => resolve(s, start.digits, start.zone));
  const [miss, setMiss] = useState<Miss>(null);
  const [cities, setCities] = useState(false);
  const timer = useRef<number>(0);

  const trunk = digits[0] === "0";
  const sp = specOf(digits);
  const kind = sp?.kind ?? null;
  const chunks = trunk ? [1, 3] : (sp?.chunks ?? [3, 3]);
  const need = chunks.reduce((a, b) => a + b, 0);
  const gaps = chunks.reduce<number[]>((a, n) => [...a, (a.at(-1) ?? -1) + n], []);
  const colour = kind ? KIND_COLOR[kind] : "var(--ink)";

  const settle = useCallback((next: string, z: string) => {
    setDigits(next);
    setFound(null);
    setMiss(null);
    window.clearTimeout(timer.current);
    if (next[0] === "0") {
      if (next.length < 4) return;
      timer.current = window.setTimeout(() => {
        const c = cityOf(next.slice(1, 4));
        if (c) { navigator.vibrate?.(14); setZone(c.code); setDigits(""); } else { navigator.vibrate?.([8, 40, 8]); setMiss("city"); }
      }, 260);
      return;
    }
    if (next && !specOf(next)) return setMiss("first");
    const n = specOf(next);
    if (!n || next.length < n.length) return;
    if (n.kind === "person" && !checks(next)) { navigator.vibrate?.([8, 40, 8]); return setMiss("typo"); }
    timer.current = window.setTimeout(() => {
      const t = resolve(s, next, z);
      if (t) { navigator.vibrate?.(18); setFound(t); } else { navigator.vibrate?.([8, 40, 8]); setMiss("nobody"); }
    }, 320);
  }, [s]);

  const press = useCallback((k: string) => {
    if (k === "del") return settle(digits.slice(0, -1), zone);
    const max = digits[0] === "0" ? 4 : digits ? (specOf(digits)?.length ?? 1) : 1;
    if (!k || digits.length >= Math.max(max, 1)) return;
    navigator.vibrate?.(4);
    settle(digits + k, zone);
  }, [digits, settle, zone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Escape") act.dial(false);
      else if (e.key === "Enter" && found) act.enter(found);
    };
    const onPaste = (e: ClipboardEvent) => {
      const raw = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "");
      const p = parseFull(raw, zone);
      setZone(p.zone);
      settle(p.digits.slice(0, specOf(p.digits)?.length ?? 1), p.zone);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("paste", onPaste); };
  }, [press, settle, act, found, zone]);

  const where = cityOf(zone)?.name ?? "";
  const hint = miss === "first" ? "Numbers never start with 1. Check the first digit."
    : miss === "city" ? "No city has that code."
    : miss === "typo" ? "One digit is off. Read it back once more."
    : miss === "nobody" ? (sp?.online ? "No community has that number." : `No ${KIND_LABEL[kind!].toLowerCase()} in ${where} has that number.`)
    : trunk ? "Now the three-digit city code"
    : !kind ? "A person, a community, a group or a live room"
    : found ? "" : sp!.online ? "Online community, in every city" : `${KIND_LABEL[kind]} in ${where}`;

  return (
    <motion.div className="absolute inset-0 z-40 flex flex-col bg-[var(--bg)]" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring} role="dialog" aria-modal="true" aria-label="Dial a number">
      <div className="flex flex-none items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
        <motion.button key={zone} initial={{ scale: 0.9 }} animate={{ scale: 1 }} type="button" aria-expanded={cities} onClick={() => setCities(!cities)} className="press flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[15.5px] font-semibold" style={{ background: zone === home ? "var(--card)" : "var(--sun)" }}>
          <MapPin size={17} /> {where} <ChevronDown size={17} style={{ transform: cities ? "rotate(180deg)" : undefined }} />
        </motion.button>
        <button type="button" aria-label="Close" className="press grid h-11 w-11 place-items-center rounded-full bg-[var(--sunk)]" onClick={() => act.dial(false)}><X size={20} /></button>
      </div>

      <AnimatePresence>
        {cities && (
          <motion.ul className="scroll absolute inset-x-4 top-[72px] z-10 max-h-[62%] rounded-[24px] bg-[var(--card)] p-2 shadow-[0_24px_60px_-20px_rgba(30,16,32,0.45)]" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {CITIES.map((c) => (
              <li key={c.code}><button type="button" onClick={() => { setZone(c.code); setCities(false); settle(digits, c.code); }} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-left text-[16px] font-medium">{c.name}{c.code === zone && <Check size={18} className="text-[var(--brand)]" />}<span className="digits ml-auto text-[15px] text-[var(--soft)]">0{c.code}</span></button></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col items-center justify-center px-3">
        <div className={`flex items-center ${miss ? "shake" : ""}`} aria-live="polite" aria-label={digits ? digits.split("").join(" ") : "No digits yet"}>
          <span className="digits mr-2 text-[24px]" style={{ color: miss ? "var(--live)" : colour, visibility: sp ? "visible" : "hidden" }} aria-hidden="true">{sp?.mark ?? "#"}</span>
          {Array.from({ length: need }, (_, i) => (
            <motion.span
              layout key={i} transition={spring}
              className="digits grid place-items-center text-[25px] font-medium"
              style={{
                width: need > 6 ? "clamp(24px, 7.6vw, 33px)" : "clamp(36px, 11vw, 44px)", height: 56, marginRight: i === need - 1 ? 0 : gaps.includes(i) ? 10 : 3,
                borderRadius: kind === "person" ? 18 : 11,
                background: digits[i] ? "var(--card)" : "var(--sunk)",
                border: `2px ${kind === "room" ? "dashed" : "solid"} ${miss ? "var(--live)" : digits[i] && kind ? colour : "transparent"}`,
                color: colour,
              }}
            >
              {digits[i] ?? ""}
            </motion.span>
          ))}
        </div>
        <p className="mt-4 min-h-[22px] text-center text-[14.5px]" style={{ color: miss ? "var(--live)" : "var(--soft)" }}>{hint}</p>
      </div>

      <div className="relative flex-none px-5 pb-[max(env(safe-area-inset-bottom),26px)]" style={{ minHeight: 372 }}>
        <div className="grid grid-cols-3 gap-2.5" inert={Boolean(found)}>
          {KEYS.map((k, i) => k === "" ? <span key={i} /> : (
            <button key={i} type="button" onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k} className="digits press grid h-[72px] place-items-center rounded-[22px] text-[28px]" style={{ background: k === "del" ? "transparent" : "var(--card)" }}>
              {k === "del" ? <Delete size={26} /> : k}
            </button>
          ))}
        </div>
        <AnimatePresence>{found && <Found t={found} key={found.id} onBack={() => settle("", zone)} />}</AnimatePresence>
      </div>
    </motion.div>
  );
}

/** What the number turned out to be. Shown before any sign-in: no dead ends. */
function Found({ t, onBack }: { t: Target; onBack: () => void }) {
  const { s, act } = useStore();
  const now = useNow();
  const e = t.kind === "room" ? s.events.find((x) => x.id === t.id) : null;
  const g = t.kind === "group" ? s.groups.find((x) => x.id === t.id) : null;
  const c = s.communities.find((x) => x.id === (t.kind === "community" ? t.id : (g?.communityId ?? e?.communityId)));
  const p = t.kind === "person" ? person(t.id) : null;
  const live = e && e.startsAt <= now;
  const why = p && s.me ? overlap(s, p).line : null;
  const cta = p ? (s.me ? `See ${p.name.split(" ")[0]}'s profile` : "Say hello") : e ? (live ? "Walk in" : "See the event") : c?.joined ? "Open" : c?.open ? "Join" : "Ask to join";
  return (
    <motion.div className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-[30px] bg-[var(--card)] px-5 pb-[max(env(safe-area-inset-bottom),22px)] pt-6" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring} style={{ minHeight: 372 }}>
      <div className="flex items-center gap-4">
        {p ? <Avatar id={p.id} size={68} /> : c && <Glyph c={c} size={68} />}
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">{p?.name ?? (e ? e.title.split(":")[0] : g ? g.name : c?.name)}</p>
          <p className="mt-0.5 text-[14.5px] text-[var(--soft)]">{p ? p.headline : e ? c?.name : g ? `A group in ${c?.name}` : c?.blurb}</p>
        </div>
      </div>
      <div className="mt-5 flex-1 text-[15px] leading-relaxed">
        {p && (why ? <p className="rounded-2xl bg-[var(--sun)]/25 px-4 py-3 font-medium">{why}</p> : <div className="flex flex-wrap gap-1.5">{p.intents.map((i) => <Tag key={i}>{i}</Tag>)}</div>)}
        {e && (
          <>
            <p className="flex items-center gap-2 font-medium" style={{ color: live ? "var(--live)" : undefined }}>
              {live && <span className="dot-live h-2 w-2 rounded-full bg-[var(--live)]" />}
              {live ? `Happening now. The room closes in ${left(e.endsAt - now)}` : when(e.startsAt)}
            </p>
            <p className="mt-1 text-[var(--soft)]">{count(e.inside)} people {live ? "inside" : "going"}, with {e.going.slice(0, 3).map(firstOf).join(", ")}</p>
          </>
        )}
        {!p && !e && c && (
          <div className="flex items-center gap-3">
            <span className="flex -space-x-2.5">{c.members.slice(0, 4).map((m) => <span key={m} className="rounded-full ring-[3px] ring-white"><Avatar id={m} size={36} /></span>)}</span>
            <span className="text-[var(--soft)]">{count(g ? g.size : c.size)} members{c.online ? ", every city" : `, ${cityOf(c.zone)?.name}`}{c.open ? "" : ". A host says yes to each"}</span>
          </div>
        )}
      </div>
      <button type="button" className="btn btn-main mt-4 w-full" onClick={() => act.enter(t)}>{cta}</button>
      <button type="button" className="mt-1 min-h-[44px] text-[14.5px] font-medium text-[var(--soft)]" onClick={onBack}>Dial a different number</button>
    </motion.div>
  );
}
