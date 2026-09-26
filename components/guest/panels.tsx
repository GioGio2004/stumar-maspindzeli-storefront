"use client";

import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  CalendarCheck,
  Check,
  Clock,
  ConciergeBell,
  Copy,
  KeyRound,
  Languages,
  Minus,
  Phone,
  Plus,
  Send,
  Sparkles,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/convex/api";
import {
  eventsToday,
  gel,
  hotelNow,
  itemByKey,
  itemsFor,
  orderable,
  type StorefrontData,
  type Tile,
} from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { errorInfo, useGuestAccess } from "./access";
import { Clover, Ring, Star4 } from "./glyphs";
import { HowItWorks, RequestFlowVisual, type Step, type Tone } from "./how-it-works";
import { iconFor } from "./icons";
import { notchMask } from "./notch";
import type { ConciergeSample } from "./previews";

type CatalogId = GenericId<"catalogItems">;

export type PanelProps = {
  tile: Tile;
  data: StorefrontData;
  roomLabel: string;
  weekday: number;
  samples: ConciergeSample[];
  onSent: (message: string) => void;
};

const STEP_ICONS: Record<string, LucideIcon[]> = {
  requests: [Sparkles, ConciergeBell, Clock, Check],
  menu: [Plus, ConciergeBell, Check],
  booking: [Sparkles, CalendarCheck, BellRing],
  ticket: [Ticket, ConciergeBell, Sparkles],
  concierge: [Languages, BookOpen, Send],
  checkout: [Clock, ConciergeBell, Check],
};

function StarIcon({ className }: { className?: string }) {
  return <Star4 className={className} />;
}

function stepsFor(tile: Tile, tags: (string | undefined)[] = []): Step[] {
  const icons = STEP_ICONS[tile.type] ?? [Sparkles, Check, StarIcon];
  return (tile.howItWorks ?? []).map((s, i) => ({ title: s.title, body: s.body, icon: icons[i % icons.length], tag: tags[i] }));
}

export function PanelBody(props: PanelProps) {
  switch (props.tile.type) {
    case "requests":
      return <RequestsPanel {...props} />;
    case "menu":
      return <MenuPanel {...props} />;
    case "booking":
      return <BookingPanel {...props} />;
    case "ticket":
      return <TicketPanel {...props} />;
    case "concierge":
      return <ConciergePanel {...props} />;
    case "events":
      return <EventsPanel {...props} />;
    case "stay":
      return <StayPanel {...props} />;
    case "links":
      return <LinksPanel {...props} />;
    case "checkout":
      return <CheckoutPanel {...props} />;
    case "info":
      return <InfoPanel {...props} />;
    default:
      return null;
  }
}

// ---- shared ------------------------------------------------------------------

function Columns({ main, aside }: { main: ReactNode; aside?: ReactNode }) {
  if (!aside) return <div className="max-w-3xl">{main}</div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="min-w-0">{main}</div>
      <div className="lg:sticky lg:top-0 lg:self-start">{aside}</div>
    </div>
  );
}

