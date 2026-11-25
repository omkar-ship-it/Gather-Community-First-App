import { HOME } from "./ids";

/** Everything here is invented, for the prototype. */
export type Person = { id: string; name: string; headline: string; bio: string; intents: string[]; askMe: string; skills: string[]; city: string; hue: number; zone: string };
/** `id` is internal; `num` is what people dial, unique within `zone` (its city). */
export type Community = { id: string; num: string; zone: string; online?: boolean; name: string; blurb: string; about: string; hue: number; glyph: string; members: string[]; size: number; joined: boolean; open: boolean };
export type Group = { id: string; communityId: string; name: string; topic: string; size: number };
export type Comment = { by: string; text: string };
export type Post = { id: string; communityId: string; by: string; at: number; text: string; likes: number; liked: boolean; tag?: string; poll?: { q: string; options: { label: string; votes: number }[]; voted: number | null }; comments: Comment[]; eventId?: string };
export type Msg = { id: string; by: string; text: string; at: number; kind?: "note" };
export type Event = { id: string; zone: string; inside: number; communityId: string; title: string; blurb: string; place: string; startsAt: number; endsAt: number; price: number; room: string; host: string; going: string[]; seats: number; ticket: boolean; dissolved: boolean };
export type Me = { id: string; zone: string; name: string; headline: string; intents: string[]; hue: number };

export const INTENTS = [
  "Raising seed", "Angel investing", "Hiring", "Open to work", "Looking for co-founder", "Happy to mentor",
  "New in town", "Here to make friends", "Running buddies", "Building with AI", "Design feedback", "Finding customers",
];

const p = (id: string, name: string, headline: string, bio: string, intents: string[], askMe: string, skills: string[], city: string, hue: number, zone = HOME): Person => ({ id, name, headline, bio, intents, askMe, skills, city, hue, zone });

export const PEOPLE: Person[] = [
  p("319044725", "Rohan Iyer", "Angel, ex-payments founder", "Sold a payments company in 2022. Now writes small first cheques and answers long emails.", ["Angel investing", "Happy to mentor"], "What a first cheque is really betting on", ["Fundraising", "Fintech", "Hiring"], "HSR Layout", 24),
  p("255183069", "Ananya Rao", "Head of design, Lumen Health", "Designs for clinics with bad wifi. Looking for two designers who like messy problems.", ["Hiring", "Design feedback"], "Designing for people in a hurry", ["Product design", "Research"], "Indiranagar", 330),
  p("477319203", "Kabir Sethi", "Backend engineer, between jobs", "Ten years of making slow things fast. Taking a month off, then picking carefully.", ["Open to work", "Building with AI"], "Why your database is fine, actually", ["Postgres", "Go", "Infra"], "Koramangala", 205),
  p("382604157", "Meher Contractor", "Runs a ceramics studio", "Teaches beginners on weekends. Will talk glaze chemistry until you leave.", ["Here to make friends", "Finding customers"], "The kiln that ruined Diwali", ["Teaching", "Retail"], "Jayanagar", 12),
  p("541033870", "Dev Pillai", "Marathoner, school teacher", "Ran eleven marathons, none of them quickly. Plans the Sunday routes.", ["Running buddies", "New in town"], "Running your first 10K without hating it", ["Coaching", "Maps"], "HSR Layout", 140),
  p("228476195", "Sara Thomas", "Founder, Fieldnote", "Building notes for people who work outdoors. Raising a seed round.", ["Raising seed", "Finding customers"], "Selling software to farms", ["GTM", "Product"], "Whitefield", 275),
  p("416790536", "Imran Qureshi", "Mobile engineer, weekend baker", "Ships apps on weekdays, sourdough on Sundays.", ["Looking for co-founder", "Building with AI"], "Offline-first apps", ["iOS", "Android"], "Bellandur", 48),
  p("360258410", "Lakshmi Nair", "Community lead, writer", "Keeps groups alive past week three. Moved here in March.", ["New in town", "Happy to mentor"], "Why most groups die at 40 people", ["Community", "Writing"], "HSR Layout", 355),
  p("338415062", "Zoya Merchant", "Illustrator, makes field guides", "Draws birds for a living. Looking for someone who can turn a paper guide into an app.", ["Looking for co-founder", "New in town"], "Which crow that was", ["Illustration", "Publishing"], "Bandra, Mumbai", 190, "422"),
];

