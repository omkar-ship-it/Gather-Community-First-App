/**
 * The host's side, invented for the prototype. A host's week is the same
 * five jobs everywhere: let people in, make the new ones feel seen, fill
 * the next thing, notice who's drifting, and hand some of it to someone
 * else. The desk is those five jobs, each one tap.
 *
 * Standing is earned by turning up, never by posting: that's the thing a
 * run club, a gym or a cafe actually cares about.
 */

/** Someone at the door, and their answer to the host's one question. */
export type Knock = { id: string; why: string; hoursAgo: number };
/** A member who used to come and has gone quiet. */
export type Drift = { id: string; weeks: number };
/** A member who has earned a key: a group to lead. */
export type Key = { id: string; groupId: string; why: string };

export type DeskSeed = {
  /** What the host asks everyone at the door. One question, never a form. */
  question: string;
  /** What a meet-up is called here, for the counts: "Sundays", "suppers". */
  unit: string;
  door: Knock[];
  /** Joined this week and not yet welcomed by name. */
  fresh: string[];
  drift: Drift[];
  /** Times each member came, the last twelve. */
  came: Record<string, number>;
  /** Last week, for the pulse. */
  week: { joined: number; came: number; earned: number };
  key?: Key;
};

export const DESKS: Record<string, DeskSeed> = {
  // Sunday Runners: the host co-runs it with Dev.
  "681735042": {
    question: "What pace are you, honestly?",
    unit: "Sundays",
    door: [
      { id: "38956271404", why: "About 6:30 a km. I run to think, so I'll be the quiet one.", hoursAgo: 3 },
      { id: "47731920156", why: "Zero, honestly. I'd like to not be zero by March.", hoursAgo: 11 },
    ],
    fresh: ["41679053260"],
    drift: [{ id: "38260415924", weeks: 3 }],
    came: { "54103387403": 12, "36025841840": 9, "25518306683": 6, "38260415924": 4, "31904472311": 3, "41679053260": 1, me: 7 },
    week: { joined: 6, came: 31, earned: 5970 },
    key: { id: "36025841840", groupId: "768841776", why: "Came to 9 of the last 12 Sundays and always runs at the back with whoever's new." },
  },
  // Corner Table Club: the host's own cafe.
  "682906418": {
    question: "What do you order when you come in?",
    unit: "visits",
    door: [
      { id: "33841506796", why: "Cardamom bun and whatever the window seat is having. I draw birds there.", hoursAgo: 2 },
      { id: "26780159430", why: "Filter coffee, extra strong. I work from your back table on Fridays.", hoursAgo: 20 },
    ],
    fresh: ["25518306683"],
    drift: [{ id: "36025841840", weeks: 4 }],
    came: { "38260415924": 12, "41679053260": 7, "36025841840": 6, "25518306683": 3, "54103387403": 2, me: 11 },
    week: { joined: 3, came: 44, earned: 14400 },
  },
};

/** What a regular is called, by how often they turn up. */
export function standing(n: number | undefined) {
  if (n === undefined) return null;
  if (n >= 10) return { label: "Pillar", tone: "sun" as const };
  if (n >= 6) return { label: "Regular", tone: "brand" as const };
  if (n >= 2) return { label: "Familiar face", tone: "soft" as const };
  return { label: "New", tone: "new" as const };
}

/** Round numbers worth stopping for. */
export const milestone = (before: number, after: number) => {
  const step = after < 100 ? 10 : after < 1000 ? 100 : 1000;
  const hit = Math.floor(after / step) * step;
  return hit > before && hit <= after && hit >= 10 ? hit : null;
};

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
