"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Star, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Star4 } from "./glyphs";

export type Step = { title: string; body: string; icon: LucideIcon; tag?: string };
export type Tone = "light" | "dark";

const STEP_MS = 3200;
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Auto-playing explainer shown beside every actionable panel. Steps advance on
 * their own, can be picked by hand, and hold still for reduced-motion users.
 */
export function HowItWorks({
  steps,
  tone = "light",
  visual,
}: {
  steps: Step[];
  tone?: Tone;
  visual?: (step: number) => ReactNode;
}) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const dark = tone === "dark";

  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => window.clearTimeout(t);
  }, [active, reduce, steps.length]);

  return (
    <section
      aria-label="How it works"
      className={cn("rounded-[26px] p-3 sm:p-4", dark ? "bg-white/[0.06]" : "bg-panel")}
    >
      <p
        className={cn(
          "flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wider",
          dark ? "text-white/55" : "text-black/50",
        )}
      >
        <Star4 className="size-3" />
        How it works
      </p>

      <div
        className={cn(
          "relative mt-3 h-48 overflow-hidden rounded-[20px]",
          dark ? "bg-white/[0.06]" : "bg-white",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0 grid place-items-center p-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease }}
          >
            {visual ? visual(active) : <IconVisual step={steps[active]} dark={dark} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ol className="mt-2 space-y-1">
        {steps.map((step, i) => {
          const on = i === active;
          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={on ? "step" : undefined}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl px-3 py-2.5 text-left transition-colors",
                  on ? (dark ? "bg-white/10" : "bg-white") : dark ? "hover:bg-white/5" : "hover:bg-white/60",
                )}
              >
                <span className="flex gap-3">
                  <span className={cn("pt-px text-[12px] tabular-nums", dark ? "text-white/45" : "text-black/40")}>
                    0{i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{step.title}</span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          className={cn("block overflow-hidden text-[13px] leading-snug", dark ? "text-white/65" : "text-black/60")}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                        >
                          <span className="block pt-0.5">{step.body}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </span>
                {on && !reduce && (
                  <motion.span
                    key={`progress-${active}`}
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[3px] rounded-full bg-lime"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function IconVisual({ step, dark }: { step: Step; dark: boolean }) {
  const Icon = step.icon;
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.span
        className={cn(
          "grid size-16 place-items-center rounded-full shadow-sm",
          dark ? "bg-white text-black" : "bg-panel text-ink",
        )}
        initial={{ scale: 0.6, rotate: -14 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <Icon className="size-7" />
      </motion.span>
      {step.tag && (
        <motion.span
          className="rounded-full bg-lime px-3 py-1 text-[12px] font-medium text-black"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3 }}
        >
          {step.tag}
        </motion.span>
      )}
    </div>
  );
}

// ---- flagship visual: a room request travelling to the right team ----------

export type FlowItem = { label: string; icon: LucideIcon };

/** The request visual: picked item, routed to one team only, tracked, done. */
export function RequestFlowVisual({
  step,
  roomLabel,
  picks,
  team,
  otherTeams,
}: {
  step: number;
  roomLabel: string;
  picks: FlowItem[];
  team: string;
  otherTeams: string[];
}) {
  const PICK = picks.slice(0, 3);
  const ROUTE = [team, ...otherTeams.filter((t) => t !== team)].slice(0, 4);
  if (step === 0) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {PICK.map((item, i) => {
          const Icon = item.icon;
          const chosen = i === 0;
          return (
            <motion.span
              key={item.label}
              className="relative inline-flex items-center gap-2 rounded-full bg-panel px-3 py-2 text-[13px]"
              animate={chosen ? { backgroundColor: ["#ecebe8", "#e6fb2d"], scale: [1, 0.94, 1] } : undefined}
              transition={{ delay: 0.5, duration: 0.45 }}
            >
              <Icon className="size-3.5" />
              {item.label}
              {chosen && (
                <motion.span
                  className="rounded-full bg-ink px-1.5 text-[11px] font-medium text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 400, damping: 18 }}
                >
                  ×2
                </motion.span>
              )}
              {chosen && (
                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-3 left-6 size-6 rounded-full border-2 border-ink bg-white/60"
                  initial={{ opacity: 0, x: 30, y: 24 }}
                  animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, scale: [1, 1, 0.8, 1] }}
                  transition={{ duration: 0.9, times: [0, 0.3, 0.7, 1] }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-[12px] text-white">
          <span className="size-1.5 rounded-full bg-lime" />
          {PICK[0]?.label ?? "Request"} ×2 · {roomLabel}
        </span>
        <motion.span
          aria-hidden="true"
          className="h-5 w-px bg-ink/40"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ originY: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
        <div className="grid w-full grid-cols-2 gap-1.5">
          {ROUTE.map((dept) => {
            const target = dept === team;
            return (
              <motion.span
                key={dept}
                className="relative rounded-full px-2 py-1.5 text-center text-[12px] ring-1 ring-black/10"
                initial={{ opacity: 1 }}
                animate={
                  target
                    ? { backgroundColor: "#e6fb2d", scale: [1, 1.06, 1] }
                    : { opacity: 0.35, scale: 0.96 }
                }
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                {dept}
                {target && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ink"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                  />
                )}
              </motion.span>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const rows = [
      { label: "Sent", note: "just now" },
      { label: "Accepted", note: "by Nino" },
      { label: "On the way", note: "about 5 min" },
    ];
    return (
      <ol className="w-full max-w-[240px] space-y-2">
        {rows.map((row, i) => (
          <motion.li
            key={row.label}
            className="flex items-center gap-2.5 text-[13px]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.45 }}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full",
                i < 2 ? "bg-ink text-white" : "bg-lime text-black",
              )}
            >
              {i < 2 ? (
                <Check className="size-3.5" />
              ) : (
                <motion.span
                  className="size-2 rounded-full bg-ink"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </span>
            <span className="flex-1 font-medium">{row.label}</span>
            <span className="text-[12px] text-black/45">{row.note}</span>
          </motion.li>
        ))}
        <li className="pl-8">
          <span className="block h-1 overflow-hidden rounded-full bg-black/10">
            <motion.span
              className="block h-full rounded-full bg-ink"
              initial={{ width: "8%" }}
              animate={{ width: "72%" }}
              transition={{ delay: 1.2, duration: 1.6, ease }}
            />
          </span>
        </li>
      </ol>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.span
        className="grid size-16 place-items-center rounded-full bg-lime"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <Check className="size-8" strokeWidth={2.5} />
      </motion.span>
      <div className="flex gap-1" aria-label="Rated 5 out of 5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 400, damping: 16 }}
          >
            <Star className="size-5 fill-ink text-ink" />
          </motion.span>
        ))}
      </div>
    </div>
  );
}
