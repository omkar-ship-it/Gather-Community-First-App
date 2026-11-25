import type { Metadata } from "next";
import App from "@/components/App";
import { place, placeIds } from "@/lib/places";

export const generateStaticParams = placeIds;
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = place((await params).id);
  return p ? { title: p.title, description: p.line, openGraph: { title: p.title, description: p.line, siteName: "Gather" }, twitter: { card: "summary_large_image" } } : {};
}

export default function Page() {
  return <App />;
}
