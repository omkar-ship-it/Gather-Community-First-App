/** Everything here is invented, for the prototype. */
export type Person = { id: string; name: string; headline: string; bio: string; intents: string[]; askMe: string; skills: string[]; city: string; hue: number; zone: string };
/** A business that hosts a community. `wa` is its WhatsApp Business number, digits with country code; empty until the host adds one. */
export type Biz = { kind: string; opens: number; closes: number; wa: string; catalogue: string };
/** What a community is for. It decides the words, the starting groups and what's on the front. */
export type CKind = "Run club" | "Professional" | "Alumni" | "Café" | "Work" | "Gym" | "Restaurant" | "Interest";
/** What membership costs, for a community or for one group inside it. Free ones have none. */
export type Plan = { price: number; per: "month" | "year"; gets: string[] };
export type Community = { kind: CKind; plan?: Plan; secret?: boolean; id: string; online?: boolean; place?: string; name: string; blurb: string; about: string; hue: number; glyph: string; members: string[]; size: number; joined: boolean; open: boolean; hosts: string[]; biz?: Biz };
/** `fits` are the reasons someone would want this group, so the right ones are offered first. */
export type Group = { id: string; communityId: string; name: string; topic: string; size: number; joined: boolean; members: string[]; fits: string[]; muted?: boolean; by?: string; /** Where it sits in a long list: Classes, Cities. */ sect?: string; /** Someone inside says yes to each person. */ ask?: boolean; plan?: Plan };
export type Comment = { by: string; text: string };
/** Whole community by default; `groupId` narrows it to one group, `announce` is a host speaking to everyone. */
export type Post = { id: string; communityId: string; groupId?: string; announce?: boolean; /** Everyone who came, on a roll call. */ crew?: string[]; seen?: number; by: string; at: number; text: string; likes: number; liked: boolean; tag?: string; poll?: { q: string; options: { label: string; votes: number }[]; voted: number | null }; comments: Comment[]; eventId?: string };
export type Msg = { id: string; by: string; text: string; at: number; kind?: "note" };
export type Event = { id: string; groupId?: string; repeats?: string; inside: number; communityId: string; title: string; blurb: string; place: string; startsAt: number; endsAt: number; price: number; room: string; host: string; going: string[]; seats: number; ticket: boolean; dissolved: boolean };
/** One number per person, tied to one mobile and one email. Either can be replaced; the number never changes. */
export type Me = { id: string; zone: string; name: string; headline: string; intents: string[]; hue: number; mobile: string; email: string; emailOk: boolean; why?: string };

export const INTENTS = [
  "Raising seed", "Angel investing", "Hiring", "Open to work", "Looking for co-founder", "Happy to mentor",
  "New in town", "Here to make friends", "Running buddies", "Building with AI", "Design feedback", "Finding customers",
];

const p = (id: string, name: string, headline: string, bio: string, intents: string[], askMe: string, skills: string[], city: string, hue: number, zone = "Bengaluru"): Person => ({ id, name, headline, bio, intents, askMe, skills, city, hue, zone });

