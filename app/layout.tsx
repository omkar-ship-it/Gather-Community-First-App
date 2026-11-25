import type { Metadata, Viewport } from "next";
import { DM_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const ui = Hanken_Grotesk({ variable: "--font-ui", subsets: ["latin"] });
const digits = DM_Mono({ variable: "--font-digits", weight: ["400", "500"], subsets: ["latin"] });

export const metadata: Metadata = { title: "Gather", description: "Dial in to your people. A community-first experience, in prototype." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F7F4F6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${digits.variable}`}>
      <body>{children}</body>
    </html>
  );
}