const RAW: Omit<Community, "num" | "zone">[] = [
  { id: "804219", name: "HSR Founders Circle", blurb: "Founders within walking distance of each other", about: "A neighbourhood circle for people building companies in and around HSR. Honest numbers, warm intros, one dinner a month.", hue: 318, glyph: "circle", members: ["319044725", "255183069", "477319203", "228476195", "416790536", "360258410"], size: 214, joined: true, open: true },
  { id: "817350", name: "Sunday Runners", blurb: "Slow is a pace", about: "We meet at 6 on Sundays and nobody gets left behind. Coffee after, always.", hue: 150, glyph: "wave", members: ["541033870", "360258410", "382604157", "416790536"], size: 96, joined: true, open: true },
  { id: "829064", name: "Corner Table Club", blurb: "Regulars of a very small cafe", about: "For the people who already know the menu. First dibs on tastings, supper clubs and the window seat.", hue: 32, glyph: "grid", members: ["382604157", "360258410", "255183069"], size: 58, joined: true, open: true },
  { id: "846112", name: "Board Game Basement", blurb: "Someone always brings Catan", about: "Friday nights, long tables, no phones after nine. Beginners get the good chairs.", hue: 225, glyph: "dice", members: ["477319203", "416790536", "541033870"], size: 131, joined: false, open: true },
  { id: "871503", name: "Second Shift", blurb: "Parents building things after bedtime", about: "Quiet co-working from 9pm, for people whose day starts again when the kids sleep.", hue: 262, glyph: "wave", members: ["228476195", "255183069", "319044725"], size: 77, joined: false, open: false },
];

export const COMMUNITIES: Community[] = [
  ...RAW.map((c) => ({ ...c, num: c.id, zone: HOME })),
  // Same six digits as HSR Founders Circle, in another city. That is the point.
  { id: "mumbai-804219", num: "804219", zone: "422", name: "Bandra Book Swap", blurb: "Bring one, take one, stay for chai", about: "", hue: 188, glyph: "grid", members: ["338415062"], size: 4120, joined: false, open: true },
  { id: "61840275", num: "61840275", zone: "", online: true, name: "Makers Everywhere", blurb: "People making things, in every city", about: "", hue: 288, glyph: "dice", members: ["319044725", "228476195", "416790536", "255183069", "477319203", "338415062"], size: 1_240_318, joined: true, open: true },
];

export const GROUPS: Group[] = [
  { id: "73180612", communityId: "804219", name: "Fundraising", topic: "Decks, terms, who's writing cheques", size: 61 },
  { id: "74211730", communityId: "804219", name: "Hiring", topic: "Roles in, people out", size: 88 },
  { id: "75539048", communityId: "804219", name: "Monthly dinner", topic: "Where, when, who's cooking", size: 34 },
  { id: "76302805", communityId: "817350", name: "Routes", topic: "This Sunday's map", size: 52 },
  { id: "76884177", communityId: "817350", name: "First 10K", topic: "Beginners, all welcome", size: 27 },
  { id: "77921561", communityId: "829064", name: "Today's specials", topic: "What just came out of the oven", size: 41 },
  { id: "70512688", communityId: "61840275", name: "Show your work", topic: "One thing, half finished", size: 88_412 },
  { id: "78466024", communityId: "846112", name: "Friday table", topic: "Who's in this week", size: 36 },
];

const MIN = 60_000, H = 60 * MIN, D = 24 * H;

