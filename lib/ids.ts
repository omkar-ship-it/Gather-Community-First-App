/**
 * Gather numbers, sized for billions of people and millions of communities.
 *
 * Numbers are unique within a city, the way phone numbers are within an area
 * code, so they stay short for the people near you. From elsewhere, dial 0
 * and the three-digit city code first. The first digit says what it is:
 *
 *   0    another city     0 + 3-digit city code, then the number
 *   2–5  a person         9 digits  @482 910 448   last digit is a check digit
 *   6    an online        8 digits  #6184 0275     same number everywhere
 *        community
 *   7    a group          8 digits  #7318 0612
 *   8    a community      6 digits  #804 219
 *   9    a live room      6 digits  *992 104       reused after the event
 *   1    reserved
 *
 * The @ # * marks are how a number is written down. No phone number has one,
 * which matters because every bare length of digits is a phone number
 * somewhere. The marks never have to be typed.
 */
export type Kind = "person" | "group" | "community" | "room";
export type Spec = { kind: Kind; chunks: number[]; length: number; mark: string; online?: boolean };

const spec = (kind: Kind, chunks: number[], mark: string, online = false): Spec => ({ kind, chunks, mark, online, length: chunks.reduce((a, b) => a + b, 0) });
const PERSON = spec("person", [3, 3, 3], "@");
const BY_FIRST: Record<string, Spec> = {
  "2": PERSON, "3": PERSON, "4": PERSON, "5": PERSON,
  "6": spec("community", [4, 4], "#", true),
  "7": spec("group", [4, 4], "#"),
  "8": spec("community", [3, 3], "#"),
  "9": spec("room", [3, 3], "*"),
};
export const specOf = (digits: string): Spec | null => BY_FIRST[digits[0]] ?? null;
export const kindOf = (digits: string) => specOf(digits)?.kind ?? null;

export function chunked(digits: string): string[] {
  const out: string[] = [];
  let i = 0;
  for (const n of specOf(digits)?.chunks ?? [3, 3]) { out.push(digits.slice(i, i + n)); i += n; }
  return out.filter(Boolean);
}
export const pretty = (digits: string) => `${specOf(digits)?.mark ?? ""}${chunked(digits).join(" ")}`;

/**
 * Damm check digit: catches every single wrong digit and every swapped pair
 * of neighbours, so a slip of the thumb can't reach a stranger.
 */
const DAMM = ["0317598642", "7092154863", "4206871359", "1750983426", "6123045978", "3674209581", "5869720134", "8945362017", "9438617205", "2581436790"];
const damm = (d: string) => d.split("").reduce((s, x) => Number(DAMM[s][Number(x)]), 0);
export const withCheck = (d: string) => d + damm(d);
export const checks = (d: string) => damm(d) === 0;

export type City = { code: string; name: string };
/** Invented codes. Deliberately not STD codes: 080 plus a number would be a landline. */
export const CITIES: City[] = [
  { code: "418", name: "Bengaluru" }, { code: "422", name: "Mumbai" }, { code: "411", name: "Delhi" }, { code: "437", name: "Hyderabad" },
  { code: "562", name: "London" }, { code: "633", name: "Singapore" }, { code: "715", name: "Lagos" }, { code: "209", name: "São Paulo" },
];
export const HOME = "418";
export const cityOf = (code: string) => CITIES.find((c) => c.code === code) ?? null;
/** The number that works from anywhere. Online communities have no city. */
export const fullOf = (digits: string, city: string) => (specOf(digits)?.online ? digits : `0${city}${digits}`);

export const KIND_LABEL: Record<Kind, string> = { person: "Person", group: "Group", community: "Community", room: "Live room" };