function Lead({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <p className={cn("max-w-xl text-[15px] leading-relaxed", dark ? "text-white/70" : "text-black/60")}>{children}</p>;
}

/**
 * Runs a guest action with the stay key and turns backend refusals into a
 * readable message. A stale key (new stay, reset PIN) sends the guest back to
 * the PIN prompt.
 */
function useSend(onSent: (message: string) => void) {
  const { keyArg, clearKey } = useGuestAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async (run: (key: string | undefined) => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await run(keyArg);
      onSent(message);
    } catch (e) {
      const info = errorInfo(e);
      if (info.code === "PIN_REQUIRED") clearKey();
      setError(info.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, send, setError };
}

function PinEntry({ tone = "light" }: { tone?: Tone }) {
  const { token, saveKey } = useGuestAccess();
  const unlock = useMutation(api.guest.pin.unlock);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dark = tone === "dark";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || pin.length !== 4 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await unlock({ token, pin });
      if (result.ok) saveKey(result.key ?? "none");
      else setMessage(result.message);
    } catch (err) {
      setMessage(errorInfo(err).message);
    } finally {
      setBusy(false);
      setPin("");
    }
  };

  return (
    <form onSubmit={submit} className={cn("rounded-[24px] p-4", dark ? "bg-white/[0.07]" : "bg-paper")}>
      <p className="flex items-center gap-2 text-[14px] font-medium">
        <KeyRound className="size-4" />
        Enter your room PIN
      </p>
      <p className={cn("mt-0.5 text-[13px]", dark ? "text-white/60" : "text-black/55")}>
        Reception gave you a 4-digit PIN at check-in. You only enter it once on this phone.
      </p>
      <div className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="room-pin">
          Room PIN
        </label>
        <input
          id="room-pin"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••"
          className={cn(
            "h-12 w-32 rounded-full px-5 text-center font-mono text-lg tracking-[0.4em] outline-none ring-1",
            dark ? "bg-white/10 text-white ring-white/10 focus:ring-lime" : "bg-white ring-black/10 focus:ring-ink",
          )}
        />
        <button
          type="submit"
          disabled={pin.length !== 4 || busy}
          className={cn(
            "h-12 flex-1 rounded-full text-[15px] font-medium transition disabled:opacity-45",
            dark ? "bg-lime text-black" : "bg-ink text-white",
          )}
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </div>
      {message && <p className="mt-2 text-[13px] text-red-600">{message}</p>}
    </form>
  );
}

