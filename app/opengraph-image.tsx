import { ImageResponse } from "next/og";

// The link preview for every storefront page (hotel directory, hotel pages, room links).
// Rendered once at build time.

export const alt = "Stumar Maspindzeli: the guest app for your stay. Room requests, dining, spa and a concierge, one tap away.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f3f2ed";
const PAGE = "#0f0f0e";
const LIME = "#e6fb2d";
const LIME_SOFT = "#e3ef7a";
const GRAPHITE = "#434343";
const INK = "#2d2d2d";

/** Red Hat Display / Caveat as TTF for the renderer. Falls back to the default font if offline. */
async function googleFont(family: string, weight: number, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

const BRAND = "Stumar Maspindzeli";
const EYEBROW = "Welcome in,";
const LINES = ["Everything for", "your stay,"];
const MARK = "one tap";
const END = "away";
const PILLS = ["Room requests", "Dining", "Spa", "Concierge"];

export default async function Image() {
  const display = await googleFont("Red+Hat+Display", 500, [BRAND, ...LINES, MARK, END, ...PILLS].join(""));
  const script = await googleFont("Caveat", 500, EYEBROW);
  const fonts = [
    ...(display ? [{ name: "Red Hat Display", data: display, weight: 500 as const, style: "normal" as const }] : []),
    ...(script ? [{ name: "Caveat", data: script, weight: 500 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAGE,
          color: PAPER,
          fontFamily: "Red Hat Display",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          {/* Logo: the app icon's four dots, then the name. */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", width: 34, gap: 6 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 999, background: PAPER }} />
              ))}
            </div>
            <div style={{ fontSize: 28, letterSpacing: -0.5 }}>{BRAND}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Caveat",
                fontSize: 44,
                color: "rgba(243,242,237,0.6)",
                transform: "rotate(-2deg)",
                marginBottom: 6,
              }}
            >
              {EYEBROW}
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 82, lineHeight: 1.04, letterSpacing: -3 }}>
              {LINES.map((line) => (
                <div key={line} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", position: "relative" }}>
                  <svg
                    width="330"
                    height="130"
                    viewBox="0 0 200 80"
                    preserveAspectRatio="none"
                    style={{ position: "absolute", left: -26, top: -20 }}
                  >
                    <path
                      d="M26 46C18 22 88 6 150 12c46 5 48 40 10 52-42 13-116 12-140-6C2 44 30 22 70 16c34-5 80-2 106 10"
                      fill="none"
                      stroke={LIME_SOFT}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {MARK}
                </div>
                <div style={{ display: "flex", marginLeft: 34 }}>{END}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {PILLS.map((pill) => (
              <div
                key={pill}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "#22221f",
                  fontSize: 22,
                  color: "rgba(243,242,237,0.75)",
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </div>

        {/* The brand mark from the intro: four tiles, four glyphs. */}
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 332, gap: 12, transform: "rotate(-6deg)" }}>
            <Tile bg={PAPER}>
              <svg width="72" height="72" viewBox="0 0 24 24">
                <path fill={INK} d="M12 0c.9 6.6 4.8 10.6 12 12-7.2 1.4-11.1 5.4-12 12-.9-6.6-4.8-10.6-12-12C7.2 10.6 11.1 6.6 12 0Z" />
              </svg>
            </Tile>
            <Tile bg={LIME}>
              <svg width="68" height="68" viewBox="0 0 24 24" fill={INK}>
                <circle cx="7" cy="7" r="5.5" />
                <circle cx="17" cy="7" r="5.5" />
                <circle cx="7" cy="17" r="5.5" />
                <circle cx="17" cy="17" r="5.5" />
                <rect x="7" y="7" width="10" height="10" />
              </svg>
            </Tile>
            <Tile bg={GRAPHITE}>
              <svg width="68" height="68" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="none" stroke={LIME} strokeWidth="6" />
              </svg>
            </Tile>
            <Tile bg={LIME_SOFT}>
              <svg width="64" height="64" viewBox="0 0 24 24">
                <path fill={INK} d="M2 2h12a8 8 0 0 1 8 8v12H10a8 8 0 0 1-8-8V2Z" />
              </svg>
            </Tile>
          </div>
        </div>
      </div>
    ),
    // An empty `fonts` list would drop the built-in font too, so only pass it when something loaded.
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) },
  );
}

function Tile({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 160,
        height: 160,
        borderRadius: 40,
        background: bg,
      }}
    >
      {children}
    </div>
  );
}
