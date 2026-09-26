"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** Counter that ticks every `ms`. Stays at 0 when the guest prefers reduced motion. */
export function useTicker(ms: number, enabled = true) {
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!enabled || reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, enabled, reduce]);
  return tick;
}

/** Guest-facing words for the real task statuses staff move through. */
export type RequestStatus = "open" | "accepted" | "in_progress" | "done" | "cancelled";

export const statusLabel: Record<RequestStatus, string> = {
  open: "Sent",
  accepted: "Accepted",
  in_progress: "On the way",
  done: "Delivered",
  cancelled: "Cancelled",
};

export const statusOrder: RequestStatus[] = ["open", "accepted", "in_progress", "done"];
