import { ImageResponse } from "next/og";

/** The picture a link carries into WhatsApp: big, few words, readable at thumbnail size. */
export function card(title: string, line: string, hue: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: `hsl(${hue}, 46%, 26%)`, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, background: "#ffb627", color: "#1e1020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>g</div>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 92, height: 92, borderRadius: 46, marginLeft: -22, background: `hsl(${(hue + 50 + i * 70) % 360}, 46%, 48%)`, border: `8px solid hsl(${hue}, 46%, 26%)` }} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 26 ? 76 : 96, lineHeight: 1.04, letterSpacing: -3 }}>{title}</div>
          <div style={{ fontSize: 40, marginTop: 22, color: "rgba(255,255,255,0.85)" }}>{line}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