export function makeEvents(now: number): Event[] {
  const at = (days: number, hour: number) => { const d = new Date(now + days * D); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  const base: Omit<Event, "zone" | "inside">[] = [
    { id: "e1", communityId: "804219", title: "Demo Night: six builders, six minutes", blurb: "Six people show something unfinished. The room asks real questions. No decks.", place: "The Loft, 27th Main, HSR", startsAt: now - 95 * MIN, endsAt: now + 14 * MIN, price: 0, room: "992104", host: "360258410", going: ["319044725", "255183069", "477319203", "228476195", "416790536", "360258410"], seats: 60, ticket: false, dissolved: false },
    { id: "e2", communityId: "817350", title: "Sunrise 10K and filter coffee", blurb: "Lake loop, two pace groups, one very long breakfast.", place: "Agara Lake, east gate", startsAt: at(3, 6), endsAt: at(3, 9), price: 199, room: "918273", host: "541033870", going: ["541033870", "360258410", "382604157"], seats: 40, ticket: false, dissolved: false },
    { id: "e3", communityId: "829064", title: "Supper club: one table, twelve seats", blurb: "Five courses, one long table, and you sit next to someone new each course.", place: "Corner Table, back room", startsAt: at(6, 19), endsAt: at(6, 23), price: 1200, room: "940518", host: "382604157", going: ["382604157", "255183069", "360258410", "319044725"], seats: 12, ticket: false, dissolved: false },
    { id: "e4", communityId: "804219", title: "Pitch practice, kindly", blurb: "Ten minutes each. Two founders and one investor tell you what they heard.", place: "Community hall, Sector 2", startsAt: at(8, 18), endsAt: at(8, 20), price: 0, room: "953377", host: "319044725", going: ["319044725", "228476195"], seats: 16, ticket: false, dissolved: false },
    { id: "e5", communityId: "846112", title: "Catan, but friendly", blurb: "Four tables, one trophy made of cork.", place: "Basement, 14th Cross", startsAt: at(2, 20), endsAt: at(2, 23), price: 150, room: "966240", host: "416790536", going: ["416790536", "477319203"], seats: 24, ticket: false, dissolved: false },
    { id: "e6", communityId: "61840275", title: "Show and tell, all cities", blurb: "Everyone shows one half-made thing. The room does the rest.", place: "Online", startsAt: now - 20 * MIN, endsAt: now + 46 * MIN, price: 0, room: "937420", host: "255183069", going: ["255183069", "477319203", "416790536", "319044725", "338415062", "228476195"], seats: 10000, ticket: false, dissolved: false },
  ];
  return base.map((e) => ({ ...e, zone: HOME, inside: e.id === "e6" ? 3412 : e.going.length }));
}

export function makePosts(now: number): Post[] {
  return [
    { id: "p0", communityId: "61840275", by: "477319203", at: now - 35 * MIN, tag: "Near you", text: "Built a tiny thing that tells you why a query is slow in one sentence. It is wrong half the time. Who wants to break it?", likes: 2214, liked: false, comments: [] },
    { id: "p1", communityId: "804219", by: "228476195", at: now - 22 * MIN, tag: "Ask", text: "Two investors asked me the same thing this week: why farms, why now? My answer takes four minutes. It needs to take one. Who wants to hear it and be rude about it?", likes: 18, liked: false, comments: [{ by: "319044725", text: "Send me a voice note, I'll time you." }, { by: "360258410", text: "Come early to demo night, we'll do it in the stairwell." }] },
    { id: "p2", communityId: "804219", by: "255183069", at: now - 3 * H, tag: "Hiring", text: "We're hiring two product designers. Clinics, bad wifi, real patients. If you like constraints more than concepts, write to me.", likes: 31, liked: false, comments: [{ by: "477319203", text: "Sharing with two people who'd be great." }] },
    { id: "p3", communityId: "804219", by: "360258410", at: now - 8 * H, text: "Where should the November dinner be?", likes: 9, liked: false, poll: { q: "November dinner", options: [{ label: "Someone's terrace", votes: 14 }, { label: "The usual place", votes: 8 }, { label: "Somewhere new", votes: 11 }], voted: null }, comments: [] },
    { id: "p4", communityId: "817350", by: "541033870", at: now - 50 * MIN, text: "Sunday's loop avoids the flooded stretch. 9.6 km, so do a lap of the car park if you need the round number.", likes: 22, liked: true, eventId: "e2", comments: [{ by: "416790536", text: "I always need the round number." }] },
    { id: "p5", communityId: "829064", by: "382604157", at: now - 5 * H, text: "The new mugs are out of the kiln. Forty made, thirty-six survived. Regulars get first pick from four today.", likes: 27, liked: false, comments: [] },
    { id: "p6", communityId: "846112", by: "416790536", at: now - 20 * H, text: "Reminder: the sheep meeple is still missing. No questions asked.", likes: 40, liked: false, comments: [] },
  ];
}

let seq = 0;
export const uid = () => `m${++seq}`;
const m = (by: string, text: string, at: number): Msg => ({ id: uid(), by, text, at });

/** Threads: g:<group>, d:<person>, r:<event>. */
export function makeThreads(now: number): Record<string, Msg[]> {
  return {
    "g:73180612": [m("228476195", "Has anyone raised from a fund that insists on a board seat at seed?", now - 34 * MIN), m("319044725", "Walk. Politely.", now - 30 * MIN), m("416790536", "Seconded.", now - 9 * MIN)],
    "g:74211730": [m("255183069", "Portfolio reviews tonight at 8 if anyone wants eyes on theirs", now - 2 * H), m("477319203", "Me please", now - 4 * MIN)],
    "g:75539048": [m("360258410", "Poll's up on the feed. Vote before Friday.", now - 8 * H)],
    "g:76302805": [m("541033870", "Map for Sunday is pinned", now - 52 * MIN), m("382604157", "Is there a shorter option for the lazy", now - 47 * MIN), m("541033870", "There is always a shorter option", now - 46 * MIN)],
    "g:76884177": [m("360258410", "I ran 4K without stopping. Telling everyone.", now - 26 * H)],
    "g:77921561": [m("382604157", "Cardamom buns, eleven left", now - 5 * H)],
    "g:70512688": [m("416790536", "Day 12 of the bread timer app", now - 11 * H)],
    "d:338415062": [m("338415062", "Hi! Imran said you build things. I have a paper field guide that wants to be an app. Ten minutes?", now - 2 * H)],
    "r:e6": [m("338415062", "Drew this on the train, be kind", now - 4 * MIN), m("477319203", "The crow is perfect", now - 3 * MIN)],
    "g:78466024": [m("477319203", "Four for Friday so far", now - 20 * H)],
    "d:319044725": [m("319044725", "Good to meet you at pitch practice. Send the one-page when it's ready.", now - 3 * H)],
    "d:360258410": [m("me", "Thanks for the intro to Ananya!", now - 27 * H), m("360258410", "That's the job. Coming Thursday?", now - 26 * H)],
    "r:e1": [m("360258410", "Welcome in. Two demos left. Ask better questions than me.", now - 18 * MIN), m("416790536", "That offline sync demo was unreal", now - 11 * MIN), m("255183069", "Sara, I want to talk about your onboarding", now - 6 * MIN), m("228476195", "Yes please, I'm by the window", now - 5 * MIN)],
  };
}

/** Intents that fit together, said as a person would say it. */
export const FITS: { mine: string; theirs: string; line: (n: string) => string; open: (n: string) => string }[] = [
  { mine: "Raising seed", theirs: "Angel investing", line: (n) => `You're raising. ${n} writes first cheques.`, open: (n) => `Hi ${n}, I'm raising a seed round and I'd value ten minutes of your honest reaction to it.` },
  { mine: "Angel investing", theirs: "Raising seed", line: (n) => `${n} is raising, and you invest.`, open: (n) => `Hi ${n}, I invest small and early. What are you building?` },
  { mine: "Open to work", theirs: "Hiring", line: (n) => `${n} is hiring, and you're looking.`, open: (n) => `Hi ${n}, I saw you're hiring. Could I tell you what I've been working on?` },
  { mine: "Hiring", theirs: "Open to work", line: (n) => `You're hiring. ${n} is open to work.`, open: (n) => `Hi ${n}, we're hiring and your background caught my eye. Open to a chat?` },
  { mine: "Looking for co-founder", theirs: "Looking for co-founder", line: (n) => `You and ${n} are both looking for a co-founder.`, open: (n) => `Hi ${n}, looks like we're both after a co-founder. Coffee this week?` },
  { mine: "Building with AI", theirs: "Building with AI", line: () => `You're both building with AI.`, open: (n) => `Hi ${n}, what are you building with AI? I'm stuck on evals and want to compare notes.` },
  { mine: "New in town", theirs: "New in town", line: () => `You're both new in town.`, open: (n) => `Hi ${n}, I'm new here too. What's the best thing you've found so far?` },
  { mine: "New in town", theirs: "Here to make friends", line: (n) => `You're new here, and ${n} likes meeting people.`, open: (n) => `Hi ${n}, I just moved here. What should I not miss?` },
  { mine: "Raising seed", theirs: "Happy to mentor", line: (n) => `${n} enjoys helping founders who are mid-raise.`, open: (n) => `Hi ${n}, I'm mid-raise and could use a second opinion.` },
  { mine: "Finding customers", theirs: "Finding customers", line: () => `You're both out finding customers.`, open: (n) => `Hi ${n}, want to swap notes on finding first customers?` },
];
