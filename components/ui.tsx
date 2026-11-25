"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import { chunked, specOf, type Kind } from "@/lib/ids";
import type { Community, Group } from "@/lib/data";
import { person, useStore } from "@/lib/store";

export const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

export function Avatar({ id, size = 44 }: { id: string; size?: number }) {
  const { s } = useStore();
  const p = id === "me" || id === s.me?.id ? s.me : person(id);
  const hue = p?.hue ?? 300;
  const initials = (p?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <span
      aria-hidden="true"
      className="relative grid flex-none place-items-center overflow-hidden rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 46% 40%)` }}
    >
      <span className="absolute rounded-full" style={{ width: size * 0.9, height: size * 0.9, right: -size * 0.46, bottom: -size * 0.54, background: `hsl(${(hue + 40) % 360} 62% 58%)` }} />
      <span className="relative">{initials}</span>
    </span>
  );
}

export function Glyph({ c, size = 52 }: { c: Pick<Community, "hue" | "glyph">; size?: number }) {
  const f = "#fff";
  return (
    <span aria-hidden="true" className="grid flex-none place-items-center" style={{ width: size, height: size, borderRadius: size * 0.32, background: `hsl(${c.hue} 48% 38%)` }}>
      <svg viewBox="0 0 40 40" width={size * 0.62} height={size * 0.62}>
        {c.glyph === "circle" && [0, 72, 144, 216, 288].map((a) => <circle key={a} cx={20 + 11 * Math.cos((a * Math.PI) / 180)} cy={20 + 11 * Math.sin((a * Math.PI) / 180)} r="4.6" fill={f} opacity={a === 0 ? 1 : 0.62} />)}
        {c.glyph === "wave" && [12, 20, 28].map((y, i) => <path key={y} d={`M5 ${y} q7.5 -7 15 0 t15 0`} fill="none" stroke={f} strokeWidth="3.4" strokeLinecap="round" opacity={1 - i * 0.25} />)}
        {c.glyph === "grid" && [[9, 9], [23, 9], [9, 23], [23, 23]].map(([x, y], i) => <rect key={i} x={x - 2} y={y - 2} width="12" height="12" rx="3.5" fill={f} opacity={i === 3 ? 1 : 0.6} />)}
        {c.glyph === "dice" && (<><rect x="7" y="7" width="26" height="26" rx="7" fill="none" stroke={f} strokeWidth="3" />{[[14, 14], [26, 14], [20, 20], [14, 26], [26, 26]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill={f} />)}</>)}
      </svg>
    </span>
  );
}

/** A group wears its community's colour, so it's always clear whose it is. */
export function GroupMark({ g, hue, size = 44, quiet = false }: { g: Pick<Group, "name">; hue: number; size?: number; quiet?: boolean }) {
  return <span aria-hidden="true" className="grid flex-none place-items-center font-semibold" style={{ width: size, height: size, borderRadius: size * 0.36, fontSize: size * 0.4, background: quiet ? "var(--sunk)" : `hsl(${hue} 50% 91%)`, color: `hsl(${hue} 50% 30%)` }}>{g.name[0]}</span>;
}

export function Faces({ ids, size = 28 }: { ids: string[]; size?: number }) {
  return <span className="flex flex-none" style={{ paddingLeft: size * 0.28 }}>{ids.map((m) => <span key={m} className="rounded-full" style={{ marginLeft: -size * 0.28 }}><Avatar id={m} size={size} /></span>)}</span>;
}

/**
 * An ID drawn so its kind is obvious before you read it: people are
 * soft pills, communities and groups are solid tiles, a room is a torn
 * ticket that won't last.
 */
