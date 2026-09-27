"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, ChevronUp, LoaderCircle, Sparkles, Star, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/convex/api";
import type { GuestTask } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { errorInfo, useGuestAccess } from "./access";
import { assistantMorph } from "./assistant";
import { statusLabel, statusOrder, type RequestStatus } from "./hooks";

/**
 * The bar at the bottom: live requests and the AI concierge side by side.
 * While a request is on its way the tracker takes the main stage and the
 * assistant waits as a small circle; once everything is delivered they swap.
 */
export function Dock({ inert, assistantOpen, onAssistant }: { inert?: boolean; assistantOpen: boolean; onAssistant: () => void }) {
  const { token, keyArg, unlocked } = useGuestAccess();
  const tasks = useQuery(api.guest.requests.list, token && unlocked ? { token, key: keyArg } : "skip");
  const [open, setOpen] = useState(false);
  const visible = (tasks ?? []).filter((t) => t.status !== "cancelled");
  const latest = visible[0];
  const active = visible.filter((t) => t.status !== "done").length;
  const trackerMain = latest !== undefined && active > 0;

  return (
    <div inert={inert} className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <motion.div
        className="pointer-events-auto w-full max-w-md"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
      >
        <AnimatePresence>
          {open && latest && (
            <motion.ul
              id="request-list"
              className="mb-2 max-h-[55vh] space-y-2 overflow-y-auto rounded-[26px] bg-white p-2.5 shadow-2xl ring-1 ring-black/5"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              {visible.map((task) => (
                <RequestRow key={task.id} task={task} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-end gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {latest && (
              <motion.button
                key="tracker"
                type="button"
                layout
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls="request-list"
                aria-label={trackerMain ? undefined : `My requests: ${active > 0 ? `${active} active` : "all done"}`}
                style={{ borderRadius: 9999 }}
                className={cn(
                  "flex items-center bg-ink text-left text-white shadow-2xl",
                  trackerMain ? "min-w-0 flex-1 gap-3 py-2 pl-2 pr-4" : "size-14 shrink-0 justify-center",
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={dockSpring}
              >
                <motion.span layout="position" className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-black">
                  {latest.status === "done" ? <Check className="size-4" strokeWidth={2.5} /> : <LoaderCircle className="size-4 animate-spin" />}
                </motion.span>
                {trackerMain && (
                  <>
                    <motion.span layout="position" className="min-w-0 flex-1" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
                      <span className="block truncate text-sm font-medium">
                        {latest.title}
                        {latest.quantity && latest.quantity > 1 && !latest.title.startsWith("Order") ? ` ×${latest.quantity}` : ""}
                      </span>
                      <span className="block truncate text-[12px] text-white/60">
                        {statusLabel[latest.status as RequestStatus]} · {latest.departmentName}
                      </span>
                    </motion.span>
                    {visible.length > 1 && (
                      <motion.span layout="position" className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[12px]">
                        {active} active
                      </motion.span>
                    )}
                    <ChevronUp className={cn("size-4 shrink-0 transition-transform", open ? "rotate-0" : "rotate-180")} />
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
          {!assistantOpen && <AskAiButton wide={!trackerMain} onClick={onAssistant} />}
        </div>
      </motion.div>
    </div>
  );
}

const dockSpring = { type: "spring", bounce: 0.18, duration: 0.55 } as const;

function AskAiButton({ wide, onClick }: { wide: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      layoutId="assistant-surface"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Ask AI"
      style={{ borderRadius: 9999 }}
      className={cn(
        "flex items-center bg-ink text-left text-white shadow-2xl",
        wide ? "min-w-0 flex-1 gap-3 py-2 pl-2 pr-4" : "size-14 shrink-0 justify-center",
      )}
      transition={assistantMorph}
    >
      {wide ? (
        <>
          <motion.span layout="position" className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-black">
            <Sparkles className="size-4" />
          </motion.span>
          <motion.span layout="position" className="min-w-0 flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            <span className="block truncate text-sm font-medium">Ask AI anything</span>
            <span className="block truncate text-[12px] text-white/60">Your concierge, in any language</span>
          </motion.span>
          <motion.span layout="position" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10">
            <ArrowUpRight className="size-4" />
          </motion.span>
        </>
      ) : (
        <motion.span layout="position" className="text-[13px] font-medium leading-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          Ask AI
        </motion.span>
      )}
    </motion.button>
  );
}

function RequestRow({ task }: { task: GuestTask }) {
  const { token, keyArg, clearKey } = useGuestAccess();
  const rate = useMutation(api.guest.requests.rate);
  const cancel = useMutation(api.guest.requests.cancel);
  const [error, setError] = useState<string | null>(null);
  const status = task.status as RequestStatus;
  const step = statusOrder.indexOf(status);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      const info = errorInfo(e);
      if (info.code === "PIN_REQUIRED") clearKey();
      setError(info.message);
    }
  };

  return (
    <li className="rounded-[20px] bg-paper p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {task.title}
            {task.quantity && task.quantity > 1 && !task.title.startsWith("Order") ? ` ×${task.quantity}` : ""}
          </p>
          <p className="truncate text-[12px] text-black/50">
            {task.departmentName}
            {task.detail ? ` · ${task.detail}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-medium">{statusLabel[status]}</span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {statusOrder.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
            <motion.span
              className={cn("block h-full rounded-full", i === step && status !== "done" ? "bg-lime" : "bg-ink")}
              initial={false}
              animate={{ width: i <= step ? "100%" : "0%" }}
              transition={{ duration: 0.5 }}
            />
          </span>
        ))}
      </div>
      {status === "open" && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => run(() => cancel({ token: token!, key: keyArg, taskId: task.id }))}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-medium ring-1 ring-black/10 transition hover:bg-ink hover:text-white"
          >
            <X className="size-3.5" />
            Cancel request
          </button>
        </div>
      )}
      {status === "done" && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-black/50">{task.rating ? "Thanks for rating!" : "How did we do?"}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} out of 5`}
                onClick={() => run(() => rate({ token: token!, key: keyArg, taskId: task.id, rating: n }))}
                className="grid size-8 place-items-center rounded-full hover:bg-white"
              >
                <Star className={cn("size-4", (task.rating ?? 0) >= n ? "fill-ink text-ink" : "text-black/25")} />
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </li>
  );
}
