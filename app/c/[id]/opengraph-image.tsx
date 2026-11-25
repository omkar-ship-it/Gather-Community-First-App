import { card } from "@/lib/card";
import { place, placeIds } from "@/lib/places";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "On Gather";
export const generateStaticParams = placeIds;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const p = place((await params).id);
  return card(p?.title ?? "Gather", p?.line ?? "Dial in to your people", p?.hue ?? 318);
}
