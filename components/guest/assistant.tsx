"use client";

import type { SyncStreamsReturnValue } from "@convex-dev/agent";
import { optimisticallySendMessage, useSmoothText, useUIMessages, type UIMessage } from "@convex-dev/agent/react";
import { useMutation } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUp, Check, ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, Minus, Plus, Sparkles, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/convex/api";
import { itemPhoto } from "@/lib/photos";
import { eventsToday, gel, itemsFor, orderable, type Item, type StorefrontData } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { errorInfo, useGuestAccess } from "./access";

// The AI concierge: a chat that knows the whole hotel and can send requests
// for the room. Replies stream in from Convex (convex/guest/ai.ts in the admin).

export const assistantMorph = { type: "spring", bounce: 0.14, duration: 0.6 } as const;

// The generated API marks `streams` optional; the agent hooks want the key
// present (it may still hold undefined).
const messagesQuery = api.guest.ai.messages as FunctionReference<
  "query",
  "public",
  FunctionArgs<typeof api.guest.ai.messages>,
  FunctionReturnType<typeof api.guest.ai.messages> & { streams: SyncStreamsReturnValue }
>;
const ease = [0.22, 1, 0.36, 1] as const;

// ---- the chat (thread id + secret, kept per room link or per hotel) ------------------

type Chat = { threadId: string; secret: string };

const storageKey = (token: string | null, slug: string) => `stumar.aiChat.${token ?? `hotel:${slug}`}`;

function readChat(key: string): Chat | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
    const chat = value as Partial<Chat> | null;
    return typeof chat?.threadId === "string" && typeof chat.secret === "string" ? { threadId: chat.threadId, secret: chat.secret } : null;
  } catch {
    return null;
  }
}

function writeChat(key: string, chat: Chat | null) {
  try {
    if (chat) window.localStorage.setItem(key, JSON.stringify(chat));
    else window.localStorage.removeItem(key);
  } catch {
    // private mode: the chat just starts over next time
  }
}

function useChat(token: string | null, slug: string) {
  const key = storageKey(token, slug);
  // The panel only mounts in the browser, after a tap, so localStorage is there.
  const [chat, setChat] = useState<Chat | null>(() => readChat(key));
  const { keyArg } = useGuestAccess();
  const start = useMutation(api.guest.ai.start);
  const clearChat = useMutation(api.guest.ai.clear);
  const sendMessage = useMutation(api.guest.ai.send).withOptimisticUpdate((store, args) =>
    optimisticallySendMessage(messagesQuery)(store, { threadId: args.threadId, prompt: args.prompt }),
  );

  const fresh = useCallback(async () => {
    const next = await start(token ? { token } : { slug });
    writeChat(key, next);
    setChat(next);
    return next;
  }, [start, token, slug, key]);

  const send = useCallback(
    async (prompt: string) => {
      const current = chat ?? (await fresh());
      const args = { prompt, token: token ?? undefined, key: keyArg };
      try {
        await sendMessage({ ...args, threadId: current.threadId, secret: current.secret });
      } catch (e) {
        const { code } = errorInfo(e);
        // The chat was for an earlier stay (or is gone): start a new one and resend.
        if (code !== "CHAT_NOT_FOUND" && code !== "CHAT_EXPIRED") throw e;
        const next = await fresh();
        await sendMessage({ ...args, threadId: next.threadId, secret: next.secret });
      }
    },
    [chat, fresh, sendMessage, token, keyArg],
  );

  // Forget the chat on this phone right away; the server deletes its messages.
  const clear = useCallback(() => {
    const current = chat;
    writeChat(key, null);
    setChat(null);
    if (current) clearChat({ threadId: current.threadId, secret: current.secret }).catch(() => {});
  }, [chat, clearChat, key]);

  return { chat, send, clear };
}

// ---- panel ----------------------------------------------------------------------------

