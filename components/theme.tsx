"use client";

import { AnimatePresence, motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { useSyncExternalStore, type ReactNode } from "react";

// next-themes sets the theme with an inline script in the server HTML. If React
// ever renders it on the client (e.g. recovering from an error), React 19 warns
// about script tags; marking it as a JSON data block there keeps it quiet. The
// script carries suppressHydrationWarning, so the differing type is fine.
const scriptProps = { type: typeof window === "undefined" ? "text/javascript" : "application/json" };

/** Follows the guest's phone setting by default. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange scriptProps={scriptProps}>
      {children}
    </NextThemes>
  );
}

const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

const ORDER = ["system", "light", "dark"] as const;
const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: "Theme: follows your device", light: "Theme: light", dark: "Theme: dark" };

/** One round button that cycles system → light → dark. */
export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = (mounted ? theme ?? "system" : "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICON[current] ?? Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${LABEL[current]}. Switch to ${next}.`}
      title={LABEL[current]}
      className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-black/5 transition hover:bg-panel-hover"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          initial={{ y: 16, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -16, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.25 }}
        >
          <Icon className="size-[18px]" />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
