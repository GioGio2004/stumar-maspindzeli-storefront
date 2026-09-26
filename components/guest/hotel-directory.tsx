"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import type { api } from "@/lib/convex/api";
import { cn } from "@/lib/utils";
import { Clover, Dots, Leaf, PetalX, Ring, Star4 } from "./glyphs";
import { notchMask } from "./notch";
import { Scribble } from "./scribble";

// The storefront's front door: every hotel, each linking to its guest app.
// Live, so a hotel created in the admin shows up here without a redeploy.
//
// First visit per session plays an intro: the four brand glyphs pop in as one
// 2x2 mark, the mark grows until its quarters fill the screen, then the
// quarters slide apart like lift doors onto the list. Any tap or key skips it.

type Hotel = { name: string; brandName?: string; slug: string };
type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const ease = [0.22, 1, 0.36, 1] as const;
const doorEase = [0.76, 0, 0.24, 1] as const;

const INTRO_MS = 1950; // until the doors start to open
const SEEN_KEY = "stumar:intro-seen";
const HALF = 66; // half the size of the 2x2 mark, px

// `corner` pins each glyph to the middle of the screen; `origin` lets it grow from there.
const DOORS: { bg: string; fg: string; Glyph: Glyph; corner: string; origin: string; x: string; y: string }[] = [
  { bg: "bg-ink", fg: "text-on-ink-accent", Glyph: Star4, corner: "bottom-0 right-0", origin: "100% 100%", x: "-101%", y: "-4%" },
  { bg: "bg-lime", fg: "text-black", Glyph: Clover, corner: "bottom-0 left-0", origin: "0% 100%", x: "101%", y: "-4%" },
  { bg: "bg-graphite", fg: "text-lime", Glyph: Ring, corner: "top-0 right-0", origin: "100% 0%", x: "-101%", y: "4%" },
  // Lime-soft keeps its dark glyph in both themes, and stands off white and near-black pages alike.
  { bg: "bg-lime-soft", fg: "text-[#2d2d2d]", Glyph: Leaf, corner: "top-0 left-0", origin: "0% 0%", x: "101%", y: "4%" },
];

// Each hotel card gets a mark from the same family, in turn.
const MARKS: { bg: string; fg: string; Glyph: Glyph }[] = [
  { bg: "bg-ink", fg: "text-on-ink-accent", Glyph: Star4 },
  { bg: "bg-lime", fg: "text-black", Glyph: Clover },
  { bg: "bg-graphite", fg: "text-lime", Glyph: Ring },
  { bg: "bg-white", fg: "text-ink", Glyph: Leaf },
  { bg: "bg-ink", fg: "text-on-ink-accent", Glyph: PetalX },
];

const rise = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { delay, duration: 0.7, ease } },
});

export function HotelDirectory({ preloaded }: { preloaded: Preloaded<typeof api.guest.storefront.directory> }) {
  const hotels = usePreloadedQuery(preloaded);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "intro" | "open">("idle");
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    const skip = seen || reduce === true;
    const start = setTimeout(() => {
      setPlayed(!skip);
      setPhase(skip ? "open" : "intro");
    }, 0);
    const open = skip ? undefined : setTimeout(() => setPhase("open"), INTRO_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(open);
    };
  }, [reduce]);

  // Any tap or key opens the doors straight away.
  useEffect(() => {
    if (phase !== "intro") return;
    const skip = () => setPhase("open");
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }, [phase]);

  const open = phase === "open";
  // After the intro, start while the doors are still parting.
  const base = played ? 0.3 : 0;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{phase === "intro" && <Doors key="doors" />}</AnimatePresence>

      <motion.main
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16 pt-5 sm:px-8 sm:pt-8"
        initial="hidden"
        animate={open ? "shown" : "hidden"}
        inert={!open}
      >
        <motion.header variants={rise(base)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Dots className="size-4" />
            Stumar Maspindzeli
          </span>
          <span className="rounded-full bg-panel px-3 py-1.5 text-[13px] text-black/60">
            {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
          </span>
        </motion.header>

        <motion.p
          variants={rise(base + 0.05)}
          className="mt-14 inline-block -rotate-2 self-start font-script text-[26px] text-black/60 sm:mt-20 sm:text-[30px]"
        >
          Welcome in,
        </motion.p>
        <h1 className="mt-1 text-[46px] font-medium leading-[1.02] tracking-[-0.035em] sm:text-7xl">
          <Word delay={base + 0.1}>Choose</Word> <Word delay={base + 0.17}>your</Word>{" "}
          <span className="relative inline-block">
            {open && <Scribble className="-inset-x-[12%] -inset-y-[22%] h-[144%] w-[124%]" delay={base + 0.55} />}
            <Word delay={base + 0.24}>hotel</Word>
          </span>
        </h1>
        <motion.p variants={rise(base + 0.35)} className="mt-4 max-w-md text-[15px] leading-relaxed text-black/60">
          Staying with us? Tap the tag in your room for your own guest page. You can look around any hotel here.
        </motion.p>

        {hotels.length === 0 ? (
          <motion.p variants={rise(base + 0.45)} className="mt-10 rounded-[26px] bg-panel p-6 text-[15px] text-black/55">
            No hotels yet.
          </motion.p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12">
            {hotels.map((hotel, i) => (
              <HotelCard key={hotel.slug} hotel={hotel} index={i} delay={base + 0.45 + i * 0.09} />
            ))}
          </ul>
        )}
      </motion.main>
    </MotionConfig>
  );
}