export function AssistantPanel({ data, token, weekday, onClose }: { data: StorefrontData; token: string | null; weekday: number; onClose: () => void }) {
  const { unlocked } = useGuestAccess();
  const { chat, send, clear } = useChat(token, data.hotel.slug);
  const { results } = useUIMessages(messagesQuery, chat ? { threadId: chat.threadId, secret: chat.secret } : "skip", {
    initialNumItems: 40,
    stream: true,
  });
  const messages = (results as UIMessage[]).slice().sort((a, b) => a.order - b.order || a.stepOrder - b.stepOrder);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const last = messages.at(-1);
  const waiting = last !== undefined && (last.role === "user" || (last.status === "streaming" && !last.text && !last.parts.some(isToolPart)));
  const busy = sending || (last !== undefined && (last.role === "user" || last.status === "streaming" || last.status === "pending"));
  const stuck = useStuck(busy, last?.key);

  // Follow the conversation as it grows, including while a reply streams in.
  const tail = `${messages.length}:${last?.text.length ?? 0}:${last?.parts.length ?? 0}:${waiting}`;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [tail]);

  useEffect(() => {
    // Phones would pop the keyboard over the greeting; only focus with a mouse.
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  const ask = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || (busy && !stuck)) return;
    setError(null);
    setSending(true);
    setDraft("");
    try {
      await send(prompt);
    } catch (e) {
      setDraft(prompt);
      setError(errorInfo(e).message);
    } finally {
      setSending(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  const startOver = () => {
    clear();
    setDraft("");
    setError(null);
  };

  const brand = data.hotel.brandName ?? data.hotel.name;
  const canAct = Boolean(token) && unlocked;
  const suggestions = suggestionsFor(data, weekday, canAct);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "rgb(10 10 9 / 0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        layoutId="assistant-surface"
        transition={assistantMorph}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        style={{ borderRadius: 30 }}
        className="relative flex h-[min(88dvh,780px)] w-full max-w-2xl flex-col overflow-hidden bg-white text-foreground shadow-2xl"
      >
        <motion.div
          className="flex items-center gap-3 px-5 pt-5 sm:px-7 sm:pt-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.35 } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-black">
            <Sparkles className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="assistant-title" className="truncate text-2xl font-medium tracking-tight">
              Ask AI
            </h2>
            <p className="truncate text-[13px] text-black/55">
              {brand} concierge<span className="hidden sm:inline"> · any language</span>
            </p>
          </div>
          <AnimatePresence initial={false}>
            {messages.length > 0 && (
              <motion.button
                key="clear"
                type="button"
                onClick={startOver}
                aria-label="Clear chat"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-panel px-4 text-[13px] font-medium transition hover:bg-ink hover:text-white"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Trash2 className="size-4" />
                Clear
              </motion.button>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-panel transition hover:bg-ink hover:text-white"
          >
            <X className="size-5" />
          </button>
        </motion.div>

        <motion.div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-6"
          aria-live="polite"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.16, duration: 0.4, ease } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {messages.length === 0 ? (
              <motion.div key="welcome" className="h-full" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <Welcome brand={brand} canAct={canAct} hasRoom={Boolean(token)} suggestions={suggestions} onPick={ask} />
              </motion.div>
            ) : (
              <motion.div key={chat?.threadId ?? "chat"} className="space-y-3" exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}>
                {messages.map((message) => (
                  <MessageView key={message.key} message={message} data={data} canAct={canAct} />
                ))}
                <AnimatePresence>{waiting && <Typing key="typing" />}</AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </motion.div>

        <motion.form
          onSubmit={submit}
          className="border-t border-black/5 px-4 pb-4 pt-3 sm:px-6 sm:pb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {error && (
            <p role="alert" className="mb-2 px-2 text-[13px] text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="assistant-input">
              Message the AI concierge
            </label>
            <input
              ref={inputRef}
              id="assistant-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything, in any language"
              maxLength={1000}
              autoComplete="off"
              enterKeyHint="send"
              className="h-12 min-w-0 flex-1 rounded-full bg-panel px-5 text-base outline-none ring-1 ring-transparent transition placeholder:text-black/40 focus:ring-ink"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || (busy && !stuck)}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-lime text-black transition hover:scale-105 disabled:scale-100 disabled:opacity-40"
            >
              {busy && !stuck ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}

/** True once a reply has taken suspiciously long, so the guest can try again. */
function useStuck(busy: boolean, lastKey: string | undefined) {
  const [stuckKey, setStuckKey] = useState<string | null>(null);
  useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => setStuckKey(lastKey ?? ""), 45_000);
    return () => window.clearTimeout(t);
  }, [busy, lastKey]);
  return busy && stuckKey === (lastKey ?? "");
}

function suggestionsFor(data: StorefrontData, weekday: number, canAct: boolean): string[] {
  const out: string[] = [];
  if (eventsToday(data.events, weekday).length > 0) out.push("What's on today?");
  const request = orderable(itemsFor(data, "housekeeping"))[0];
  if (canAct && request) out.push(`${request.title}, please`);
  if (orderable(itemsFor(data, "dining")).length > 0) out.push(canAct ? "What can I order to my room?" : "What's on the menu?");
  out.push("რომელ საათამდე უნდა გავათავისუფლო ნომერი?");
  return out.slice(0, 4);
}

function Welcome({ brand, canAct, hasRoom, suggestions, onPick }: { brand: string; canAct: boolean; hasRoom: boolean; suggestions: string[]; onPick: (text: string) => void }) {
  const intro = canAct
    ? "Ask me anything about the hotel, or just tell me what you need. I'll send it straight to the right team."
    : hasRoom
      ? "Ask me anything about the hotel, the water park or the group's other hotels."
      : "Ask me anything about the hotel, the water park or the group's other hotels. To send requests, tap the tag in your room.";
  return (
    <div className="flex h-full flex-col justify-end px-1">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease }}>
        <p className="inline-block -rotate-2 font-script text-3xl text-black/70">Hi there!</p>
        <p className="mt-2 max-w-md text-[17px] leading-snug">
          I&apos;m the {brand} AI concierge. {intro}
        </p>
      </motion.div>
      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((text, i) => (
          <motion.button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="rounded-full bg-panel px-4 py-2.5 text-left text-[14px] transition hover:bg-ink hover:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.4, ease }}
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ---- messages ---------------------------------------------------------------------------

type Part = UIMessage["parts"][number];
type ToolPart = Extract<Part, { toolCallId: string }>;
type ToolResult = { ok?: boolean; error?: string; title?: string; team?: string; quantity?: number; detail?: string; items?: string[]; total?: string };

function isToolPart(part: Part): part is ToolPart {
  return part.type.startsWith("tool-") && "toolCallId" in part;
}

function MessageView({ message, data, canAct }: { message: UIMessage; data: StorefrontData; canAct: boolean }) {
  if (message.role === "user") {
    return (
      <motion.div className="flex justify-end" initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease }}>
        <p className="max-w-[88%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-ink px-5 py-3 text-[15px] leading-relaxed text-white">{message.text}</p>
      </motion.div>
    );
  }
  if (message.role !== "assistant") return null;

  // Consecutive text parts read as one bubble; tool calls show as action chips or menu cards.
  const blocks: ({ kind: "text"; text: string } | { kind: "tool"; part: ToolPart })[] = [];
  for (const part of message.parts) {
    if (part.type === "text") {
      const prev = blocks.at(-1);
      if (prev?.kind === "text") prev.text += part.text;
      else blocks.push({ kind: "text", text: part.text });
    } else if (isToolPart(part)) {
      blocks.push({ kind: "tool", part });
    }
  }
  const streaming = message.status === "streaming";
  const failed = message.status === "failed" && !blocks.some((b) => b.kind === "text" && b.text.trim());

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) =>
        block.kind === "tool" ? (
          block.part.type === "tool-show_menu" ? (
            <MenuCards key={block.part.toolCallId} part={block.part} data={data} canAct={canAct} />
          ) : (
            <ToolChip key={block.part.toolCallId} part={block.part} />
          )
        ) : block.text.trim() ? (
          <AssistantText key={`t${i}`} text={block.text} streaming={streaming && i === blocks.length - 1} />
        ) : null,
      )}
      {failed && <AssistantText text="Sorry, I couldn't answer that. Please try again." streaming={false} />}
    </div>
  );
}

