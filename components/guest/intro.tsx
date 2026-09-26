"use client";

import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { Clover, Leaf, Ring, Star4 } from "./glyphs";

// The guest app's loading screen, on every full load: a QR scan, an NFC tap,
// the installed app, or any link.
//
//   mark  the four brand glyphs pop in as one 2x2 mark (pure CSS, so it plays
//         from the first paint, before the JavaScript has loaded)
//   full  once the app is ready, the mark grows until its quarters fill the screen
//   open  the quarters slide apart like lift doors onto the page
//
// The page mounts at "open", so its own entrance animations play as the doors
// part. Any tap or key skips ahead. The mechanics live in globals.css (.intro).

type Phase = "mark" | "full" | "open" | "done";
type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const HOLD_MS = 250; // after the pop-in and the name have finished
const FALLBACK_MS = 3000; // in case the browser never runs the CSS animations (e.g. a hidden tab)
const FULL_MS = 850; // grow + a short hold
const OPEN_MS = 950;

const DOORS: { door: "tl" | "tr" | "bl" | "br"; bg: string; fg: string; Glyph: Glyph }[] = [
  { door: "tl", bg: "bg-ink", fg: "text-on-ink-accent", Glyph: Star4 },
  { door: "tr", bg: "bg-lime", fg: "text-black", Glyph: Clover },
  { door: "bl", bg: "bg-graphite", fg: "text-lime", Glyph: Ring },
  // Lime-soft keeps a dark glyph in both themes.
  { door: "br", bg: "bg-lime-soft", fg: "text-[#2d2d2d]", Glyph: Leaf },
];

const BRAND = "Stumar Maspindzeli";

export function Intro({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("mark");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The admin's live preview frames this app; show the page straight away there.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.self !== window.top) {
      const t = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(t);
    }
    // The app is ready (this effect runs after hydration). Grow once the pop-in,
    // which started at first paint, has played out.
    let started = false;
    const timers: number[] = [];
    const grow = () => {
      if (started) return;
      started = true;
      timers.push(window.setTimeout(() => setPhase((p) => (p === "mark" ? "full" : p)), HOLD_MS));
      timers.push(window.setTimeout(() => setPhase((p) => (p === "mark" || p === "full" ? "open" : p)), HOLD_MS + FULL_MS));
    };
    const running = ref.current?.getAnimations({ subtree: true }) ?? [];
    void Promise.all(running.map((a) => a.finished.catch(() => undefined))).then(grow);
    timers.push(window.setTimeout(grow, FALLBACK_MS));
    return () => {
      started = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (phase === "open") {
      const t = window.setTimeout(() => setPhase("done"), OPEN_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "done") return;
    const skip = () => setPhase("open");
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [phase]);

  const revealed = phase === "open" || phase === "done";

  return (
    <>
      {phase !== "done" && (
        <div ref={ref} className="intro" data-phase={phase} aria-hidden="true" onPointerDown={() => setPhase("open")}>
          <div className="intro-doors">
            {DOORS.map(({ door, bg, fg, Glyph }, i) => (
              <div key={door} className={cn("intro-door", bg)} data-door={door}>
                <span className="intro-glyph">
                  <span className={cn("intro-glyph-inner", fg)} style={{ "--d": `${0.2 + i * 0.07}s` } as CSSProperties}>
                    <Glyph className="size-7" />
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="intro-brand text-black/60">
            {BRAND.split("").map((ch, i) => (
              <span key={i}>
                <span style={{ "--i": i } as CSSProperties}>{ch}</span>
              </span>
            ))}
          </p>
        </div>
      )}
      {revealed && children}
    </>
  );
}