export const PEOPLE: Person[] = [
  p("31904472311", "Rohan Iyer", "Angel, ex-payments founder", "Sold a payments company in 2022. Now writes small first cheques and answers long emails.", ["Angel investing", "Happy to mentor"], "What a first cheque is really betting on", ["Fundraising", "Fintech", "Hiring"], "HSR Layout", 24),
  p("25518306683", "Ananya Rao", "Head of design, Lumen Health", "Designs for clinics with bad wifi. Looking for two designers who like messy problems.", ["Hiring", "Design feedback"], "Designing for people in a hurry", ["Product design", "Research"], "Indiranagar", 330),
  p("47731920156", "Kabir Sethi", "Backend engineer, between jobs", "Ten years of making slow things fast. Taking a month off, then picking carefully.", ["Open to work", "Building with AI"], "Why your database is fine, actually", ["Postgres", "Go", "Infra"], "Koramangala", 205),
  p("38260415924", "Meher Contractor", "Runs a ceramics studio", "Teaches beginners on weekends. Will talk glaze chemistry until you leave.", ["Here to make friends", "Finding customers"], "The kiln that ruined Diwali", ["Teaching", "Retail"], "Jayanagar", 12),
  p("54103387403", "Dev Pillai", "Marathoner, school teacher", "Ran eleven marathons, none of them quickly. Plans the Sunday routes.", ["Running buddies", "New in town"], "Running your first 10K without hating it", ["Coaching", "Maps"], "HSR Layout", 140),
  p("22847619537", "Sara Thomas", "Founder, Fieldnote", "Building notes for people who work outdoors. Raising a seed round.", ["Raising seed", "Finding customers"], "Selling software to farms", ["GTM", "Product"], "Whitefield", 275),
  p("41679053260", "Imran Qureshi", "Mobile engineer, weekend baker", "Ships apps on weekdays, sourdough on Sundays.", ["Looking for co-founder", "Building with AI"], "Offline-first apps", ["iOS", "Android"], "Bellandur", 48),
  p("36025841840", "Lakshmi Nair", "Community lead, writer", "Keeps groups alive past week three. Moved here in March.", ["New in town", "Happy to mentor"], "Why most groups die at 40 people", ["Community", "Writing"], "HSR Layout", 355),
  p("33841506796", "Zoya Merchant", "Illustrator, makes field guides", "Draws birds for a living. Looking for someone who can turn a paper guide into an app.", ["Looking for co-founder", "New in town"], "Which crow that was", ["Illustration", "Publishing"], "Bandra, Mumbai", 190, "Mumbai"),
  p("29318406573", "Nikhil Bhat", "Product lead, Harbour Pay", "Banyan class of 2019. Moved to Pune for the food, stayed for the traffic stories.", ["Hiring", "Happy to mentor"], "Getting your first product job", ["Product", "Payments"], "Pune", 210),
  p("34107295864", "Farah Siddiqui", "Strength coach", "Coaches the 6am squad. Believes everyone can do one good pull-up.", ["Here to make friends", "Finding customers"], "Lifting after forty", ["Coaching", "Strength"], "Koramangala", 4),
  p("45873012643", "Arjun Menon", "Chef, Tamarind Kitchen", "Cooks what his grandmother wouldn't write down.", ["Finding customers", "Here to make friends"], "Why your dosa sticks", ["Cooking", "Hospitality"], "Indiranagar", 30),
  p("51294067386", "Priya Kulkarni", "COO, Northbay Logistics", "Banyan class of 2016. Runs operations for 900 people and one very small dog.", ["Happy to mentor", "Hiring"], "Your first hundred hires", ["Operations", "Scaling"], "Pune", 285),
  p("26780159430", "Joseph Mathew", "Data scientist, looking", "Banyan class of 2021. Models demand for a living, guesses dinner badly.", ["Open to work", "Building with AI"], "Forecasts that admit they're wrong", ["Data", "Python"], "Whitefield", 168),
  p("38956271404", "Tara Deshpande", "Designer, Nine Studio", "Draws maps of companies. Runs to think.", ["Running buddies", "Design feedback"], "Maps as arguments", ["Design", "Research"], "HSR Layout", 340),
];

const al = ["29318406573", "51294067386", "26780159430", "25518306683", "22847619537"];

