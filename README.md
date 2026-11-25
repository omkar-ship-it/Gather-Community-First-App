# Gather

A mobile-first, community-first experience, as a clickable prototype. No backend: every person, community, message and payment is invented and resets on reload.

```bash
npm install
npm run dev
```

Open it on a phone, or on a desktop where it sits in a handset with a list of IDs to try.

## The number plan (`lib/ids.ts`)

Numbers are unique within a city, like phone numbers within an area code. From another city, dial 0 and its three-digit code first. The first digit says what you're dialling.

| Starts with | Is | Digits | Room for, with 1,000 city codes |
| --- | --- | --- | --- |
| 0 | another city | 0 + 3 | |
| 1 | reserved | | |
| 2–5 | a person, last digit is a check digit | 9 | 40 billion |
| 6 | an online community, same in every city | 8 | 10 million |
| 7 | a group | 8 | 10 billion |
| 8 | a community | 6 | 100 million, 100,000 per city code |
| 9 | a live room, reused after the event | 6 | 100 million open at once |

Written down, numbers carry a mark (`@482 910 440`, `#804 219`, `*992 104`) because any bare run of digits is a phone number somewhere. The marks never have to be typed. City codes here are invented and are not STD codes. A large metro can hold several codes.

Any number is also a link: `/?id=0418804219`.

## Where things are

- `lib/data.ts` people, communities, events and the "why you two should talk" pairings
- `lib/store.tsx` all state and actions
- `components/` Onboarding, Dial, Tabs (the three modules), Screens, Sheets
