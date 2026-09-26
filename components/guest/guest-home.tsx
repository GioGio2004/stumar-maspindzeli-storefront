"use client";

import { useMutation } from "convex/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, DoorOpen, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/convex/api";
import { itemsFor, orderable, type StorefrontData, type Tile } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { Clover, Dots, Leaf, Ring, Star4 } from "./glyphs";
import { iconFor, IconByKey } from "./icons";
import { notchMask } from "./notch";
import { PanelBody } from "./panels";
import { TilePreview, type ConciergeSample } from "./previews";
import { Scribble } from "./scribble";
import { Tracker } from "./tracker";
import { ThemeButton } from "../theme";

const ease = [0.22, 1, 0.36, 1] as const;

// Card types whose preview and panel are designed for the dark tone. Any other
// card set to dark keeps a light inner surface so its content stays readable.
const DARK_NATIVE = new Set(["concierge", "menu"]);
const morph = { type: "spring", bounce: 0.14, duration: 0.6 } as const;

// Phone heights per card type; from md up the grid rows decide.
const MOBILE_HEIGHT: Record<string, string> = {
  requests: "h-[380px]",
  menu: "h-[310px]",
  booking: "h-[270px]",
  ticket: "h-[300px]",
  concierge: "h-[300px]",
  events: "h-[300px]",
  stay: "h-[260px]",
  links: "h-[330px]",
  checkout: "h-[260px]",
  info: "h-[260px]",
};

function buildSamples(data: StorefrontData): ConciergeSample[] {
  const dish = orderable(itemsFor(data, "dining"))[0];
  return [
    {
      lang: "EN",
      question: "What time is check-out?",
      answer: `Check-out is at ${data.hotel.checkoutTime ?? "12:00"}. Want me to ask for a later time?`,
    },
    { lang: "KA", question: "შეიძლება 2 პირსახოცი?", answer: "რა თქმა უნდა! პირსახოცები უკვე გზაშია." },
    dish
      ? {
          lang: "RU",
          question: "Что можно заказать в номер?",
          answer: `Например, «${dish.title}»${dish.price !== undefined ? ` за ${dish.price}₾` : ""}. Заказать?`,
        }
      : { lang: "RU", question: "Во сколько выезд?", answer: `Выезд в ${data.hotel.checkoutTime ?? "12:00"}.` },
  ];
}

/**
 * The guest app. Every word, card and item comes from `data`, which managers
 * edit in the admin. `token` is set when the page was opened from a room tag.
 */
