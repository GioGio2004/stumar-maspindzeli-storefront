"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Clover, Dots, Ring, Star4 } from "./glyphs";

/** Shown when a room tag is unknown, disabled, or the room has no active stay. */
export function InactiveLink() {
  return (
    <main className="flex flex-1 items-center justify-center p-3 sm:p-6">
      <motion.section
        className="w-full max-w-xl rounded-[30px] bg-panel p-8 text-center sm:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-center gap-2">
          <Star4 className="size-9 text-ink" />
          <Clover className="size-9 text-white" />
          <Ring className="size-9 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">This room link isn&apos;t active</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-black/60">
          Your room&apos;s tag switches on at check-in. Please visit reception, or look around the resort in the
          meantime.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-5 pr-1.5 text-[15px] font-medium text-white"
        >
          Explore the hotel
          <span className="grid size-9 place-items-center rounded-full bg-lime text-black">
            <ArrowRight className="size-4" />
          </span>
        </Link>
        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-black/45">
          <Dots className="size-4" />
          Stumar Maspindzeli
        </p>
      </motion.section>
    </main>
  );
}
