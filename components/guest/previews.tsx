"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pencil, Ticket, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { eventsToday, itemByKey, itemsFor, orderable, type Item, type ResortEvent, type StorefrontData, type Tile } from "@/lib/storefront";
import { Clover, Ring, Star4 } from "./glyphs";
import { statusLabel, useTicker, type RequestStatus } from "./hooks";
import { iconFor } from "./icons";
import { notchMask } from "./notch";

// Looping illustrations inside the bento tiles, built from the tile's own data.
// Each renders a complete still frame at tick 0 for reduced-motion users.

const ease = [0.22, 1, 0.36, 1] as const;

const statusDot: Record<RequestStatus, string> = {
  open: "bg-black/25",
  accepted: "bg-slate-ink",
  in_progress: "bg-lime ring-2 ring-lime/40",
  done: "bg-emerald-600",
  cancelled: "bg-black/15",
};

export function StatusPill({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-6 min-w-[82px] shrink-0 items-center justify-end overflow-hidden text-[11px] text-black/60", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          className="inline-flex items-center gap-1.5"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <span className={cn("size-1.5 rounded-full", statusDot[status])} />
          {statusLabel[status]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export type ConciergeSample = { lang: string; question: string; answer: string };

export function TilePreview({
  tile,
  data,
  roomLabel,
  weekday,
  samples,
}: {
  tile: Tile;
  data: StorefrontData;
  roomLabel: string;
  weekday: number;
  samples: ConciergeSample[];
}) {
  switch (tile.type) {
    case "requests":
      return <RequestsPreview items={orderable(itemsFor(data, tile.section))} roomLabel={roomLabel} />;
    case "ticket":
      return <TicketPreview item={itemByKey(data, tile.itemKey)} hours={tile.hours} />;
    case "concierge":
      return <ConciergePreview samples={samples} />;
    case "menu":
      return <MenuPreview items={orderable(itemsFor(data, tile.section))} roomLabel={roomLabel} />;
    case "booking":
      return <BookingPreview items={orderable(itemsFor(data, tile.section))} slots={tile.slots ?? []} />;
    case "events":
      return <EventsPreview events={eventsToday(data.events, weekday)} />;
    case "stay":
      return <StayPreview wifi={data.wifi} checkout={data.hotel.checkoutTime} />;
    case "links":
      return <LinksPreview items={itemsFor(data, tile.section).filter((i) => i.kind === "link" || i.kind === "info")} />;
    case "checkout":
      return <CheckoutPreview options={tile.options ?? []} standard={data.hotel.checkoutTime ?? "12:00"} />;
    case "info":
      return <p className="line-clamp-4 text-[13px] leading-relaxed text-black/60">{tile.body}</p>;
    default:
      return null;
  }
}

const STAGES: RequestStatus[] = ["open", "accepted", "in_progress", "done"];

function RequestsPreview({ items, roomLabel }: { items: Item[]; roomLabel: string }) {
  const tick = useTicker(1700);
  const rows = items.slice(0, 3);
  if (rows.length === 0) return <Placeholder text="Add request items to this section in the catalog." />;
  return (
    <div className="rounded-2xl bg-paper p-3 ring-1 ring-black/5">
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wider text-black/45">
        <span>{roomLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
          Live
        </span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((item, i) => {
          const status = STAGES[(tick + 2 - i + STAGES.length * 3) % STAGES.length];
          const Icon = iconFor(item.icon);
          return (
            <li key={item.id} className="flex items-center gap-2 rounded-xl bg-white px-2 py-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-lime">
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{item.title}</span>
              <StatusPill status={status} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Wave({ className }: { className?: string }) {
  const period = "c10 0 15 -8 25 -8s15 8 25 8s15 -8 25 -8s15 8 25 8";
  return (
    <div className={cn("h-5 overflow-hidden", className)} aria-hidden="true">
      <motion.svg
        viewBox="0 0 400 20"
        preserveAspectRatio="none"
        className="h-full w-[200%]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 7, ease: "linear", repeat: Infinity }}
      >
        <path d={`M0 12${period}${period}${period}${period}`} fill="none" stroke="var(--lime-soft)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </motion.svg>
    </div>
  );
}

function TicketPreview({ item, hours }: { item?: Item; hours?: string }) {
  if (!item) return <Placeholder text="Pick the featured item for this card in the admin." />;
  return (
    <div>
      <div style={notchMask(["left", "right"], { length: 30, depth: 10 })} className="flex items-center gap-3 rounded-2xl bg-ink py-3 pl-5 pr-4 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-white/55">{item.title}</p>
          <p className="text-2xl font-medium tabular-nums">{item.price !== undefined ? `${item.price}₾` : "Free"}</p>
        </div>
        <span className="self-stretch border-l border-dashed border-white/25" />
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-black">
          <Ticket className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Wave className="min-w-0 flex-1" />
        {hours && <span className="shrink-0 text-[12px] font-medium tabular-nums text-black/60">{hours}</span>}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <motion.span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/10 px-3 py-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1.5 rounded-full bg-white/70" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </motion.span>
  );
}

function ConciergePreview({ samples }: { samples: ConciergeSample[] }) {
  const tick = useTicker(1500);
  if (samples.length === 0) return null;
  const step = tick + 2;
  const sample = samples[Math.floor(step / 3) % samples.length];
  const phase = step % 3;
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={sample.question}
            className="max-w-[90%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-[13px] leading-snug text-white"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease }}
          >
            <span className="mr-1.5 rounded-full bg-white px-1.5 py-px align-[1px] text-[10px] font-medium text-black">{sample.lang}</span>
            {sample.question}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex min-h-[56px] items-start">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 1 && <TypingDots key="typing" />}
          {phase === 2 && (
            <motion.p
              key={`answer-${sample.lang}`}
              className="max-w-[92%] rounded-2xl rounded-bl-md bg-lime px-3 py-2 text-[13px] leading-snug text-black"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              {sample.answer}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuPreview({ items, roomLabel }: { items: Item[]; roomLabel: string }) {
  const tick = useTicker(1800);
  const lines = items.slice(0, 3);
  if (lines.length === 0) return <Placeholder text="Add priced items to this section." dark />;
  const count = ((tick + lines.length - 1) % lines.length) + 1;
  const shown = lines.slice(0, count);
  const total = shown.reduce((sum, line) => sum + (line.price ?? 0), 0);
  return (
    <div className="rounded-2xl bg-white p-3 text-black">
      <div className="flex items-center justify-between text-[12px] font-medium">
        <span>Order · {roomLabel}</span>
        <span className="inline-flex items-center gap-1 text-black/45">
          <Pencil className="size-3" />
          Edit
        </span>
      </div>
      <ul className="mt-1.5 min-h-[58px] space-y-0.5">
        <AnimatePresence initial={false}>
          {shown.map((line) => (
            <motion.li
              key={line.id}
              layout
              className="flex items-center justify-between text-[12px] leading-[18px] text-black/70"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-lime ring-1 ring-black/10" />
                <span className="truncate">{line.title}</span>
              </span>
              <span className="tabular-nums">{line.price ?? 0}₾</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="mt-1.5 flex items-center justify-between border-t border-dashed border-black/10 pt-1.5 text-[13px] font-medium">
        <span>Total</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={total} className="tabular-nums" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
            {total}₾
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BookingPreview({ items, slots }: { items: Item[]; slots: string[] }) {
  const tick = useTicker(1400);
  const shownSlots = slots.slice(0, 4);
  if (items.length === 0) return <Placeholder text="Add bookable items to this section." />;
  const selected = shownSlots.length ? (tick + 2) % shownSlots.length : -1;
  const item = items[Math.floor(tick / Math.max(1, shownSlots.length)) % Math.min(3, items.length)];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between overflow-hidden rounded-xl bg-paper px-3 py-2 text-[13px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={item.id} className="truncate" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.3, ease }}>
            {item.title}
          </motion.span>
        </AnimatePresence>
        {item.minutes && <span className="shrink-0 text-black/45">{item.minutes} min</span>}
      </div>
      {shownSlots.length > 0 && (
        <div className="flex gap-1.5">
          {shownSlots.map((slot, i) => (
            <span key={slot} className="relative flex-1 rounded-full py-1.5 text-center text-[12px] tabular-nums ring-1 ring-black/10">
              {i === selected && (
                <motion.span layoutId="booking-preview-slot" className="absolute inset-0 rounded-full bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className={cn("relative", i === selected ? "font-medium" : "text-black/55")}>{slot}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsPreview({ events }: { events: ResortEvent[] }) {
  const tick = useTicker(2000);
  const shown = events.slice(0, 4);
  if (shown.length === 0) return <Placeholder text="No events today." />;
  const active = (tick + 1) % shown.length;
  return (
    <ol className="relative space-y-1.5 pl-4">
      <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-black/10" />
      {shown.map((event, i) => (
        <li key={event.id} className="relative py-1">
          {i === active && <motion.span layoutId="today-preview-active" className="absolute -inset-x-2 inset-y-0 rounded-lg bg-paper" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
          <span
            aria-hidden="true"
            className={cn(
              "absolute -left-4 top-1/2 size-[11px] -translate-y-1/2 rounded-full border-2 border-white transition-colors duration-300",
              i === active ? "bg-lime ring-1 ring-black/20" : "bg-black/15",
            )}
          />
          <div className="relative flex items-baseline gap-2 text-[13px]">
            <span className="w-10 shrink-0 font-medium tabular-nums">{event.time}</span>
            <span className="truncate">{event.title}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StayPreview({ wifi, checkout }: { wifi: StorefrontData["wifi"]; checkout?: string }) {
  const tick = useTicker(2400);
  const revealed = tick % 2 === 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white">
          <Wifi className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          {wifi ? (
            <>
              <p className="truncate text-[13px] font-medium">{wifi.network}</p>
              <p className="h-[18px] overflow-hidden font-mono text-[12px] text-black/55">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={revealed ? "shown" : "hidden"} className="block" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.25 }}>
                    {revealed ? wifi.password : "•".repeat(wifi.password.length)}
                  </motion.span>
                </AnimatePresence>
              </p>
            </>
          ) : (
            <p className="text-[13px] text-black/55">Wi-Fi details appear after check-in</p>
          )}
        </div>
      </div>
      {checkout && (
        <div className="flex items-center justify-between px-3 text-[13px]">
          <span className="text-black/55">Check-out</span>
          <span className="font-medium tabular-nums">{checkout}</span>
        </div>
      )}
    </div>
  );
}

const GLYPHS = [Star4, Clover, Ring];

function LinksPreview({ items }: { items: Item[] }) {
  if (items.length === 0) return <Placeholder text="Add link items to this section." />;
  return (
    <div className="space-y-1.5">
      {items.slice(0, 3).map((item, i) => {
        const Glyph = GLYPHS[i % GLYPHS.length];
        const first = i === 0;
        return (
          <motion.div
            key={item.id}
            className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", first ? "bg-ink text-white" : "bg-paper")}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.6, delay: i * 0.5, ease: "easeInOut" }}
          >
            <Glyph className={cn("size-5 shrink-0", first ? "text-lime" : "text-ink")} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{item.title}</p>
              {item.description && <p className={cn("truncate text-[11px]", first ? "text-white/55" : "text-black/45")}>{item.description}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CheckoutPreview({ options, standard }: { options: string[]; standard: string }) {
  const tick = useTicker(2200);
  const lateTime = options[1] ?? options[0] ?? standard;
  const late = tick % 2 === 0;
  const hours = (t: string) => Number(t.split(":")[0]) || 12;
  const angle = ((hours(lateTime) - hours(standard)) * 30) % 360;
  const clockEase = [0.65, 0, 0.35, 1] as const;
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[72px] shrink-0 rounded-full bg-paper ring-1 ring-black/10">
        {[0, 90, 180, 270].map((deg) => (
          <span key={deg} aria-hidden="true" className="absolute left-1/2 top-1/2 -ml-px h-[30px] w-px origin-bottom" style={{ transform: `translateY(-100%) rotate(${deg}deg)` }}>
            <span className="block h-1.5 w-full rounded-full bg-black/30" />
          </span>
        ))}
        <motion.span aria-hidden="true" className="absolute bottom-1/2 left-1/2 -ml-[1.5px] h-[18px] w-[3px] origin-bottom rounded-full bg-ink" animate={{ rotate: late ? angle : 0 }} transition={{ duration: 1.1, ease: clockEase }} />
        <motion.span aria-hidden="true" className="absolute bottom-1/2 left-1/2 -ml-px h-[26px] w-[2px] origin-bottom rounded-full bg-ink/55" animate={{ rotate: late ? 720 : 0 }} transition={{ duration: 1.1, ease: clockEase }} />
        <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime ring-2 ring-ink" />
      </div>
      <div>
        <p className="text-[12px] text-black/50">Check out at</p>
        <p className="h-8 overflow-hidden text-2xl font-medium tabular-nums">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={late ? "late" : "standard"} className="block" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
              {late ? lateTime : standard}
            </motion.span>
          </AnimatePresence>
        </p>
        <p className="text-[12px] text-black/50">{late ? "Late, on request" : "Standard"}</p>
      </div>
    </div>
  );
}

function Placeholder({ text, dark }: { text: string; dark?: boolean }) {
  return <p className={cn("rounded-2xl border border-dashed px-3 py-4 text-center text-[12px]", dark ? "border-white/20 text-white/50" : "border-black/10 text-black/45")}>{text}</p>;
}