export function GuestHome({ data, token }: { data: StorefrontData; token: string | null }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [weekday] = useState(() => new Date().getDay());
  const lastOpened = useRef<string | null>(null);
  const track = useMutation(api.guest.events.track);

  const roomLabel = data.room ? `Room ${data.room.number}` : "Guest";
  const samples = buildSamples(data);
  const brand = data.hotel.brandName ?? data.hotel.name;
  const tiles = data.tiles;
  const nav = tiles.filter((t) => t.inNav);

  useEffect(() => {
    if (token) track({ token, kind: "open_app" }).catch(() => {});
  }, [token, track]);

  const open = useCallback(
    (tile: Tile) => {
      lastOpened.current = tile.id;
      setOpenId(tile.id);
      if (token) track({ token, kind: "view_feature", target: tile.type }).catch(() => {});
    },
    [token, track],
  );
  const close = useCallback(() => setOpenId(null), []);

  const onSent = useCallback((message: string) => {
    setOpenId(null);
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [openId, close]);

  useEffect(() => {
    if (openId !== null || lastOpened.current === null) return;
    const id = lastOpened.current;
    const t = window.setTimeout(() => document.getElementById(`tile-${id}`)?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, [openId]);

  const openTile = tiles.find((t) => t.id === openId) ?? null;
  const cells: (Tile | "intro")[] = tiles.length >= 4 ? [...tiles.slice(0, 3), "intro", ...tiles.slice(3)] : [...tiles];
  const concierge = tiles.find((t) => t.type === "concierge") ?? tiles[0];

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" inert={openId !== null} className="mx-auto w-full max-w-[1400px] flex-1 px-3 sm:px-6">
        <header className="flex h-20 items-center justify-between gap-4 sm:h-24">
          <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label={`${data.hotel.name}, home`}>
            <Dots className="size-6 shrink-0" />
            <span className="text-[22px] font-bold tracking-tight">{brand}</span>
            {data.hotel.brandName && (
              <span className="hidden truncate border-l border-black/15 pl-3 text-sm text-black/55 sm:block">{data.hotel.name}</span>
            )}
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {nav.map((tile) => (
              <button key={tile.id} type="button" onClick={() => open(tile)} className="rounded-full px-4 py-2 text-[15px] ring-1 ring-transparent transition hover:ring-black/80">
                {tile.navLabel ?? tile.title}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeButton />
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[15px] font-medium text-white sm:px-5">
              <DoorOpen className="size-4 text-lime" />
              {data.room ? roomLabel : "Browse"}
            </span>
          </div>
        </header>

        <main>
          <section className="rounded-[30px] bg-panel p-4 pb-5 sm:p-8 xl:p-12">
            <Hero data={data} nav={nav} onOpen={open} />
            <div className="mt-8 grid grid-flow-dense grid-cols-1 gap-3 sm:gap-4 md:auto-rows-[300px] md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {cells.map((cell, i) =>
                cell === "intro" ? (
                  <motion.div
                    key="intro"
                    className="relative hidden xl:block"
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.6, ease }}
                  >
                    <IntroCell onOpen={() => concierge && open(concierge)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={cell.id}
                    className={cn("relative md:h-auto", MOBILE_HEIGHT[cell.type] ?? "h-[280px]", cell.size === "wide" && "md:col-span-2")}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.6, ease }}
                    whileHover={{ y: -4 }}
                  >
                    {openId !== cell.id && (
                      <TileCard
                        tile={cell}
                        onOpen={() => open(cell)}
                        preview={<TilePreview tile={cell} data={data} roomLabel={roomLabel} weekday={weekday} samples={samples} />}
                      />
                    )}
                  </motion.div>
                ),
              )}
            </div>
            {tiles.length === 0 && <p className="py-16 text-center text-black/45">This hotel hasn&apos;t set up its guest app yet.</p>}
          </section>
        </main>
      </div>

      <footer inert={openId !== null} className="mt-16 bg-graphite pb-24 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Dots className="size-6" />
            <span className="text-xl font-bold tracking-tight">{brand}</span>
            <span className="hidden h-6 border-l border-white/20 sm:block" />
            <span className="text-sm text-white/60">
              {data.hotel.name}
              {data.hotel.collection ? ` · ${data.hotel.collection}` : ""}
            </span>
          </div>
          <p className="text-sm text-white/45">{data.settings.footerNote ?? "Powered by Stumar Maspindzeli"}</p>
        </div>
      </footer>

      <AnimatePresence>
        {openTile && (
          <FeaturePanel key={openTile.id} tile={openTile} onClose={close}>
            <PanelBody tile={openTile} data={data} token={token} roomLabel={roomLabel} weekday={weekday} samples={samples} onSent={onSent} />
          </FeaturePanel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <span className="flex items-center gap-3 rounded-full bg-lime py-2 pl-2 pr-5 text-[14px] font-medium shadow-2xl">
              <span className="grid size-7 place-items-center rounded-full bg-ink text-lime">
                <Check className="size-3.5" />
              </span>
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Tracker token={token} />
    </MotionConfig>
  );
}

function RevealWord({ word, index }: { word: string; index: number }) {
  return (
    <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
      <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ delay: 0.08 + index * 0.06, duration: 0.8, ease }}>
        {word}
      </motion.span>
    </span>
  );
}

function Words({ text, offset }: { text: string; offset: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <RevealWord word={word} index={offset + i} />{" "}
        </span>
      ))}
    </>
  );
}

