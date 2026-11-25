# Gather

A mobile-first, community-first experience, as a clickable prototype. No backend: every person, community, message and payment is invented and resets on reload.

```bash
npm install
npm run dev
```

Open it on a phone, or on a desktop where it sits in a handset with a list of IDs to try.

## The number plan (`lib/ids.ts`)

One universal number per person, for life, tied to one mobile and one email. Either can be replaced; the number never changes. It is random, so it reveals neither.

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

## Where things are

- `lib/data.ts` people, communities, events and the "why you two should talk" pairings
- `lib/store.tsx` all state and actions
- `components/` Onboarding, Dial, Tabs (the three modules), Screens, Sheets