function AssistantText({ text, streaming }: { text: string; streaming: boolean }) {
  const [visible] = useSmoothText(text, { startStreaming: streaming });
  return (
    <motion.div className="flex" initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease }}>
      <p className="max-w-[92%] whitespace-pre-wrap rounded-3xl rounded-bl-lg bg-panel px-5 py-3.5 text-[15px] leading-relaxed">{visible}</p>
    </motion.div>
  );
}

/** A small status pill: what a tool did, or is doing. */
function Chip({ tone, children }: { tone: "pending" | "ok" | "failed"; children: ReactNode }) {
  return (
    <motion.div
      className={cn(
        "flex w-max max-w-full items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-[13px] font-medium ring-1",
        tone === "failed" ? "bg-paper ring-black/10" : "bg-lime/25 ring-ink/70",
      )}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone === "failed" ? "bg-white" : "bg-lime text-black")}>
        {tone === "pending" ? <LoaderCircle className="size-3.5 animate-spin" /> : tone === "failed" ? <CircleAlert className="size-3.5" /> : <Check className="size-3.5" strokeWidth={2.5} />}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </motion.div>
  );
}

function ToolChip({ part }: { part: ToolPart }) {
  const name = part.type.slice("tool-".length);
  const result = (part.state === "output-available" ? part.output : undefined) as ToolResult | undefined;
  const pending = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error" || result?.ok === false;

  let label: string;
  if (pending) label = name === "cancel_request" ? "Cancelling…" : "Sending to the team…";
  else if (failed) label = result?.error ?? "That didn't go through";
  else if (name === "order_food") label = `Order sent to ${result?.team ?? "the kitchen"} · ${result?.items?.join(", ") ?? ""}${result?.total ? ` · ${result.total}` : ""}`;
  else if (name === "cancel_request") label = `Cancelled · ${result?.title ?? "request"}`;
  else label = `Sent to ${result?.team ?? "the team"} · ${result?.title ?? ""}${result?.quantity && result.quantity > 1 ? ` ×${result.quantity}` : ""}${result?.detail ? ` · ${result.detail}` : ""}`;

  return <Chip tone={pending ? "pending" : failed ? "failed" : "ok"}>{label}</Chip>;
}

