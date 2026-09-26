"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Clover, Dots, Ring, Star4 } from "@/components/guest/glyphs";

// A failed load shows a calm retry screen instead of a blank page.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center p-3">
      <section className="w-full max-w-lg rounded-[30px] bg-panel p-8 text-center sm:p-10">
        <div className="flex justify-center gap-2">
          <Star4 className="size-8 text-ink" />
          <Clover className="size-8 text-white" />
          <Ring className="size-8 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-medium tracking-tight">We couldn&apos;t load this page</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-black/60">
          Check your connection and try again. If it keeps happening, reception can help.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-white"
        >
          <RotateCw className="size-4 text-lime" />
          Try again
        </button>
        <p className="mt-8 flex items-center justify-center gap-2 text-[13px] text-black/40">
          <Dots className="size-4" />
          Stumar Maspindzeli
        </p>
      </section>
    </main>
  );
}
