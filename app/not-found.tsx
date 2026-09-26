import Link from "next/link";
import { Clover, Dots, Ring, Star4 } from "@/components/guest/glyphs";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-3">
      <section className="w-full max-w-lg rounded-[30px] bg-panel p-8 text-center sm:p-10">
        <div className="flex justify-center gap-2">
          <Star4 className="size-8 text-ink" />
          <Clover className="size-8 text-white" />
          <Ring className="size-8 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-medium tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-black/60">
          The link may be old or mistyped. Tap the tag in your room to open your guest page.
        </p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-medium text-white">
          Explore the hotel
        </Link>
        <p className="mt-8 flex items-center justify-center gap-2 text-[13px] text-black/40">
          <Dots className="size-4" />
          Stumar Maspindzeli
        </p>
      </section>
    </main>
  );
}