function SendBar({
  label,
  disabled,
  onClick,
  tone = "light",
  busy,
  error,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: Tone;
  busy?: boolean;
  error?: string | null;
}) {
  const { token, hasStay, unlocked } = useGuestAccess();
  const dark = tone === "dark";

  if (!token || !hasStay) {
    return (
      <p className={cn("mt-6 rounded-[20px] px-4 py-3 text-center text-[14px]", dark ? "bg-white/[0.07] text-white/65" : "bg-paper text-black/55")}>
        {!token ? "Tap the tag in your room to send requests." : "Your room switches on at check-in."}
      </p>
    );
  }
  if (!unlocked) {
    return (
      <div className="mt-6">
        <PinEntry tone={tone} />
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onClick}
        className={cn(
          "group flex h-14 w-full items-center justify-between gap-3 rounded-full pl-6 pr-2 text-[15px] font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
          dark ? "bg-lime text-black" : "bg-ink text-white",
        )}
      >
        <span className="truncate">{busy ? "Sending…" : label}</span>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full transition-transform group-enabled:group-hover:translate-x-0.5", dark ? "bg-ink text-white" : "bg-lime text-black")}>
          <ArrowRight className="size-4" />
        </span>
      </button>
      {error && (
        <p role="alert" className="text-center text-[13px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function QtyStepper({ value, onChange, label, max = 9 }: { value: number; onChange: (next: number) => void; label: string; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white p-0.5 ring-1 ring-black/10">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Fewer ${label}`} className="grid size-7 place-items-center rounded-full text-black hover:bg-panel">
        <Minus className="size-3.5" />
      </button>
      <span className="w-4 text-center text-[13px] font-medium tabular-nums text-black" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`More ${label}`}
        className="grid size-7 place-items-center rounded-full text-black hover:bg-panel disabled:opacity-35"
      >
        <Plus className="size-3.5" />
      </button>
    </span>
  );
}

function Empty({ text, dark }: { text: string; dark?: boolean }) {
  return <p className={cn("rounded-[22px] border border-dashed px-4 py-8 text-center text-[14px]", dark ? "border-white/20 text-white/50" : "border-black/10 text-black/45")}>{text}</p>;
}

// ---- requests ------------------------------------------------------------------

function RequestsPanel({ tile, data, roomLabel, onSent }: PanelProps) {
  const create = useMutation(api.guest.requests.create);
  const { token } = useGuestAccess();
  const { busy, error, send } = useSend(onSent);
  const items = orderable(itemsFor(data, tile.section));
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const chosen = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const teams = [...new Set(chosen.map((i) => i.departmentName).filter(Boolean))] as string[];
  const allTeams = [...new Set(data.items.map((i) => i.departmentName).filter(Boolean))] as string[];
  const noteAllowed = chosen.some((i) => i.allowNote);

  const submit = () =>
    send(async (key) => {
      for (const item of chosen) {
        await create({
          token: token!,
          key,
          itemId: item.id as CatalogId,
          quantity: item.allowQuantity ? qty[item.id] : undefined,
          note: item.allowNote ? note.trim() || undefined : undefined,
        });
        // Clear each item once it's sent, so a retry never sends it twice.
        setQty((q) => ({ ...q, [item.id]: 0 }));
      }
      setNote("");
    }, chosen.length > 1 ? `${chosen.length} requests sent` : `${chosen[0]?.title} requested`);

  return (
    <Columns
      main={
        <>
          <Lead>Pick what you need. Each request goes only to the team that handles it.</Lead>
          {items.length === 0 ? (
            <div className="mt-5">
              <Empty text="Nothing to request here yet." />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {items.map((item) => {
                const n = qty[item.id] ?? 0;
                const on = n > 0;
                const Icon = iconFor(item.icon);
                return (
                  <div key={item.id} className={cn("relative rounded-[22px] p-3.5 ring-1 transition-colors", on ? "bg-lime/30 ring-ink" : "bg-paper ring-transparent hover:ring-black/15")}>
                    <button type="button" onClick={() => setQty((q) => ({ ...q, [item.id]: on ? 0 : 1 }))} aria-pressed={on} className="flex w-full flex-col items-start gap-3 text-left outline-none">
                      <span className={cn("grid size-10 place-items-center rounded-2xl transition-colors", on ? "bg-lime" : "bg-white")}>
                        {on && !item.allowQuantity ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium leading-tight">{item.title}</span>
                        <span className="mt-0.5 block text-[11px] text-black/50">
                          {item.departmentName}
                          {item.price !== undefined ? ` · ${gel(item.price)}` : ""}
                        </span>
                      </span>
                    </button>
                    <AnimatePresence>
                      {on && item.allowQuantity && (
                        <motion.span className="absolute right-2.5 top-2.5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <QtyStepper value={n} max={item.maxQuantity ?? 9} onChange={(v) => setQty((q) => ({ ...q, [item.id]: v }))} label={item.title.toLowerCase()} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
          {noteAllowed && (
            <label className="mt-5 block">
              <span className="text-[13px] font-medium">Anything else?</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="For example: after 18:00, please"
                className="mt-1.5 h-12 w-full rounded-full bg-paper px-5 text-sm outline-none ring-1 ring-black/5 transition placeholder:text-black/35 focus:ring-ink"
              />
            </label>
          )}
          <SendBar
            busy={busy}
            error={error}
            disabled={chosen.length === 0}
            label={chosen.length === 0 ? "Pick something first" : `Send to ${teams.join(" & ") || "the team"}`}
            onClick={submit}
          />
        </>
      }
      aside={
        tile.howItWorks && tile.howItWorks.length > 0 ? (
          <HowItWorks
            steps={stepsFor(tile)}
            visual={(step) => (
              <RequestFlowVisual
                step={step}
                roomLabel={roomLabel}
                picks={items.slice(0, 3).map((i) => ({ label: i.title, icon: iconFor(i.icon) }))}
                team={items[0]?.departmentName ?? "Housekeeping"}
                otherTeams={allTeams}
              />
            )}
          />
        ) : undefined
      }
    />
  );
}

// ---- menu ----------------------------------------------------------------------

function MenuPanel({ tile, data, roomLabel, onSent }: PanelProps) {
  const createOrder = useMutation(api.guest.requests.createOrder);
  const { token } = useGuestAccess();
  const { busy, error, send } = useSend(onSent);
  // An order must come from one section; fall back to dining if the card has none.
  const items = orderable(itemsFor(data, tile.section ?? "dining"));
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const lines = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const total = lines.reduce((sum, i) => sum + (i.price ?? 0) * qty[i.id], 0);
  const dark = tile.tone === "dark";

  return (
    <Columns
      main={
        <>
          <Lead dark={dark}>Order to your room. It goes on your room bill.</Lead>
          <div className="mt-5 rounded-[24px] bg-white p-2 text-black">
            {items.length === 0 ? (
              <Empty text="The menu is empty right now." />
            ) : (
              <ul>
                {items.map((item) => {
                  const n = qty[item.id] ?? 0;
                  const max = item.allowQuantity ? (item.maxQuantity ?? 9) : 1;
                  return (
                    <li key={item.id} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-paper">
                      <span className={cn("size-2 shrink-0 rounded-full ring-1 ring-black/10", n > 0 ? "bg-lime" : "bg-panel")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px]">{item.title}</span>
                        {item.description && <span className="block text-[12px] text-black/45">{item.description}</span>}
                      </span>
                      <span className="text-sm tabular-nums text-black/55">{gel(item.price ?? 0)}</span>
                      {n > 0 && max > 1 ? (
                        <QtyStepper value={n} max={max} onChange={(v) => setQty((q) => ({ ...q, [item.id]: v }))} label={item.title} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setQty((q) => ({ ...q, [item.id]: n > 0 ? 0 : 1 }))}
                          aria-pressed={n > 0}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition",
                            n > 0 ? "bg-ink text-white" : "bg-panel hover:bg-ink hover:text-white",
                          )}
                        >
                          {n > 0 ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                          {n > 0 ? "Added" : "Add"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mx-3 mb-2 mt-1 flex items-center justify-between border-t border-dashed border-black/10 pt-3 text-[15px] font-medium">
              <span className="truncate">Total · {roomLabel}</span>
              <span className="tabular-nums">{gel(total)}</span>
            </div>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Allergies or timing? Tell the kitchen"
            className={cn(
              "mt-3 h-12 w-full rounded-full px-5 text-sm outline-none ring-1 transition",
              dark ? "bg-white/10 text-white ring-white/10 placeholder:text-white/40 focus:ring-lime" : "bg-paper ring-black/5 focus:ring-ink",
            )}
          />
          <SendBar
            tone={tile.tone}
            busy={busy}
            error={error}
            disabled={lines.length === 0}
            label={lines.length === 0 ? "Add a dish first" : `Order to my room · ${gel(total)}`}
            onClick={() =>
              send(async (key) => {
                await createOrder({
                  token: token!,
                  key,
                  lines: lines.map((i) => ({ itemId: i.id as CatalogId, quantity: qty[i.id] })),
                  note: note.trim() || undefined,
                });
                setQty({});
                setNote("");
              }, "Order sent to the kitchen")
            }
          />
        </>
      }
      aside={tile.howItWorks?.length ? <HowItWorks steps={stepsFor(tile)} tone={tile.tone} /> : undefined}
    />
  );
}

// ---- booking -------------------------------------------------------------------

function BookingPanel({ tile, data, onSent }: PanelProps) {
  const create = useMutation(api.guest.requests.create);
  const { token } = useGuestAccess();
  const { busy, error, send } = useSend(onSent);
  const items = orderable(itemsFor(data, tile.section));
  // Only slots still ahead today (hotel time); keep all if none are left.
  const [slots] = useState(() => {
    const all = tile.slots ?? [];
    const now = hotelNow(data.hotel.timezone).hhmm;
    const upcoming = all.filter((s) => s > now);
    return upcoming.length > 0 ? upcoming : all;
  });
  const [itemId, setItemId] = useState(items[0]?.id);
  const [slot, setSlot] = useState(slots[0] ?? "");
  const item = items.find((i) => i.id === itemId) ?? items[0];

  return (
    <Columns
      main={
        <>
          <Lead>{tile.blurb}</Lead>
          {items.length === 0 ? (
            <div className="mt-5">
              <Empty text="Nothing to book right now." />
            </div>
          ) : (
            <fieldset className="mt-5">
              <legend className="text-[13px] font-medium">Choose</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {items.map((t) => {
                  const on = t.id === item?.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setItemId(t.id)}
                      className={cn("flex items-center justify-between gap-3 rounded-[20px] px-4 py-3.5 text-left ring-1 transition-colors", on ? "bg-lime/30 ring-ink" : "bg-paper ring-transparent hover:ring-black/15")}
                    >
                      <span className="text-[15px] font-medium">{t.title}</span>
                      <span className="shrink-0 text-[13px] text-black/50">
                        {t.minutes ? `${t.minutes} min` : ""}
                        {t.price !== undefined ? `${t.minutes ? " · " : ""}${gel(t.price)}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          {slots.length > 0 && (
            <fieldset className="mt-5">
              <legend className="text-[13px] font-medium">Time today</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={s === slot} onClick={() => setSlot(s)} className="relative rounded-full px-5 py-2.5 text-sm tabular-nums ring-1 ring-black/10">
                    {s === slot && <motion.span layoutId={`booking-panel-slot-${tile.id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className={cn("relative", s === slot ? "text-white" : "text-black/70")}>{s}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <SendBar
            busy={busy}
            error={error}
            disabled={!item}
            label={item ? `Request ${item.title.toLowerCase()}${slot ? ` at ${slot}` : ""}` : "Nothing to book"}
            onClick={() =>
              send((key) => create({ token: token!, key, itemId: item!.id as CatalogId, detail: slot ? `at ${slot}` : undefined }), `${item!.title} requested`)
            }
          />
        </>
      }
      aside={tile.howItWorks?.length ? <HowItWorks steps={stepsFor(tile, [slot])} /> : undefined}
    />
  );
}

// ---- ticket --------------------------------------------------------------------

function TicketPanel({ tile, data, onSent }: PanelProps) {
  const create = useMutation(api.guest.requests.create);
  const { token } = useGuestAccess();
  const { busy, error, send } = useSend(onSent);
  const item = itemByKey(data, tile.itemKey);
  const available = item !== undefined && Boolean(item.departmentName);

  return (
    <Columns
      main={
        <>
          <Lead>
            {item?.description ?? tile.blurb}
            {tile.hours ? ` Open ${tile.hours}.` : ""}
          </Lead>
          {item && (
            <div style={notchMask(["left", "right"], { length: 46, depth: 16 })} className="mt-5 flex flex-col gap-4 rounded-[26px] bg-ink p-6 text-white sm:flex-row sm:items-center">
              <div className="flex-1 sm:pl-2">
                <p className="text-[12px] uppercase tracking-wider text-white/55">{item.title}</p>
                <p className="mt-1 text-5xl font-medium tabular-nums">{item.price !== undefined ? gel(item.price) : "Free"}</p>
              </div>
              {tile.hours && (
                <div className="border-t border-dashed border-white/25 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pr-2 sm:pt-0">
                  <p className="text-[12px] text-white/55">Open</p>
                  <p className="text-xl font-medium tabular-nums">{tile.hours}</p>
                </div>
              )}
            </div>
          )}
          {tile.facts && tile.facts.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tile.facts.map((fact) => (
                <div key={`${fact.value}-${fact.label}`} className="rounded-[22px] bg-paper p-4">
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="block text-2xl font-medium">{fact.value}</span>
                    <span className="text-[13px] text-black/55">{fact.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {available ? (
            <SendBar
              busy={busy}
              error={error}
              label={`Add to my room${item.price !== undefined ? ` · ${gel(item.price)}` : ""}`}
              onClick={() => send((key) => create({ token: token!, key, itemId: item.id as CatalogId }), `${item.title} requested`)}
            />
          ) : (
            <p className="mt-6 rounded-[20px] bg-paper px-4 py-3 text-center text-[14px] text-black/55">
              Not available to book here right now. Reception can help.
            </p>
          )}
        </>
      }
      aside={tile.howItWorks?.length ? <HowItWorks steps={stepsFor(tile, [item?.price !== undefined ? gel(item.price) : undefined, undefined, tile.hours])} /> : undefined}
    />
  );
}

// ---- concierge ------------------------------------------------------------------

type Message = { id: number; from: "guest" | "concierge"; text: string };

const FALLBACK_ANSWER =
  "I can answer the common questions below right now. For anything else, please call reception and they'll help you straight away.";

function ConciergePanel({ tile, data, samples }: PanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "concierge", text: `Hi! I'm the ${data.hotel.brandName ?? data.hotel.name} concierge. Ask me about your stay, in your language.` },
  ]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  const ask = (question: string, answer: string) => {
    setMessages((m) => [...m, { id: m.length, from: "guest", text: question }]);
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { id: m.length, from: "concierge", text: answer }]);
      }, 1100),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    const known = samples.find((s) => s.question.toLowerCase() === text.toLowerCase());
    ask(text, known?.answer ?? FALLBACK_ANSWER);
    setDraft("");
  };

  return (
    <Columns
      main={
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Lead dark>Chat with the hotel in your own language.</Lead>
            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">Preview</span>
          </div>
          <div className="mt-4 h-[320px] space-y-2.5 overflow-y-auto rounded-[24px] bg-black/20 p-4" aria-live="polite">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div key={message.id} className={cn("flex", message.from === "guest" ? "justify-end" : "justify-start")} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}>
                  <p className={cn("max-w-[85%] rounded-3xl px-4 py-2.5 text-[14px] leading-snug", message.from === "guest" ? "rounded-br-lg bg-white/12 text-white" : "rounded-bl-lg bg-lime text-black")}>{message.text}</p>
                </motion.div>
              ))}
              {typing && (
                <motion.div key="typing" className="flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="inline-flex gap-1 rounded-3xl rounded-bl-lg bg-white/10 px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="size-1.5 rounded-full bg-white/70" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {samples.map((sample) => (
              <button key={sample.lang} type="button" disabled={typing} onClick={() => ask(sample.question, sample.answer)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-left text-[13px] text-white transition hover:bg-white/15 disabled:opacity-50">
                <span className="rounded-full bg-white/15 px-1.5 text-[10px] font-medium">{sample.lang}</span>
                {sample.question}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="concierge-input">
              Message the concierge
            </label>
            <input id="concierge-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" maxLength={300} className="h-12 min-w-0 flex-1 rounded-full bg-white/10 px-5 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-lime" />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || typing} className="grid size-12 shrink-0 place-items-center rounded-full bg-lime text-black transition disabled:opacity-40">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      }
      aside={tile.howItWorks?.length ? <HowItWorks steps={stepsFor(tile, ["EN · KA · RU"])} tone="dark" /> : undefined}
    />
  );
}

// ---- events ---------------------------------------------------------------------

function EventsPanel({ data, weekday }: PanelProps) {
  const events = eventsToday(data.events, weekday);
  return (
    <div className="max-w-2xl">
      <Lead>What&apos;s happening around the resort today.</Lead>
      {events.length === 0 ? (
        <div className="mt-5">
          <Empty text="Nothing scheduled today." />
        </div>
      ) : (
        <ol className="relative mt-5 space-y-2.5 pl-6">
          <span aria-hidden="true" className="absolute bottom-4 left-[7px] top-4 w-px bg-black/10" />
          {events.map((event, i) => (
            <motion.li key={event.id} className="relative flex items-center gap-4 rounded-[22px] bg-paper px-4 py-3.5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
              <span aria-hidden="true" className="absolute -left-6 top-1/2 size-[15px] -translate-y-1/2 rounded-full border-[3px] border-white bg-lime ring-1 ring-black/15" />
              <span className="w-12 shrink-0 text-lg font-medium tabular-nums">{event.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{event.title}</span>
                {event.place && <span className="block text-[13px] text-black/50">{event.place}</span>}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---- stay -----------------------------------------------------------------------

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked outside secure contexts; the value stays visible.
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={`Copy ${label}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium text-black ring-1 ring-black/10 transition hover:bg-ink hover:text-white">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StayPanel({ data }: PanelProps) {
  const { wifi, hotel } = data;
  return (
    <div className="max-w-2xl">
      {wifi ? (
        <div className="rounded-[26px] bg-ink p-5 text-white sm:p-6">
          <p className="text-[12px] uppercase tracking-wider text-white/55">Wi-Fi</p>
          <div className="mt-3 space-y-3">
            {[
              { label: "Network", value: wifi.network, mono: false },
              { label: "Password", value: wifi.password, mono: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-white/50">{row.label}</p>
                  <p className={cn("truncate text-lg", row.mono && "font-mono")}>{row.value}</p>
                </div>
                <CopyButton value={row.value} label={row.label.toLowerCase()} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty text="Wi-Fi details appear here once you're checked in." />
      )}
      <ul className="mt-3 space-y-2">
        {hotel.checkoutTime && (
          <li className="flex items-center gap-3 rounded-[22px] bg-paper px-4 py-3.5">
            <span className="grid size-9 place-items-center rounded-full bg-white">
              <Clock className="size-4" />
            </span>
            <span className="flex-1 text-[15px] text-black/60">Check-out</span>
            <span className="text-[15px] font-medium">{hotel.checkoutTime}</span>
          </li>
        )}
        {data.stay && (
          <li className="flex items-center gap-3 rounded-[22px] bg-paper px-4 py-3.5">
            <span className="grid size-9 place-items-center rounded-full bg-white">
              <CalendarCheck className="size-4" />
            </span>
            <span className="flex-1 text-[15px] text-black/60">Your stay ends</span>
            <span className="text-[15px] font-medium">
              {new Date(data.stay.expectedCheckOutAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: hotel.timezone })}
            </span>
          </li>
        )}
        {hotel.phone && (
          <li>
            <a href={`tel:${hotel.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-[22px] bg-paper px-4 py-3.5 transition hover:bg-panel">
              <span className="grid size-9 place-items-center rounded-full bg-lime">
                <Phone className="size-4" />
              </span>
              <span className="flex-1 text-[15px] text-black/60">Call us</span>
              <span className="text-[15px] font-medium tabular-nums">{hotel.phone}</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

// ---- links ----------------------------------------------------------------------

const GLYPHS = [Star4, Clover, Ring];

function LinksPanel({ tile, data }: PanelProps) {
  const items = itemsFor(data, tile.section).filter((i) => i.kind === "link" || i.kind === "info");
  return (
    <div>
      <Lead>{tile.blurb}</Lead>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item, i) => {
          const Glyph = GLYPHS[i % GLYPHS.length];
          const first = i === 0;
          return (
            <motion.article key={item.id} className={cn("flex min-h-[220px] flex-col rounded-[26px] p-5", first ? "bg-ink text-white" : "bg-paper")} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <Glyph className={cn("size-8", first ? "text-lime" : "text-ink")} />
              <h3 className="mt-auto pt-8 text-xl font-medium">{item.title}</h3>
              {item.description && <p className={cn("mt-1 text-[14px] leading-snug", first ? "text-white/60" : "text-black/55")}>{item.description}</p>}
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={cn("mt-4 inline-flex w-max items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition", first ? "bg-white/10 hover:bg-white/20" : "bg-white hover:bg-ink hover:text-white")}>
                  Visit website
                  <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </motion.article>
          );
        })}
      </div>
      {items.length === 0 && <Empty text="Nothing here yet." />}
    </div>
  );
}

// ---- late check-out -------------------------------------------------------------

function CheckoutPanel({ tile, data, onSent }: PanelProps) {
  const create = useMutation(api.guest.requests.create);
  const { token } = useGuestAccess();
  const { busy, error, send } = useSend(onSent);
  const options = tile.options ?? [];
  const [time, setTime] = useState(options[1] ?? options[0] ?? "");
  const item = itemByKey(data, tile.itemKey);
  const available = item !== undefined && Boolean(item.departmentName) && options.length > 0;

  return (
    <Columns
      main={
        <>
          <Lead>Standard check-out is {data.hotel.checkoutTime ?? "12:00"}. A later time depends on availability, and reception confirms it.</Lead>
          {options.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Check-out time">
              {options.map((option) => (
                <button key={option} type="button" role="radio" aria-checked={option === time} onClick={() => setTime(option)} className="relative rounded-[22px] px-4 py-5 text-center ring-1 ring-black/10 sm:py-6">
                  {option === time && <motion.span layoutId={`checkout-panel-time-${tile.id}`} className="absolute inset-0 rounded-[22px] bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative block text-2xl font-medium tabular-nums sm:text-3xl">{option}</span>
                  <span className="relative mt-1 block text-[12px] text-black/55">until</span>
                </button>
              ))}
            </div>
          )}
          {available ? (
            <SendBar busy={busy} error={error} disabled={!time} label={`Request check-out at ${time}`} onClick={() => send((key) => create({ token: token!, key, itemId: item.id as CatalogId, detail: `Until ${time}` }), "Late check-out requested")} />
          ) : (
            <p className="mt-6 rounded-[20px] bg-paper px-4 py-3 text-center text-[14px] text-black/55">Ask reception about a later check-out.</p>
          )}
        </>
      }
      aside={tile.howItWorks?.length ? <HowItWorks steps={stepsFor(tile, [time])} /> : undefined}
    />
  );
}

// ---- info -----------------------------------------------------------------------

function InfoPanel({ tile }: PanelProps) {
  return (
    <div className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-black/75">
      {(tile.body ?? "").split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}
