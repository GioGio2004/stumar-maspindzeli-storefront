"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronUp, LoaderCircle, Star } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/convex/api";
import type { GuestTask } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import { statusLabel, statusOrder, type RequestStatus } from "./hooks";

/** Floating "my requests" pill. Live: it moves the moment staff accept or finish. */
export function Tracker({ token }: { token: string | null }) {
  const tasks = useQuery(api.guest.requests.list, token ? { token } : "skip");
  const [open, setOpen] = useState(false);
  const visible = (tasks ?? []).filter((t) => t.status !== "cancelled");
  const latest = visible[0];
  const active = visible.filter((t) => t.status !== "done").length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <AnimatePresence>
        {latest && (
          <motion.div
            className="pointer-events-auto w-full max-w-md"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
          >
            <AnimatePresence>
              {open && (
                <motion.ul
                  id="request-list"
                  className="mb-2 max-h-[55vh] space-y-2 overflow-y-auto rounded-[26px] bg-white p-2.5 shadow-2xl ring-1 ring-black/5"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {visible.map((task) => (
                    <RequestRow key={task.id} task={task} token={token!} />
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="request-list"
              className="flex w-full items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-4 text-left text-white shadow-2xl"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-black">
                {latest.status === "done" ? <Check className="size-4" strokeWidth={2.5} /> : <LoaderCircle className="size-4 animate-spin" />}
              </span>
              <span className="min-w-0 flex-1" aria-live="polite">
                <span className="block truncate text-sm font-medium">
                  {latest.title}
                  {latest.quantity && latest.quantity > 1 && !latest.title.startsWith("Order") ? ` ×${latest.quantity}` : ""}
                </span>
                <span className="block truncate text-[12px] text-white/60">
                  {statusLabel[latest.status as RequestStatus]} · {latest.departmentName}
                </span>
              </span>
              {visible.length > 1 && <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[12px]">{active > 0 ? `${active} active` : "All done"}</span>}
              <ChevronUp className={cn("size-4 shrink-0 transition-transform", open ? "rotate-0" : "rotate-180")} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequestRow({ task, token }: { task: GuestTask; token: string }) {
  const rate = useMutation(api.guest.requests.rate);
  const status = task.status as RequestStatus;
  const step = statusOrder.indexOf(status);
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
      {status === "done" && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-black/50">{task.rating ? "Thanks for rating!" : "How did we do?"}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} out of 5`}
                onClick={() => rate({ token, taskId: task.id, rating: n }).catch(() => {})}
                className="grid size-8 place-items-center rounded-full hover:bg-white"
              >
                <Star className={cn("size-4", (task.rating ?? 0) >= n ? "fill-ink text-ink" : "text-black/25")} />
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