export const COMMUNITIES: Community[] = [
  { kind: "Professional", id: "680421907", name: "HSR Founders Circle", blurb: "Founders within walking distance of each other", about: "A neighbourhood circle for people building companies in and around HSR. Honest numbers, warm intros, one dinner a month.", hue: 318, glyph: "circle", members: ["31904472311", "25518306683", "47731920156", "22847619537", "41679053260", "36025841840"], size: 214, joined: true, open: true, hosts: ["36025841840", "31904472311"] },
  { kind: "Run club", id: "681735042", name: "Sunday Runners", blurb: "Slow is a pace", about: "We meet at 6 on Sundays and nobody gets left behind. Coffee after, always.", hue: 150, glyph: "wave", members: ["54103387403", "36025841840", "38260415924", "41679053260", "25518306683", "31904472311"], size: 98, joined: true, open: true, hosts: ["54103387403", "me"] },
  { kind: "Café", id: "682906418", name: "Corner Table Club", blurb: "Regulars of a very small cafe", about: "For the people who already know the menu. First dibs on tastings, supper clubs and the window seat.", hue: 32, glyph: "grid", members: ["38260415924", "36025841840", "25518306683", "41679053260", "54103387403"], size: 58, joined: true, open: true, hosts: ["38260415924", "me"], biz: { kind: "Café", opens: 8, closes: 21, wa: "", catalogue: "" } },
  { kind: "Interest", id: "684611205", name: "Board Game Basement", blurb: "Someone always brings Catan", about: "Friday nights, long tables, no phones after nine. Beginners get the good chairs.", hue: 225, glyph: "dice", members: ["47731920156", "41679053260", "54103387403"], size: 131, joined: false, open: true, hosts: ["41679053260"] },
  { kind: "Interest", id: "687150361", name: "Second Shift", blurb: "Parents building things after bedtime", about: "Quiet co-working from 9pm, for people whose day starts again when the kids sleep.", hue: 262, glyph: "wave", members: ["22847619537", "25518306683", "31904472311"], size: 77, joined: false, open: false, hosts: ["22847619537"] },
  { kind: "Interest", id: "642208136", name: "Bandra Book Swap", place: "Mumbai", blurb: "Bring one, take one, stay for chai", about: "", hue: 188, glyph: "grid", members: ["33841506796"], size: 4120, joined: false, open: true, hosts: ["33841506796"] },
  { kind: "Professional", id: "618402755", online: true, name: "Makers Everywhere", blurb: "People making things, in every city", about: "", hue: 288, glyph: "dice", members: ["31904472311", "22847619537", "41679053260", "25518306683", "47731920156", "33841506796"], size: 1_240_318, joined: true, open: true, hosts: ["25518306683"] },
  { kind: "Alumni", id: "683017426", name: "Banyan Alumni", blurb: "Every class, every city, still in touch", about: "For graduates of Banyan Business School. Find anyone by class, city or company, and never ask 'does anyone know someone at' again.", hue: 160, glyph: "circle", members: al, size: 4286, joined: true, open: true, hosts: ["51294067386"] },
  { kind: "Gym", id: "689240175", name: "Ironwood Gym", blurb: "Small squads, heavy things", about: "Coached squads, open floor, and people who notice when you're missing.", hue: 8, glyph: "dice", members: ["34107295864", "54103387403", "38956271404", "47731920156"], size: 312, joined: false, open: true, hosts: ["34107295864"], plan: { price: 1800, per: "month", gets: ["Every open-floor hour", "Two coached classes a week", "The squad that texts when you skip"] }, biz: { kind: "Gym", opens: 5, closes: 22, wa: "", catalogue: "" } },
  { kind: "Restaurant", id: "685508293", name: "Tamarind Kitchen", blurb: "Eleven tables and a long memory", about: "Regulars get the off-menu nights, the first mangoes and a seat near the pass.", hue: 42, glyph: "grid", members: ["45873012643", "38260415924", "36025841840"], size: 540, joined: false, open: true, hosts: ["45873012643"], biz: { kind: "Restaurant", opens: 12, closes: 23, wa: "", catalogue: "" } },
  { kind: "Professional", id: "686372840", name: "The Operators Room", blurb: "People who run things, honestly", about: "Forty operators a city. Numbers shared in the room stay in the room.", hue: 226, glyph: "circle", members: ["51294067386", "31904472311", "29318406573", "36025841840"], size: 164, joined: false, open: true, hosts: ["51294067386"], plan: { price: 4999, per: "year", gets: ["A dinner of eight every month", "Salary and vendor benchmarks", "Introductions, made by a person"] } },
  { kind: "Work", id: "688815034", name: "Nine Studio, the team", blurb: "Work, without the work chat", about: "Only people with a Nine Studio email.", hue: 250, glyph: "grid", members: ["38956271404", "41679053260", "47731920156"], size: 23, joined: true, open: false, secret: true, hosts: ["38956271404"] },
];

const g = (id: string, communityId: string, name: string, topic: string, size: number, joined: boolean, members: string[], fits: string[] = [], more: Partial<Group> = {}): Group => ({ id, communityId, name, topic, size, joined, members, fits, ...more });

