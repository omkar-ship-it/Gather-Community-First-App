import { chunked, checks, withCheck } from "./ids";

/**
 * Numbers people choose for themselves. Every one offered is valid (the last
 * digit still checks the rest), and what makes it special is read off the
 * digits, so a price is always for something you can see.
 */
export type Tier = "free" | "catchy" | "premium" | "rare";
/** `hot` is the stretch of digits that makes it special, end exclusive. */
export type Offer = { id: string; why: string; tier: Tier; price: number; hot: [number, number] };
export type Style = "mix" | "endings" | "doubles" | "mirror" | "counting" | "few";

export const TIER: Record<Tier, { label: string; price: number }> = {
  free: { label: "Free", price: 0 },
  catchy: { label: "Catchy", price: 299 },
  premium: { label: "Premium", price: 1499 },
  rare: { label: "Rare", price: 9999 },
};
export const STYLES: { id: Style; label: string }[] = [
  { id: "mix", label: "For you" }, { id: "endings", label: "Big endings" }, { id: "doubles", label: "Doubles" },
  { id: "mirror", label: "Mirrors" }, { id: "counting", label: "Counting" }, { id: "few", label: "Few digits" },
];

const rev = (x: string) => [...x].reverse().join("");
const WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

function longestRun(id: string) {
  let best = { n: 1, d: id[0], end: 0 }, n = 1;
  for (let i = 1; i < id.length; i++) { n = id[i] === id[i - 1] ? n + 1 : 1; if (n >= best.n) best = { n, d: id[i], end: i }; }
  return best;
}
function longestCount(id: string) {
  let best = 1, at = 0;
  for (const step of [1, -1]) {
    let n = 1;
    for (let i = 1; i < id.length; i++) { n = Number(id[i]) - Number(id[i - 1]) === step ? n + 1 : 1; if (n > best) { best = n; at = i; } }
  }
  return { n: best, text: id.slice(at - best + 1, at + 1), from: at - best + 1 };
}

/** What a number has going for it, strongest first. */
export function judge(id: string): Offer {
  const [, b, c] = chunked(id);
  const f: [number, string, [number, number]][] = [];
  const run = longestRun(id);
  if (run.n >= 3) f.push([[0, 0, 0, 1, 4, 6, 8][Math.min(run.n, 6)], `${run.end === id.length - 1 ? "Ends in " : ""}${WORD[Math.min(run.n, 8)]} ${run.d}s${run.end === id.length - 1 ? "" : " in a row"}`, [run.end - run.n + 1, run.end + 1]]);
  if (id === rev(id)) f.push([8, "Reads the same backwards", [0, 11]]);
  if (b === c) f.push([6, `${b}, twice`, [3, 11]]);
  else if (b === rev(c)) f.push([5, "A mirror", [3, 11]]);
  const count = longestCount(id);
  if (count.n >= 4) f.push([[0, 0, 0, 0, 2, 5, 8][Math.min(count.n, 6)], `Counts ${count.text}`, [count.from, count.from + count.n]]);
  const kinds = new Set(id).size;
  if (kinds <= 4) f.push([[0, 9, 9, 6, 2][kinds], `Only ${WORD[kinds]} different digits`, [0, 11]]);
  if (/^(\d)(\d)\1\2$/.test(c) || /^(\d)\1(\d)\2$/.test(c)) f.push([2, `Ends ${c}`, [7, 11]]);
  f.sort((x, y) => y[0] - x[0]);
  const score = f.reduce((n, [v]) => n + v, 0);
  const tier: Tier = score >= 9 ? "rare" : score >= 5 ? "premium" : score >= 2 ? "catchy" : "free";
  const why = f[0]?.[1] ?? "Nobody has had it before";
  return { id, why: why[0].toUpperCase() + why.slice(1), tier, price: TIER[tier].price, hot: f[0]?.[2] ?? [0, 0] };
}

const r = (n: number) => Math.floor(Math.random() * n);
const ds = (n: number) => Array.from({ length: n }, () => r(10)).join("");
const lead = () => String(2 + r(4));

/** Keep drawing until the check digit agrees: one in ten does. */
function draw(make: () => string): string | null {
  for (let i = 0; i < 400; i++) { const id = make(); if (id.length === 11 && /^[2-5]/.test(id) && checks(id)) return id; }
  return null;
}

const MAKE: Record<Exclude<Style, "mix">, () => string> = {
  endings: () => { const n = 3 + r(4); return lead() + ds(10 - n) + String(r(10)).repeat(n); },
  doubles: () => { const x = ds(4); return lead() + ds(2) + x + x; },
  mirror: () => { if (r(3) === 0) { const h = lead() + ds(4); return h + ds(1) + rev(h); } const x = ds(4); return lead() + ds(2) + x + rev(x); },
  counting: () => { const n = 4 + r(3), from = r(10 - n + 1), run = Array.from({ length: n }, (_, i) => from + i).join(""); const s = r(2) ? run : rev(run); const rest = ds(10 - n), cut = r(rest.length + 1); return lead() + rest.slice(0, cut) + s + rest.slice(cut); },
  few: () => { const a = lead(), b = String(r(10)), c = r(2) ? String(r(10)) : a; return a + Array.from({ length: 10 }, () => [a, b, c][r(3)]).join(""); },
};
const plain = () => withCheck(lead() + ds(9));

/** One offer in a style, never one that's already on screen. */
export function one(style: Style, seen: Set<string>, tier?: Tier): Offer {
  const styles = Object.keys(MAKE) as Exclude<Style, "mix">[];
  for (let i = 0; i < 600; i++) {
    const id = tier === "free" ? plain() : draw(MAKE[style === "mix" ? styles[r(styles.length)] : style]);
    if (!id || seen.has(id)) continue;
    const o = judge(id);
    if (!tier || o.tier === tier) return o;
  }
  return judge(plain());
}

export function offers(style: Style): Offer[] {
  const seen = new Set<string>();
  const add = (o: Offer) => { seen.add(o.id); return o; };
  if (style === "mix") return (["premium", "catchy", "free", "rare", "free", "premium", "catchy", "free"] as Tier[]).map((t) => add(one("mix", seen, t)));
  return Array.from({ length: 8 }, () => add(one(style, seen)));
}

/** Numbers carrying the digits someone asked for, at the end if possible. */
export function containing(p: string, n = 8): Offer[] {
  const seen = new Set<string>();
  const out: Offer[] = [];
  for (let i = 0; i < 3000 && out.length < n; i++) {
    const room = 11 - p.length;
    // The first four keep it at the end; after that it may sit anywhere.
    const at = i < 600 && out.length < 4 ? room : r(room + 1);
    if (at === 0 && !/^[2-5]/.test(p)) continue;
    const id = at === 0 ? p + ds(room) : lead() + ds(at - 1) + p + ds(room - at);
    if (!checks(id) || seen.has(id)) continue;
    seen.add(id);
    const o = judge(id);
    out.push(o.tier === "free" ? { ...o, hot: [id.lastIndexOf(p), id.lastIndexOf(p) + p.length], why: id.endsWith(p) ? `Ends in your ${p}` : `Has your ${p}` } : o);
  }
  return out;
}
