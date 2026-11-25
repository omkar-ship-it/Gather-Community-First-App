# Gather

A mobile-first, community-first experience, as a clickable prototype. No backend: every person, community, message and payment is invented and resets on reload.

```bash
npm install
npm run dev
```

Open it on a phone, or on a desktop where it sits in a handset with a list of IDs to try.

## The ID system (`lib/ids.ts`)

One dial pad reaches everything. The first digit says what you're dialling.

| Starts with | Is | Digits |
| --- | --- | --- |
| 2–5 | a person | 8 |
| 7 | a group | 6 |
| 8 | a community | 6 |
| 9 | an event room, gone when the event ends | 6 |

Indian mobiles are 10 digits and start 6–9, so a person's ID is never mistaken for one. Any ID works as a link: `/?id=804219`.

## Where things are

- `lib/data.ts` people, communities, events and the "why you two should talk" pairings
- `lib/store.tsx` all state and actions
- `components/` Onboarding, Dial, Tabs (the three modules), Screens, Sheets