export const GROUPS: Group[] = [
  g("731806124", "680421907", "Fundraising", "Decks, terms, who's writing cheques", 61, true, ["31904472311", "22847619537", "41679053260"], ["Raising seed", "Angel investing"]),
  g("742117308", "680421907", "Hiring", "Roles in, people out", 88, true, ["25518306683", "47731920156", "36025841840"], ["Hiring", "Open to work"]),
  g("755390481", "680421907", "Monthly dinner", "Where, when, who's cooking", 34, false, ["36025841840", "25518306683", "31904472311"], ["Here to make friends", "New in town"]),
  g("758204913", "680421907", "Building with AI", "What works, what only demos well", 73, false, ["47731920156", "41679053260"], ["Building with AI", "Looking for co-founder"]),
  g("763028052", "681735042", "Routes", "This Sunday's map", 52, true, ["54103387403", "38260415924", "36025841840"], ["Running buddies"]),
  g("768841776", "681735042", "First 10K", "Beginners, all welcome", 27, false, ["36025841840", "54103387403"], ["New in town", "Running buddies"]),
  g("779215613", "682906418", "Today's specials", "What just came out of the oven", 41, true, ["38260415924", "25518306683", "36025841840"], ["Here to make friends", "Finding customers"]),
  g("771350628", "682906418", "Window seat", "Who's there now, and is there room", 19, false, ["36025841840", "38260415924"], ["Here to make friends", "New in town"]),
  g("705126880", "618402755", "Show your work", "One thing, half finished", 88_412, true, ["41679053260", "47731920156", "33841506796"], ["Building with AI", "Design feedback"]),
  g("716093354", "618402755", "Co-founder search", "Two people, one idea", 23_918, false, ["41679053260", "33841506796"], ["Looking for co-founder"]),
  g("790011422", "689240175", "6am squad", "Same people, same bar, every weekday", 18, false, ["34107295864", "54103387403"], ["Here to make friends", "Running buddies"], { plan: { price: 999, per: "month", gets: ["A coach who knows your numbers", "A place held for you, 6am"] } }),
  g("790025538", "689240175", "Open floor", "Who's in, and is the rack free", 204, false, ["47731920156", "38956271404"], ["Here to make friends"]),
  g("790036641", "689240175", "Comeback club", "After injury, after babies, after years", 41, false, ["34107295864", "38956271404"], ["New in town"]),
  g("790047713", "685508293", "Off-menu nights", "Announced at noon, full by one", 88, false, ["45873012643", "38260415924"], ["Here to make friends", "New in town"]),
  g("790058826", "685508293", "Cook with us", "Sunday mornings in the small kitchen", 34, false, ["45873012643", "36025841840"], ["Here to make friends"]),
  g("790069935", "686372840", "Dinner of eight", "Your table for this quarter", 40, false, ["51294067386", "31904472311"], ["Happy to mentor", "Hiring"]),
  g("790071048", "686372840", "Benchmarks", "Real numbers, no names", 164, false, ["29318406573", "51294067386"], ["Hiring", "Raising seed"]),
  g("790082157", "688815034", "Monday plan", "What each of us will finish", 23, true, ["38956271404", "41679053260", "47731920156"], []),
  g("790093264", "688815034", "Studio trips", "Where to, and who books", 23, true, ["38956271404", "47731920156"], []),
  g("790104371", "688815034", "New people", "First two weeks, held by hand", 6, false, ["38956271404"], [], { ask: true }),
  ...[["2019", 58, true], ["2016", 44, false], ["2017", 51, false], ["2018", 49, false], ["2020", 61, false], ["2021", 66, false], ["2022", 63, false], ["2023", 70, false], ["2024", 72, false], ["2015", 38, false], ["2014", 35, false], ["2013", 31, false]].map(([y, n, j], i) => g(`7911${String(10021 + i * 137)}`, "683017426", `Class of ${y}`, "Everyone who sat in those chairs", n as number, j as boolean, [al[i % 5], al[(i + 2) % 5]], [], { sect: "Classes", ask: !j })),
  ...[["Pune", 214, true], ["Bengaluru", 688, false], ["Mumbai", 431, false], ["Delhi", 302, false], ["Hyderabad", 187, false], ["Singapore", 96, false], ["London", 74, false]].map(([c, n, j], i) => g(`7922${String(10033 + i * 151)}`, "683017426", c as string, `Banyan people in ${c}`, n as number, j as boolean, c === "Pune" ? ["29318406573", "51294067386"] : [al[(i + 1) % 5], al[(i + 3) % 5]], c === "Bengaluru" ? ["New in town"] : [], { sect: "Cities" })),
  ...[["Founders", 268, "Raising seed"], ["Hiring and looking", 940, "Open to work"], ["Product leaders", 377, "Hiring"], ["Mentors", 152, "Happy to mentor"], ["Book circle", 63, "Here to make friends"]].map(([c, n, f], i) => g(`7933${String(10047 + i * 163)}`, "683017426", c as string, ["Building companies, comparing scars", "Roles and people, posted properly", "The craft, not the titles", "An hour a month, both ways", "One book, six weeks, no guilt"][i], n as number, false, [al[i % 5], al[(i + 1) % 5]], [f as string], { sect: "Interests" })),
  g("784660247", "684611205", "Friday table", "Who's in this week", 36, false, ["47731920156", "41679053260"], ["Here to make friends", "New in town"]),
  g("787412905", "684611205", "Rules lawyers", "Settle it here, not at the table", 22, false, ["41679053260", "54103387403"], []),
  g("792518067", "687150361", "Nine to eleven", "Tonight's quiet room", 31, false, ["22847619537", "31904472311"], ["Raising seed", "Building with AI"]),
  g("795640183", "642208136", "Chai after", "Where everyone ends up", 640, false, ["33841506796"], ["Here to make friends", "New in town"]),
];

const MIN = 60_000, H = 60 * MIN, D = 24 * H;

