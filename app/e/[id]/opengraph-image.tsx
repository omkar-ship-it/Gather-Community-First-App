import { card } from "@/lib/card";
import { happening, eventIds } from "@/lib/places";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "On Gather";
export const generateStaticParams = eventIds;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const p = happening((await params).id);
  return card(p?.title ?? "Gather", p?.line ?? "Dial in to your people", p?.hue ?? 318);
}
