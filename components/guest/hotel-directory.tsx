"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { api } from "@/lib/convex/api";
import { Clover, Dots, Ring, Star4 } from "./glyphs";

// Every hotel, each linking to its guest app. Live, so a hotel created in the
// admin shows up here without a redeploy.

export function HotelDirectory({ preloaded }: { preloaded: Preloaded<typeof api.guest.storefront.directory> }) {
  const hotels = usePreloadedQuery(preloaded);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-3 sm:p-6">
      <p className="flex items-center gap-2 px-2 pt-3 text-sm text-black/55">
        <Dots className="size-4" />
        Stumar Maspindzeli
      </p>

      <div className="mt-12 flex gap-2 px-2 sm:mt-16">
        <Star4 className="size-8 text-ink" />
        <Clover className="size-8 text-black/15" />
        <Ring className="size-8 text-black/15" />
      </div>
      <h1 className="mt-5 px-2 text-4xl font-medium tracking-tight sm:text-5xl">Choose your hotel</h1>
      <p className="mt-3 max-w-md px-2 text-[15px] leading-relaxed text-black/60">
        Staying with us? Tap the tag in your room for your own guest page. You can look around any hotel here.
      </p>

      {hotels.length === 0 ? (
        <p className="mt-10 rounded-[24px] bg-panel p-6 text-[15px] text-black/55">No hotels yet.</p>
      ) : (
        <ul className="mt-10 grid gap-3">
          {hotels.map((hotel) => (
            <li key={hotel.slug}>
              <Link
                href={`/h/${hotel.slug}`}
                className="group flex items-center gap-4 rounded-[24px] bg-panel p-4 pl-6 transition-colors hover:bg-panel-hover sm:p-5 sm:pl-7"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl font-medium tracking-tight">
                    {hotel.brandName ?? hotel.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-black/45">
                    {hotel.brandName ? `${hotel.name} · ` : ""}/h/{hotel.slug}
                  </span>
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-black transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
