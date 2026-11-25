/**
 * Gather IDs. The first digit says what you're dialling, so one dial pad can
 * resolve anything and never has to guess:
 *
 *   2–5  a person      8 digits  4829-1044
 *   7    a group       6 digits  731-806
 *   8    a community   6 digits  804-219
 *   9    an event room 6 digits  992-104  (dies with the event)
 *
 * Indian mobiles are 10 digits and start 6–9, so a person's ID is never
 * mistaken for one: different length, different first digit, different shape.
 */
export type Kind = "person" | "group" | "community" | "room";

export function kindOf(digits: string): Kind | null {
  const d = digits[0];
  if (!d) return null;
  if ("2345".includes(d)) return "person";
  if (d === "7") return "group";
  if (d === "8") return "community";
  if (d === "9") return "room";
  return null;
}

export const lengthOf = (k: Kind) => (k === "person" ? 8 : 6);
export const chunkOf = (k: Kind) => (k === "person" ? 4 : 3);
export const pretty = (digits: string) => {
  const k = kindOf(digits);
  const c = k ? chunkOf(k) : 3;
  return digits.length > c ? `${digits.slice(0, c)}-${digits.slice(c)}` : digits;
};
export const KIND_LABEL: Record<Kind, string> = { person: "Person", group: "Group", community: "Community", room: "Event room" };
