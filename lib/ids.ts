/**
 * Gather numbers: universal, one per person for life, sized for billions.
 *
 *   2–5  a person     11 digits  @482 9104 4076   4 billion
 *   1    a person     12 digits  @148 291 044 071 10 billion, issued once 2–5 fill up
 *   6    a community   9 digits  #680 421 907     100 million
 *   7    a group       9 digits  #731 806 124     100 million
 *   8 9  a PIN         6 digits  *992 104         200,000 open at once
 *   0    a PIN         7 digits  *012 3456        a million more, for busy hours
 *
 * The first digit fixes the length, so one pad dials anything and longer
 * numbers can be issued later without changing a single existing one.
 *
 * A number is permanent. A PIN is a door somebody has opened for a while: an
 * event's, or a community's or group's for an hour. That is the only way six
 * digits can serve millions of them: there are only a million six-digit
 * numbers, so nobody gets to keep one.
 *
 * A person's number is random. It is tied to their mobile and email, never
 * made from them, so it gives neither away. Its last digit is a check digit.
 * 11 digits is one more than an Indian mobile, and 12 only ever starts with
 * 1, which an Aadhaar number never does.
 */
export type Kind = "person" | "group" | "community" | "room";
export type Spec = { kind: Kind; chunks: number[]; length: number; mark: string };

const spec = (kind: Kind, chunks: number[], mark: string): Spec => ({ kind, chunks, mark, length: chunks.reduce((a, b) => a + b, 0) });
const PERSON = spec("person", [3, 4, 4], "@");
const PIN = spec("room", [3, 3], "*");
const BY_FIRST: Record<string, Spec> = {
  "0": spec("room", [3, 4], "*"),
  "1": spec("person", [3, 3, 3, 3], "@"),
  "2": PERSON, "3": PERSON, "4": PERSON, "5": PERSON,
  "6": spec("community", [3, 3, 3], "#"),
  "7": spec("group", [3, 3, 3], "#"),
  "8": PIN, "9": PIN,
};
export const specOf = (digits: string): Spec | null => BY_FIRST[digits[0]] ?? null;

export function chunked(digits: string): string[] {
  const out: string[] = [];
  let i = 0;
  for (const n of specOf(digits)?.chunks ?? [3, 3]) { out.push(digits.slice(i, i + n)); i += n; }
  return out.filter(Boolean);
}
export const pretty = (digits: string) => `${specOf(digits)?.mark ?? ""}${chunked(digits).join(" ")}`;

/** Damm check digit: catches every single wrong digit and every swapped pair of neighbours. */
const DAMM = ["0317598642", "7092154863", "4206871359", "1750983426", "6123045978", "3674209581", "5869720134", "8945362017", "9438617205", "2581436790"];
const damm = (d: string) => d.split("").reduce((s, x) => Number(DAMM[s][Number(x)]), 0);
export const withCheck = (d: string) => d + damm(d);
export const checks = (d: string) => damm(d) === 0;

export const KIND_LABEL: Record<Kind, string> = { person: "Person", group: "Group", community: "Community", room: "PIN" };
