"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL. Copy .env.example to .env.local.");
}

// Guests never sign in, so this is the plain provider: no auth tokens are sent.
const convex = new ConvexReactClient(url);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