export function IdTiles({ digits, size = "md", tone = "plain" }: { digits: string; size?: "sm" | "md" | "lg"; tone?: "plain" | "dark" }) {
  const sp = specOf(digits);
  const kind = sp?.kind ?? "community";
  const parts = chunked(digits);
  const fs = { sm: 13, md: 18, lg: parts.length > 2 || (parts[0]?.length ?? 0) > 3 ? 27 : 34 }[size];
  const fg = tone === "dark" ? "#fff" : kind === "person" ? "var(--brand)" : kind === "room" ? "var(--live)" : "var(--ink)";
  const bg = tone === "dark" ? "rgba(255,255,255,0.14)" : kind === "person" ? "var(--brand-soft)" : "var(--sunk)";
  return (
    <span className="digits inline-flex items-center font-medium" style={{ fontSize: fs, gap: fs * 0.3 }} aria-label={digits.split("").join(" ")}>
      <span aria-hidden="true" style={{ color: fg }}>{sp?.mark}</span>
      {parts.map((x, i) => (
        <span
          key={i}
          style={{
            padding: `${fs * 0.22}px ${fs * 0.5}px`,
            background: kind === "room" ? "transparent" : bg,
            border: kind === "room" ? `1.5px dashed ${tone === "dark" ? "rgba(255,255,255,0.6)" : "var(--live)"}` : "1.5px solid transparent",
            borderRadius: kind === "person" ? 999 : fs * 0.32,
            letterSpacing: "0.06em",
            color: fg,
          }}
        >
          {x}
        </span>
      ))}
    </span>
  );
}

export function Tag({ children, on = false }: { children: React.ReactNode; on?: boolean }) {
  return <span className="rounded-full px-2.5 py-1 text-[12.5px] font-medium" style={{ background: on ? "var(--sun)" : "var(--sunk)", color: "var(--ink)" }}>{children}</span>;
}

export function Bar({ title, sub, right, onTitle, dark = false }: { title?: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; onTitle?: () => void; dark?: boolean }) {
  const { act } = useStore();
  const inner = (
    <>
      <span className="block truncate text-[16.5px] font-semibold leading-tight">{title}</span>
      {sub && <span className="block truncate text-[13px]" style={{ color: dark ? "rgba(255,255,255,0.72)" : "var(--soft)" }}>{sub}</span>}
    </>
  );
  return (
    <header className="flex flex-none items-center gap-1 px-2 pb-2 pt-[max(env(safe-area-inset-top),14px)]" style={{ color: dark ? "#fff" : undefined }}>
      <button type="button" aria-label="Back" className="press grid h-11 w-11 flex-none place-items-center rounded-full" onClick={act.pop}><ChevronLeft size={26} /></button>
      {onTitle ? <button type="button" className="min-w-0 flex-1 text-left" onClick={onTitle}>{inner}</button> : <div className="min-w-0 flex-1">{inner}</div>}
      {right}
    </header>
  );
}

export function SheetShell({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
          <motion.button type="button" aria-label="Close" className="absolute inset-0 w-full bg-[#1e1020]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="scroll absolute inset-x-0 bottom-0 max-h-[88%] rounded-t-[28px] bg-[var(--card)] px-5 pb-[max(env(safe-area-inset-bottom),22px)] pt-3"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, i) => i.offset.y > 110 && onClose()}
          >
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{label}</h2>
              <button type="button" aria-label="Close" className="press grid h-10 w-10 place-items-center rounded-full bg-[var(--sunk)]" onClick={onClose}><X size={18} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Unread({ n }: { n: number }) {
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span key={n} initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="digits grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[var(--sun)] px-1.5 text-[12px] font-medium" aria-label={`${n} unread`}>{n}</motion.span>
      )}
    </AnimatePresence>
  );
}

export const nameOf = (id: string) => (id === "me" ? "You" : (person(id)?.name ?? "Someone"));
export const firstOf = (id: string) => nameOf(id).split(" ")[0];
export const KIND_COLOR: Record<Kind, string> = { person: "var(--brand)", group: "#3a4a8c", community: "var(--ink)", room: "var(--live)" };

/** Where an element sits in the device, so a screen can grow out of it. */
export const rectOf = (el: Element) => {
  const d = el.closest(".device")?.getBoundingClientRect() ?? document.body.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const n = (v: number) => Math.max(0, Math.round(v));
  return { t: n(r.top - d.top), r: n(d.right - r.right), b: n(d.bottom - r.bottom), l: n(r.left - d.left) };
};
