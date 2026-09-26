"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";

/** True while a panel covers the page: tile animations stop working in the background. */
export const AnimationsPaused = createContext(false);

/**
 * Counter that ticks every `ms`. Stays still for reduced-motion users, while
 * a panel is open, and while the tab is hidden, to spare low-end phones.
 */
export function useTicker(ms: number, enabled = true) {
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  const paused = useContext(AnimationsPaused);
  useEffect(() => {
    if (!enabled || reduce || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, ms);
    return () => window.clearInterval(id);
  }, [ms, enabled, reduce, paused]);
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