function Hero({ data, nav, onOpen }: { data: StorefrontData; nav: Tile[]; onOpen: (tile: Tile) => void }) {
  const s = data.settings;
  const before = s.heroTitle.split(/\s+/).filter(Boolean).length;
  const mark = s.heroHighlight.split(/\s+/).filter(Boolean);
  const shortcuts = nav.slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div>
        {s.heroEyebrow && (
          <motion.p className="mb-3 inline-block -rotate-2 font-script text-2xl text-black/70 sm:text-[28px]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}>
            {s.heroEyebrow}
          </motion.p>
        )}
        <h1 className="max-w-4xl text-[42px] font-medium leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
          <Words text={s.heroTitle} offset={0} />
          {mark.length > 0 && (
            <>
              <span className="relative inline-block whitespace-nowrap">
                <Scribble className="-inset-x-[6%] -inset-y-[18%] h-[136%] w-[112%]" delay={1.1} />
                {mark.map((word, i) => (
                  <span key={`${word}-${i}`}>
                    <RevealWord word={word} index={before + i} />
                    {i < mark.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>{" "}
            </>
          )}
          <Words text={s.heroTitleEnd} offset={before + mark.length} />
        </h1>
      </div>
      <motion.div className="lg:pt-10" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6, ease }}>
        {shortcuts.length > 0 && (
          <div className="flex gap-2">
            {shortcuts.map((tile) => {
              const Icon = iconFor(tile.icon);
              return (
                <button key={tile.id} type="button" onClick={() => onOpen(tile)} aria-label={tile.title} className="grid size-12 place-items-center rounded-full bg-white transition hover:bg-ink hover:text-white">
                  <Icon className="size-5" />
                </button>
              );
            })}
          </div>
        )}
        {s.heroSubtitle && <p className="mt-4 text-[17px] leading-snug text-black/80">{s.heroSubtitle}</p>}
      </motion.div>
    </div>
  );
}

function TileCard({ tile, preview, onOpen }: { tile: Tile; preview: ReactNode; onOpen: () => void }) {
  // The concierge chat is drawn for a dark surface, so it ignores the tone setting.
  const dark = tile.tone === "dark" || tile.type === "concierge";
  const split = tile.size === "wide";

  return (
    <motion.div
      layoutId={`card-${tile.id}`}
      transition={morph}
      style={{ borderRadius: 28, ...(split ? notchMask(["top", "bottom"], { length: 92, depth: 20 }) : {}) }}
      className={cn("absolute inset-0 overflow-hidden", dark ? "bg-graphite text-white" : "bg-white text-foreground")}
    >
      <button
        id={`tile-${tile.id}`}
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={tile.title}
        aria-describedby={`tile-blurb-${tile.id}`}
        className={cn(
          "group flex h-full w-full flex-col p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset",
          dark ? "focus-visible:ring-lime" : "focus-visible:ring-ink",
          split && "md:grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-5",
        )}
      >
        <div className={cn("flex flex-col", split && "md:h-full")}>
          <div className="flex items-start justify-between gap-3">
            <motion.span layoutId={`icon-${tile.id}`} transition={morph} className={cn("grid size-11 shrink-0 place-items-center rounded-full", dark ? "bg-white/10" : "bg-panel")}>
              <IconByKey name={tile.icon} className="size-[18px]" />
            </motion.span>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full transition duration-300 group-hover:rotate-45",
                dark ? "bg-white/10 group-hover:bg-lime group-hover:text-black" : "bg-panel group-hover:bg-ink group-hover:text-white",
                split && "md:hidden",
              )}
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div className={cn("mt-3", split && "md:mt-auto")}>
            <h2 className="text-xl font-medium tracking-tight">{tile.title}</h2>
            <p id={`tile-blurb-${tile.id}`} className={cn("mt-1 text-[14px] leading-snug", dark ? "text-white/60" : "text-black/55")}>
              {tile.blurb}
            </p>
            {split && (
              <span className="mt-4 hidden items-center gap-2 text-[14px] font-medium md:inline-flex">
                <span className="grid size-9 place-items-center rounded-full bg-lime text-black transition duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="size-4" />
                </span>
                Open
              </span>
            )}
          </div>
        </div>
        <div aria-hidden="true" className={cn("mt-auto pt-4", split && "md:mt-0 md:flex md:flex-col md:justify-center md:pt-0")}>
          {dark && !DARK_NATIVE.has(tile.type) ? <div className="rounded-[20px] bg-white p-2.5 text-black">{preview}</div> : preview}
        </div>
      </button>
    </motion.div>
  );
}

function IntroCell({ onOpen }: { onOpen: () => void }) {
  const glyphs = [
    { Glyph: Star4, className: "text-ink" },
    { Glyph: Clover, className: "text-white" },
    { Glyph: Ring, className: "text-white" },
    { Glyph: Leaf, className: "text-white" },
    { Glyph: Clover, className: "text-white" },
  ];
  return (
    <div className="flex h-full flex-col justify-between py-2">
      <div className="grid w-max grid-cols-3 gap-2">
        {glyphs.map(({ Glyph, className }, i) => (
          <motion.span key={i} className={cn(i === 3 && "col-start-2")} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.9 + i * 0.08, type: "spring", stiffness: 260, damping: 16 }}>
            <Glyph className={cn("size-10", className)} />
          </motion.span>
        ))}
      </div>
      <div className="text-lg">
        <span className="inline-block rounded-full bg-white px-4 py-2">Not sure where</span>
        <span className="-mt-0.5 flex items-center gap-2">
          <span className="rounded-full bg-white px-4 py-2">to start?</span>
          <button type="button" onClick={onOpen} aria-label="Ask the concierge" className="grid size-11 place-items-center rounded-full bg-lime transition hover:scale-105">
            <ArrowRight className="size-5" />
          </button>
        </span>
      </div>
    </div>
  );
}

function FeaturePanel({ tile, onClose, children }: { tile: Tile; onClose: () => void; children: ReactNode }) {
  const dark = tile.type === "concierge" || (tile.tone === "dark" && DARK_NATIVE.has(tile.type));
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-scrim backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
      <motion.div
        layoutId={`card-${tile.id}`}
        transition={morph}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`panel-title-${tile.id}`}
        style={{ borderRadius: 30 }}
        className={cn("relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden shadow-2xl", dark ? "bg-graphite text-white" : "bg-white text-foreground")}
      >
        <div className="flex items-center gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
          <motion.span layoutId={`icon-${tile.id}`} transition={morph} className={cn("grid size-11 shrink-0 place-items-center rounded-full", dark ? "bg-white/10" : "bg-panel")}>
            <IconByKey name={tile.icon} className="size-[18px]" />
          </motion.span>
          <motion.h2
            id={`panel-title-${tile.id}`}
            className="min-w-0 flex-1 truncate text-2xl font-medium tracking-tight sm:text-3xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {tile.title}
          </motion.h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn("grid size-11 shrink-0 place-items-center rounded-full transition", dark ? "bg-white/10 hover:bg-lime hover:text-black" : "bg-panel hover:bg-ink hover:text-white")}
          >
            <X className="size-5" />
          </button>
        </div>
        <motion.div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4 sm:px-8 sm:pb-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.16, duration: 0.4, ease } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
