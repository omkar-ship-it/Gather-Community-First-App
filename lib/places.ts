import { COMMUNITIES, GROUPS, makeEvents } from "./data";

/** What a shared link is about, for its preview. */
export function place(id: string) {
  const g = GROUPS.find((x) => x.id === id);
  const c = COMMUNITIES.find((x) => x.id === (g?.communityId ?? id));
  if (!c) return null;
  return { title: g?.name ?? c.name, line: g ? `A group in ${c.name}` : c.blurb, hue: c.hue };
}
export function happening(id: string) {
  const e = makeEvents(0).find((x) => x.id === id);
  if (!e) return null;
  const c = COMMUNITIES.find((x) => x.id === e.communityId);
  return { title: e.title, line: c ? `With ${c.name}` : e.place, hue: c?.hue ?? 318 };
}
export const placeIds = () => [...COMMUNITIES, ...GROUPS].map((x) => ({ id: x.id }));
export const eventIds = () => makeEvents(0).map((x) => ({ id: x.id }));