// ---- menu cards --------------------------------------------------------------------------

type MenuOutput = { ok?: boolean; error?: string; title?: string; items?: { id: string }[] };

/**
 * The dishes the assistant picked, as a swipeable row of the dining panel's
 * cards: photo, price, details, Add. The order goes straight to the kitchen,
 * the same request as the In-room dining panel.
 */
function MenuCards({ part, data, canAct }: { part: ToolPart; data: StorefrontData; canAct: boolean }) {
  const createOrder = useMutation(api.guest.requests.createOrder);
  const { token, keyArg, clearKey } = useGuestAccess();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const rowRef = useRef<HTMLUListElement>(null);

  const output = (part.state === "output-available" ? part.output : undefined) as MenuOutput | undefined;
  if (part.state === "output-error") return <Chip tone="failed">Couldn&apos;t open the menu</Chip>;
  if (!output) return <Chip tone="pending">Opening the menu…</Chip>;
  const items = (output.items ?? []).map((o) => data.items.find((i) => i.id === o.id)).filter((i): i is Item => i !== undefined);
  if (output.ok === false || items.length === 0) return <Chip tone="failed">{output.error ?? "The menu is empty right now"}</Chip>;

  const lines = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const count = lines.reduce((n, i) => n + qty[i.id], 0);
  const total = lines.reduce((sum, i) => sum + (i.price ?? 0) * qty[i.id], 0);
  const set = (item: Item, n: number) => {
    setSent(null);
    setError(null);
    setQty((q) => ({ ...q, [item.id]: n }));
  };
  const scroll = (dir: 1 | -1) => {
    const row = rowRef.current;
    const card = row?.querySelector("li");
    if (row && card) row.scrollBy({ left: dir * (card.getBoundingClientRect().width + 8), behavior: "smooth" });
  };

  const order = async () => {
    if (busy || lines.length === 0 || !token) return;
    setBusy(true);
    setError(null);
    try {
      await createOrder({ token, key: keyArg, lines: lines.map((i) => ({ itemId: i.id, quantity: qty[i.id] })) });
      setSent(`Order sent to ${lines[0].departmentName ?? "the kitchen"} · ${gel(total)}`);
      setQty({});
    } catch (e) {
      const info = errorInfo(e);
      if (info.code === "PIN_REQUIRED") clearKey();
      setError(info.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div className="space-y-2.5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-[13px] font-medium">
          {output.title ?? "In-room dining"}
          <span className="text-black/45"> · {items.length}</span>
        </p>
        {items.length > 3 && (
          <span className="hidden shrink-0 gap-1 sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous dishes" className="grid size-8 place-items-center rounded-full bg-panel transition hover:bg-ink hover:text-white">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="More dishes" className="grid size-8 place-items-center rounded-full bg-panel transition hover:bg-ink hover:text-white">
              <ChevronRight className="size-4" />
            </button>
          </span>
        )}
      </div>

      {/* Bleeds to the panel edges so cards slide in from the side. */}
      <ul
        ref={rowRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const n = qty[item.id] ?? 0;
          const max = item.allowQuantity ? (item.maxQuantity ?? 9) : 1;
          const photo = itemPhoto(item);
          const can = canAct && Boolean(item.departmentName);
          return (
            <motion.li
              key={item.id}
              className={cn(
                "flex w-[46%] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] bg-paper ring-2 transition-shadow sm:w-[182px]",
                n > 0 ? "ring-lime" : "ring-transparent",
              )}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 5) * 0.05, duration: 0.4, ease }}
            >
              <div className="relative aspect-[4/3] bg-panel">
                {photo && <Image src={photo} alt={item.title} fill unoptimized sizes="(min-width: 640px) 182px, 46vw" className="object-cover" />}
                {item.price !== undefined && (
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[12px] font-medium tabular-nums text-black shadow-sm">{gel(item.price)}</span>
                )}
                <AnimatePresence>
                  {n > 0 && (
                    <motion.span
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-lime text-[12px] font-semibold tabular-nums text-black"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {n}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2.5">
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-tight">{item.title}</span>
                  {item.description && <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-black/50">{item.description}</span>}
                </span>
                {can && (
                  <span className="mt-auto">
                    {n > 0 && max > 1 ? (
                      <span className="flex h-8 items-center justify-between rounded-full bg-ink p-0.5 text-white">
                        <button type="button" onClick={() => set(item, n - 1)} aria-label={`Fewer ${item.title}`} className="grid size-7 place-items-center rounded-full hover:bg-white/15">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="text-[13px] font-medium tabular-nums" aria-live="polite">
                          {n}
                        </span>
                        <button
                          type="button"
                          onClick={() => set(item, n + 1)}
                          disabled={n >= max}
                          aria-label={`More ${item.title}`}
                          className="grid size-7 place-items-center rounded-full hover:bg-white/15 disabled:opacity-35"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => set(item, n > 0 ? 0 : 1)}
                        aria-pressed={n > 0}
                        className={cn(
                          "inline-flex h-8 w-full items-center justify-center gap-1 rounded-full px-3 text-[13px] font-medium transition",
                          n > 0 ? "bg-ink text-white" : "bg-white text-black hover:bg-ink hover:text-white",
                        )}
                      >
                        {n > 0 ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                        {n > 0 ? "Added" : "Add"}
                      </button>
                    )}
                  </span>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>

      {!canAct && <p className="px-1 text-[12px] text-black/50">Tap the tag in your room to order.</p>}
      <AnimatePresence initial={false}>
        {lines.length > 0 && (
          <motion.button
            key="order"
            type="button"
            onClick={order}
            disabled={busy}
            className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-ink pl-5 pr-1.5 text-[14px] font-medium text-white transition disabled:opacity-60"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease }}
          >
            <span className="truncate">
              Order to my room · {count} {count === 1 ? "item" : "items"} · {gel(total)}
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime text-black">
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      {sent && <Chip tone="ok">{sent}</Chip>}
      {error && (
        <p role="alert" className="px-1 text-[12px] text-red-600">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function Typing() {
  return (
    <motion.div className="flex" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <span className="inline-flex gap-1 rounded-3xl rounded-bl-lg bg-panel px-4 py-3.5" aria-label="The concierge is typing">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="size-1.5 rounded-full bg-black/50" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </span>
    </motion.div>
  );
}
