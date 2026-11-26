# Gather

A mobile-first, community-first experience, as a clickable prototype. No backend: every person, community, message and payment is invented and resets on reload.

```bash
npm install
npm run dev
```

Open it on a phone, or on a desktop where it sits in a handset.

## The number plan (`lib/ids.ts`)

One universal number per person, for life, tied to one mobile and one email. Either can be replaced; the number never changes. People choose it themselves (`lib/numbers.ts`): every number on offer is valid, and its price comes from a pattern anyone can see in the digits. It must never be made from a mobile number, so the picker refuses digits from your own.

The picker shows numbers being taken by other people. Here that is simulated; in a real product a number may only go when somebody really takes it.

| Starts with | Is | Digits | Room for |
| --- | --- | --- | --- |
| 2–5 | a person, last digit is a check digit | 11 | 4 billion |
| 1 | a person, issued once those fill up | 12 | 10 billion more |
| 6 | a community | 9 | 100 million |
| 7 | a group | 9 | 100 million |
| 8–9 | a PIN | 6 | 200,000 open at once |
| 0 | a PIN, for busy hours | 7 | a million more |

Numbers are permanent, PINs are not. There are only a million six-digit numbers, so nobody keeps one: an event holds a PIN from an hour before it starts until it ends, and a community or group can open one for an hour. The first digit fixes the length, so longer numbers can be added later without changing an existing one.

Written down, numbers carry a mark (`@482 9104 4076`, `#680 421 907`, `*992 104`) that never has to be typed. Links: `/?id=680421907`, `/?e=e1`.

## Hierarchy

A community is its groups. Both levels have the same shape, so nothing has to be learnt twice.

- **Community**: Groups, Feed, People, Events. Groups holds Announcements (only hosts post), the groups you're in, the ones you can join, and Add group. It shows who's inside a group before you join it, and scales to dozens with sections and search.
- **Group**: its own Feed, People and Events. The arrows in its header jump to a sibling group.
- There is no chat in communities: conversation is replies under a post.

A community has a kind (run club, professional, alumni, café, work, gym, restaurant, interest), is run by a person or a business (`biz`), and is free or paid (`plan`). A group inside can be open, by request (`ask`) or paid on its own. `components/Start.tsx` makes a new one. Memberships renew and stop in one tap; payments are simulated.

`act.go` is the way to jump anywhere; `State.spot` remembers the tab each place was left on. Moments that deserve more than a toast live in `components/Peaks.tsx`.

## Hosting (`lib/host.ts`, `components/Host.tsx`)

A host's week is the same five jobs in a run club, a gym, a cafe or an alumni network. The **desk** puts them on one screen, each done in one tap, and says "Desk clear" when nothing needs the host.

- **At the door:** each request shows the person's answer to the host's one question and who they already know inside. *Let in* or *Not now*. Nobody is ever told no.
- **New this week:** everyone new is welcomed by name in a single post.
- **Next up:** shows how full the next event is. *Save them a spot* sends a personal note to regulars who haven't said yes, and the seats fill as they reply.
- **Gone quiet:** a *Miss you* note goes to anyone who stopped coming. Their reply comes back as a nudge.
- **Hand over a key:** suggests a regular who could lead a group, so the community has more than one host.
- **Door mode:** on event night the host ticks people in. First-timers are highlighted so the host greets them by name. *Close the door* posts a **roll call** with every face that came and tells the people who missed it that they were missed.
- **Milestones:** reaching 60 or 100 members stops the app for a moment, with an offer to tell everyone.
- **Standing** comes from showing up, not posting: New, Familiar face, Regular, Pillar. It appears on People.

In the demo you co-host Sunday Runners (run club) and own Corner Table Club (cafe). Both desks are also on Home.

## WhatsApp Business

A host brings a WhatsApp audience in without connecting anything (`components/MoveIn.tsx`): WhatsApp opens with the invite written, they pick their broadcast list and press send. Customers ask the business questions back on WhatsApp. Arrivals are simulated. Share links (`/c/<number>`, `/e/<event>`) carry their own preview image (`lib/card.tsx`).

## Where things are

- `lib/data.ts` people, communities, events and the "why you two should talk" pairings
- `lib/store.tsx` all state and actions
- `lib/numbers.ts` the numbers people choose from
- `components/` Onboarding, Pick, Dial, Community, Tabs (the three modules), Screens, Sheets