export function makeEvents(now: number): Event[] {
  const at = (days: number, hour: number) => { const d = new Date(now + days * D); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  /** The next time it's that weekday, never today. `wd` 8 means the next working day. */
  const next = (wd: number, hour: number) => { for (let k = 1; k < 9; k++) { const d = new Date(now + k * D).getDay(); if (wd === 8 ? d > 0 && d < 6 : d === wd) return at(k, hour); } return at(1, hour); };
  const base: Omit<Event, "inside">[] = [
    { id: "e1", communityId: "680421907", title: "Demo Night: six builders, six minutes", blurb: "Six people show something unfinished. The room asks real questions. No decks.", place: "The Loft, 27th Main, HSR", startsAt: now - 95 * MIN, endsAt: now + 14 * MIN, price: 0, room: "992104", host: "36025841840", going: ["31904472311", "25518306683", "47731920156", "22847619537", "41679053260", "36025841840"], seats: 60, ticket: false, dissolved: false },
    { id: "e2", communityId: "681735042", title: "Sunrise 10K and filter coffee", blurb: "Lake loop, two pace groups, one very long breakfast.", place: "Agara Lake, east gate", startsAt: next(0, 6), endsAt: next(0, 9), price: 199, repeats: "Every Sunday", room: "918273", host: "54103387403", going: ["54103387403", "36025841840", "41679053260", "34107295864", "22847619537"], seats: 40, ticket: false, dissolved: false },
    { id: "e3", communityId: "682906418", title: "Supper club: one table, twelve seats", blurb: "Five courses, one long table, and you sit next to someone new each course.", place: "Corner Table, back room", startsAt: at(6, 19), endsAt: at(6, 23), price: 1200, room: "940518", host: "38260415924", going: ["38260415924", "25518306683", "36025841840", "31904472311"], seats: 12, ticket: false, dissolved: false },
    { id: "e4", communityId: "680421907", title: "Pitch practice, kindly", blurb: "Ten minutes each. Two founders and one investor tell you what they heard.", place: "Community hall, Sector 2", startsAt: at(8, 18), endsAt: at(8, 20), price: 0, room: "953377", host: "31904472311", going: ["31904472311", "22847619537"], seats: 16, ticket: false, dissolved: false },
    { id: "e5", communityId: "684611205", title: "Catan, but friendly", blurb: "Four tables, one trophy made of cork.", place: "Basement, 14th Cross", startsAt: at(2, 20), endsAt: at(2, 23), price: 150, room: "966240", host: "41679053260", going: ["41679053260", "47731920156"], seats: 24, ticket: false, dissolved: false },
    { id: "e7", communityId: "681735042", groupId: "763028052", repeats: "Every Wednesday", title: "Easy 5K, talking pace", blurb: "If you can't chat, you're going too fast.", place: "Agara Lake, west gate", startsAt: next(3, 18), endsAt: next(3, 19), price: 0, room: "945512", host: "54103387403", going: ["54103387403", "41679053260"], seats: 60, ticket: false, dissolved: false },
    { id: "e8", communityId: "683017426", groupId: "792210033", title: "Pune dinner, all classes", blurb: "One long table. You sit by the year you were born, not the year you graduated.", place: "Koregaon Park, Pune", startsAt: at(4, 20), endsAt: at(4, 23), price: 850, room: "951136", host: "51294067386", going: ["51294067386", "29318406573"], seats: 40, ticket: false, dissolved: false },
    { id: "e9", communityId: "683017426", title: "Homecoming 2026", blurb: "Every class on the lawn. Name tags show your year, not your title.", place: "Banyan campus", startsAt: at(24, 10), endsAt: at(24, 18), price: 0, room: "957824", host: "51294067386", going: al, seats: 1200, ticket: false, dissolved: false },
    { id: "e10", communityId: "689240175", groupId: "790025538", repeats: "Every weekday", title: "Strength, coached", blurb: "Squat, press, pull. Ten people, one coach.", place: "Ironwood, main floor", startsAt: next(8, 7), endsAt: next(8, 8), price: 0, room: "962207", host: "34107295864", going: ["34107295864", "38956271404"], seats: 10, ticket: false, dissolved: false },
    { id: "e11", communityId: "685508293", groupId: "790047713", title: "First mangoes", blurb: "Seven courses, all of them mango, none of them dessert.", place: "Tamarind Kitchen", startsAt: at(5, 20), endsAt: at(5, 23), price: 1600, room: "971145", host: "45873012643", going: ["45873012643", "38260415924"], seats: 22, ticket: false, dissolved: false },
    { id: "e12", communityId: "688815034", groupId: "790082157", repeats: "Every Monday", title: "Monday plan", blurb: "Fifteen minutes, standing.", place: "The long desk", startsAt: next(1, 10), endsAt: next(1, 11), price: 0, room: "974480", host: "38956271404", going: ["38956271404", "41679053260"], seats: 23, ticket: false, dissolved: false },
    { id: "e13", communityId: "680421907", groupId: "731806124", title: "First-round office hours", blurb: "Bring the number you're most afraid of.", place: "The Loft, 27th Main, HSR", startsAt: at(3, 11), endsAt: at(3, 13), price: 0, room: "978031", host: "31904472311", going: ["31904472311", "22847619537"], seats: 12, ticket: false, dissolved: false },
    { id: "e14", communityId: "686372840", title: "Dinner of eight, November", blurb: "Eight people, one hard question each.", place: "A home in Indiranagar", startsAt: at(7, 19), endsAt: at(7, 22), price: 0, room: "981190", host: "51294067386", going: ["51294067386", "31904472311"], seats: 8, ticket: false, dissolved: false },
    { id: "e6", communityId: "618402755", title: "Show and tell, all cities", blurb: "Everyone shows one half-made thing. The room does the rest.", place: "Online", startsAt: now - 20 * MIN, endsAt: now + 46 * MIN, price: 0, room: "937420", host: "25518306683", going: ["25518306683", "47731920156", "41679053260", "31904472311", "33841506796", "22847619537"], seats: 10000, ticket: false, dissolved: false },
  ];
  return base.map((e) => ({ ...e, inside: e.id === "e6" ? 3412 : e.going.length }));
}

export function makePosts(now: number): Post[] {
  return [
    { id: "p0", communityId: "618402755", by: "47731920156", at: now - 35 * MIN, tag: "Near you", text: "Built a tiny thing that tells you why a query is slow in one sentence. It is wrong half the time. Who wants to break it?", likes: 2214, liked: false, comments: [] },
    { id: "a1", communityId: "680421907", announce: true, seen: 171, by: "36025841840", at: now - 40 * MIN, text: "Demo night is on now at the Loft. If you're new, come anyway: the first ten minutes are only hellos.", likes: 46, liked: false, eventId: "e1", comments: [] },
    { id: "a2", communityId: "681735042", announce: true, seen: 88, by: "54103387403", at: now - 30 * H, text: "Sunday starts at 6 sharp from the east gate. Nobody runs alone, ever.", likes: 31, liked: true, eventId: "e2", comments: [] },
    { id: "a3", communityId: "682906418", announce: true, seen: 49, by: "38260415924", at: now - 26 * H, text: "Supper club is back. Twelve seats, and members get the first day.", likes: 22, liked: false, eventId: "e3", comments: [] },
    { id: "a4", communityId: "618402755", announce: true, seen: 412_906, by: "25518306683", at: now - 20 * MIN, text: "Show and tell is live in every city. Bring one half-made thing.", likes: 18_204, liked: false, eventId: "e6", comments: [] },
    { id: "a7", communityId: "683017426", announce: true, seen: 3120, by: "51294067386", at: now - 2 * H, text: "Homecoming is on the lawn this year. Bring the person you lost touch with.", likes: 214, liked: false, eventId: "e9", comments: [] },
    { id: "a8", communityId: "689240175", announce: true, seen: 240, by: "34107295864", at: now - 9 * H, text: "New rack on the main floor. Be kind to it, it's shy.", likes: 41, liked: false, comments: [] },
    { id: "a9", communityId: "685508293", announce: true, seen: 388, by: "45873012643", at: now - 5 * H, text: "First mangoes came in this morning. Twenty-two seats, regulars first.", likes: 73, liked: false, eventId: "e11", comments: [] },
    { id: "a10", communityId: "686372840", announce: true, seen: 120, by: "51294067386", at: now - 1 * D, text: "New benchmarks are up: what 40 of us pay for the same five vendors.", likes: 38, liked: false, comments: [] },
    { id: "a11", communityId: "688815034", announce: true, seen: 21, by: "38956271404", at: now - 6 * H, text: "Studio closes early on Friday. Go see something good.", likes: 17, liked: false, comments: [] },
    { id: "b1", communityId: "683017426", groupId: "792210033", by: "29318406573", at: now - 25 * MIN, tag: "Hiring", text: "We're hiring two product managers in Pune. Banyan people skip the first round, because I'll vouch.", likes: 36, liked: false, comments: [{ by: "26780159430", text: "Does it have to be Pune?" }] },
    { id: "b2", communityId: "683017426", groupId: "791110021", by: "29318406573", at: now - 5 * H, text: "Found our first-week photo. Nobody has aged, several have shaved.", likes: 47, liked: false, comments: [] },
    { id: "b3", communityId: "683017426", by: "26780159430", at: now - 3 * H, tag: "Open to work", text: "Class of 2021, between jobs, happy to forecast anything. Who should I meet in Bengaluru?", likes: 58, liked: false, comments: [{ by: "51294067386", text: "Three people. Sending them your number." }] },
    { id: "b4", communityId: "689240175", groupId: "790011422", by: "34107295864", at: now - 11 * H, text: "Seven of you made it in the rain. I saw.", likes: 18, liked: false, comments: [] },
    { id: "b5", communityId: "689240175", groupId: "790025538", by: "38956271404", at: now - 90 * MIN, text: "Rack two is free till five.", likes: 6, liked: false, comments: [] },
    { id: "b6", communityId: "685508293", groupId: "790047713", by: "45873012643", at: now - 5 * H, text: "Tonight: crab, curry leaf, and an argument about coconut.", likes: 29, liked: false, comments: [] },
    { id: "b7", communityId: "686372840", groupId: "790071048", by: "29318406573", at: now - 8 * H, text: "Payment gateway fees, eleven companies, one very surprising outlier.", likes: 22, liked: false, comments: [] },
    { id: "b8", communityId: "688815034", groupId: "790082157", by: "38956271404", at: now - 50 * MIN, text: "This week: the atlas, and nothing else until the atlas.", likes: 9, liked: false, comments: [{ by: "41679053260", text: "Nothing else?" }, { by: "38956271404", text: "Nothing." }] },
    { id: "a5", communityId: "684611205", announce: true, seen: 97, by: "41679053260", at: now - 2 * D, text: "Doors at eight on Friday. Beginners get the good chairs.", likes: 28, liked: false, comments: [] },
    { id: "a6", communityId: "687150361", announce: true, seen: 60, by: "22847619537", at: now - 1 * D, text: "Same rule as always: say what you'll finish, then mute yourself.", likes: 19, liked: false, comments: [] },
    { id: "mine1", communityId: "680421907", groupId: "731806124", by: "me", at: now - 9 * H, tag: "Ask", text: "What should the first slide say if the product is hard to explain?", likes: 12, liked: false, comments: [{ by: "31904472311", text: "Say who cries when you turn it off. Then stop talking." }] },
    { id: "g1", communityId: "680421907", groupId: "731806124", by: "31904472311", at: now - 70 * MIN, tag: "Offer", text: "Two slots on Saturday for anyone raising their first round. Bring the number you're most afraid of.", likes: 24, liked: false, comments: [{ by: "22847619537", text: "Taking one. The number is churn." }] },
    { id: "g2", communityId: "680421907", groupId: "731806124", by: "22847619537", at: now - 26 * H, text: "Our one-pager got shorter and the replies got longer. Sharing the before and after.", likes: 33, liked: false, comments: [] },
    { id: "g3", communityId: "680421907", groupId: "742117308", by: "47731920156", at: now - 5 * H, tag: "Open to work", text: "I'm free from next month. Databases, slow things, calm teams. Happy to be interviewed by your whole office.", likes: 41, liked: false, comments: [] },
    { id: "g12", communityId: "680421907", groupId: "742117308", by: "25518306683", at: now - 4 * MIN, tag: "Offer", text: "Portfolio reviews tonight at 8, if anyone wants kind eyes on theirs.", likes: 9, liked: false, comments: [{ by: "47731920156", text: "Me please." }] },
    { id: "g13", communityId: "680421907", groupId: "731806124", by: "22847619537", at: now - 34 * MIN, tag: "Ask", text: "Has anyone raised from a fund that insists on a board seat at seed?", likes: 14, liked: false, comments: [{ by: "31904472311", text: "Walk. Politely." }, { by: "41679053260", text: "Seconded." }] },
    { id: "g14", communityId: "681735042", groupId: "763028052", by: "38260415924", at: now - 47 * MIN, tag: "Ask", text: "Is there a shorter option for the lazy?", likes: 11, liked: false, comments: [{ by: "54103387403", text: "There is always a shorter option." }] },
    { id: "g15", communityId: "682906418", groupId: "771350628", by: "36025841840", at: now - 70 * MIN, text: "Window seat is free till four.", likes: 6, liked: false, comments: [] },
    { id: "g4", communityId: "680421907", groupId: "755390481", by: "36025841840", at: now - 6 * H, text: "Three people have offered a terrace. One has a very good dog.", likes: 17, liked: false, comments: [] },
    { id: "g5", communityId: "680421907", groupId: "758204913", by: "41679053260", at: now - 2 * H, text: "Evals for a thing that has no right answer. How are you all doing it?", likes: 29, liked: false, comments: [] },
    { id: "g6", communityId: "681735042", groupId: "763028052", by: "38260415924", at: now - 7 * H, text: "The short loop now ends at the bakery instead of the gate. You're welcome.", likes: 19, liked: false, comments: [] },
    { id: "g7", communityId: "681735042", groupId: "768841776", by: "36025841840", at: now - 25 * H, text: "Week four. I ran past my own house and did not go in.", likes: 52, liked: false, comments: [] },
    { id: "g8", communityId: "682906418", groupId: "779215613", by: "38260415924", at: now - 3 * H, text: "Cardamom, burnt sugar, or both? I have dough for one tray.", likes: 14, liked: false, comments: [], poll: { q: "Tray", options: [{ label: "Cardamom", votes: 9 }, { label: "Burnt sugar", votes: 6 }, { label: "Both, please", votes: 17 }], voted: null } },
    { id: "g9", communityId: "618402755", groupId: "705126880", by: "33841506796", at: now - 4 * H, text: "Forty crows drawn, sixty to go. Number 31 is judging me.", likes: 3108, liked: false, comments: [] },
    { id: "g10", communityId: "684611205", groupId: "784660247", by: "47731920156", at: now - 18 * H, text: "Four for Friday. A fifth makes it a better game.", likes: 8, liked: false, comments: [] },
    { id: "g11", communityId: "618402755", groupId: "716093354", by: "33841506796", at: now - 9 * H, text: "I draw field guides. I need someone who dreams in apps.", likes: 811, liked: false, comments: [] },
    { id: "p1", communityId: "680421907", by: "22847619537", at: now - 22 * MIN, tag: "Ask", text: "Two investors asked me the same thing this week: why farms, why now? My answer takes four minutes. It needs to take one. Who wants to hear it and be rude about it?", likes: 18, liked: false, comments: [{ by: "31904472311", text: "Send me a voice note, I'll time you." }, { by: "36025841840", text: "Come early to demo night, we'll do it in the stairwell." }] },
    { id: "p2", communityId: "680421907", by: "25518306683", at: now - 3 * H, tag: "Hiring", text: "We're hiring two product designers. Clinics, bad wifi, real patients. If you like constraints more than concepts, write to me.", likes: 31, liked: false, comments: [{ by: "47731920156", text: "Sharing with two people who'd be great." }] },
    { id: "p3", communityId: "680421907", by: "36025841840", at: now - 8 * H, text: "Where should the November dinner be?", likes: 9, liked: false, poll: { q: "November dinner", options: [{ label: "Someone's terrace", votes: 14 }, { label: "The usual place", votes: 8 }, { label: "Somewhere new", votes: 11 }], voted: null }, comments: [] },
    { id: "p4", communityId: "681735042", by: "54103387403", at: now - 50 * MIN, text: "Sunday's loop avoids the flooded stretch. 9.6 km, so do a lap of the car park if you need the round number.", likes: 22, liked: true, eventId: "e2", comments: [{ by: "41679053260", text: "I always need the round number." }] },
    { id: "p5", communityId: "682906418", by: "38260415924", at: now - 5 * H, text: "The new mugs are out of the kiln. Forty made, thirty-six survived. Regulars get first pick from four today.", likes: 27, liked: false, comments: [] },
    { id: "p6", communityId: "684611205", by: "41679053260", at: now - 20 * H, text: "Reminder: the sheep meeple is still missing. No questions asked.", likes: 40, liked: false, comments: [] },
  ];
}

let seq = 0;
export const uid = () => `m${++seq}`;
const m = (by: string, text: string, at: number): Msg => ({ id: uid(), by, text, at });

/** Threads: d:<person>, r:<event>. A community has no chat: what people say there is a post. */
export function makeThreads(now: number): Record<string, Msg[]> {
  return {
    "d:33841506796": [m("33841506796", "Hi! Imran said you build things. I have a paper field guide that wants to be an app. Ten minutes?", now - 2 * H)],
    "r:e6": [m("33841506796", "Drew this on the train, be kind", now - 4 * MIN), m("47731920156", "The crow is perfect", now - 3 * MIN)],
    "d:31904472311": [m("31904472311", "Good to meet you at pitch practice. Send the one-page when it's ready.", now - 3 * H)],
    "d:36025841840": [m("me", "Thanks for the intro to Ananya!", now - 27 * H), m("36025841840", "That's the job. Coming Thursday?", now - 26 * H)],
    "r:e1": [m("36025841840", "Welcome in. Two demos left. Ask better questions than me.", now - 18 * MIN), m("41679053260", "That offline sync demo was unreal", now - 11 * MIN), m("25518306683", "Sara, I want to talk about your onboarding", now - 6 * MIN), m("22847619537", "Yes please, I'm by the window", now - 5 * MIN)],
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