/** The intro. Mounted only on the client, after the first frame. */
function Doors() {
  // Percent insets that frame a 2*HALF square in the middle of this viewport.
  const [clip] = useState(() => {
    const x = ((window.innerWidth / 2 - HALF) / window.innerWidth) * 100;
    const y = ((window.innerHeight / 2 - HALF) / window.innerHeight) * 100;
    return {
      closed: "inset(50% 50% 50% 50% round 22px)",
      mark: `inset(${y}% ${x}% ${y}% ${x}% round 22px)`,
      full: "inset(0% 0% 0% 0% round 22px)",
    };
  });
  const brand = "Stumar Maspindzeli";

  return (
    // Catches the skip tap, so it can't land on a (still invisible) hotel card underneath.
    <motion.div className="fixed inset-0 z-50" aria-hidden="true">
      <motion.div
        className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5"
        initial={{ clipPath: clip.closed }}
        animate={{ clipPath: [clip.closed, clip.mark, clip.mark, clip.full] }}
        transition={{ delay: 0.1, duration: 1.6, times: [0, 0.3, 0.6, 1], ease: ["backOut", "linear", doorEase] }}
      >
        {DOORS.map(({ bg, fg, Glyph, corner, origin, x, y }, i) => (
          <motion.div
            key={i}
            className={cn("relative rounded-[22px]", bg)}
            exit={{ x, y, transition: { duration: 0.85, ease: doorEase, delay: i < 2 ? 0 : 0.05 } }}
          >
            <motion.span
              className={cn("absolute grid size-[63px] place-items-center", corner)}
              style={{ transformOrigin: origin }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1, 1.9] }}
              transition={{ delay: 0.1, duration: 1.6, times: [0, 0.6, 1], ease: doorEase }}
            >
              <motion.span
                className={cn("block", fg)}
                initial={{ scale: 0, rotate: -135 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.5, rotate: 90, opacity: 0, transition: { duration: 0.5, ease: doorEase } }}
                transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 260, damping: 15 }}
              >
                <Glyph className="size-7" />
              </motion.span>
            </motion.span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="absolute inset-x-0 flex justify-center text-sm font-medium tracking-tight text-black/60"
        style={{ top: `calc(50% + ${HALF + 26}px)` }}
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 1.25, times: [0, 0.8, 1] }}
        exit={{ opacity: 0 }}
      >
        {brand.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              className="inline-block whitespace-pre"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ delay: 0.35 + i * 0.022, duration: 0.5, ease }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </motion.p>
    </motion.div>
  );
}

function Word({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
      <motion.span
        className="inline-block"
        variants={{ hidden: { y: "110%" }, shown: { y: "0%", transition: { delay, duration: 0.85, ease } } }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** A ticket-style card, dealt onto the table. */
function HotelCard({ hotel, index, delay }: { hotel: Hotel; index: number; delay: number }) {
  const mark = MARKS[index % MARKS.length];
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 90, rotate: index % 2 ? 5 : -5, scale: 0.94 },
        shown: {
          opacity: 1,
          y: 0,
          rotate: 0,
          scale: 1,
          transition: { delay, type: "spring", stiffness: 190, damping: 22, opacity: { delay, duration: 0.3 } },
        },
      }}
    >
      <Link
        href={`/h/${hotel.slug}`}
        style={notchMask(["left", "right"], { length: 44, depth: 10 })}
        className="group flex items-center gap-4 rounded-[26px] bg-panel py-3.5 pl-5 pr-5 transition-[background-color,transform] hover:bg-panel-hover active:scale-[0.985] sm:gap-5 sm:py-4 sm:pl-6 sm:pr-6"
      >
        <span
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-[18px] transition-transform duration-500 ease-out group-hover:rotate-90 sm:size-16",
            mark.bg,
          )}
        >
          <mark.Glyph className={cn("size-6", mark.fg)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xl font-medium tracking-tight sm:text-2xl">
            {hotel.brandName ?? hotel.name}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-black/45">
            {hotel.brandName ? `${hotel.name} · ` : ""}/h/{hotel.slug}
          </span>
        </span>
        <span className="hidden font-script text-2xl text-black/30 sm:block">{String(index + 1).padStart(2, "0")}</span>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-lime group-hover:text-black">
          <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </Link>
    </motion.li>
  );
}
