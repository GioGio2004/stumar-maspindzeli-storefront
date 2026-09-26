"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { MotionConfig, motion, type Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { api } from "@/lib/convex/api";
import { cn } from "@/lib/utils";
import { Clover, Dots, Leaf, PetalX, Ring, Star4 } from "./glyphs";
import { notchMask } from "./notch";
import { Scribble } from "./scribble";

// The storefront's front door: every hotel, each linking to its guest app.
// Live, so a hotel created in the admin shows up here without a redeploy.
// It mounts as the intro's doors open (components/guest/intro.tsx), so the
// headline and cards reveal while the doors part.

type Hotel = { name: string; brandName?: string; slug: string };
type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const ease = [0.22, 1, 0.36, 1] as const;

/** Lets the doors clear a little before the first line rises. */
const BASE = 0.25;

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

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16 pt-5 sm:px-8 sm:pt-8"
        initial="hidden"
        animate="shown"
      >
        <motion.header variants={rise(BASE)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Dots className="size-4" />
            Stumar Maspindzeli
          </span>
          <span className="rounded-full bg-panel px-3 py-1.5 text-[13px] text-black/60">
            {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
          </span>
        </motion.header>

        <motion.p
          variants={rise(BASE + 0.05)}
          className="mt-14 inline-block -rotate-2 self-start font-script text-[26px] text-black/60 sm:mt-20 sm:text-[30px]"
        >
          Welcome in,
        </motion.p>
        <h1 className="mt-1 text-[46px] font-medium leading-[1.02] tracking-[-0.035em] sm:text-7xl">
          <Word delay={BASE + 0.1}>Choose</Word> <Word delay={BASE + 0.17}>your</Word>{" "}
          <span className="relative inline-block">
            <Scribble className="-inset-x-[12%] -inset-y-[22%] h-[144%] w-[124%]" delay={BASE + 0.55} />
            <Word delay={BASE + 0.24}>hotel</Word>
          </span>
        </h1>
        <motion.p variants={rise(BASE + 0.35)} className="mt-4 max-w-md text-[15px] leading-relaxed text-black/60">
          Staying with us? Tap the tag in your room for your own guest page. You can look around any hotel here.
        </motion.p>

        {hotels.length === 0 ? (
          <motion.p variants={rise(BASE + 0.45)} className="mt-10 rounded-[26px] bg-panel p-6 text-[15px] text-black/55">
            No hotels yet.
          </motion.p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12">
            {hotels.map((hotel, i) => (
              <HotelCard key={hotel.slug} hotel={hotel} index={i} delay={BASE + 0.45 + i * 0.09} />
            ))}
          </ul>
        )}
      </motion.main>
    </MotionConfig>
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
