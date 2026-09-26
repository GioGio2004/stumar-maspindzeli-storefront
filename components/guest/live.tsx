"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import type { api } from "@/lib/convex/api";
import { GuestHome } from "./guest-home";
import { InactiveLink } from "./inactive-link";

// Server-rendered first frame, then live: admin edits appear without a reload.

export function LiveBySlug({ preloaded }: { preloaded: Preloaded<typeof api.guest.storefront.bySlug> }) {
  const data = usePreloadedQuery(preloaded);
  if (!data) return <InactiveLink />;
  return <GuestHome data={data} token={null} />;
}

export function LiveByToken({ preloaded, token }: { preloaded: Preloaded<typeof api.guest.storefront.byToken>; token: string }) {
  const data = usePreloadedQuery(preloaded);
  if (!data) return <InactiveLink />;
  return <GuestHome data={data} token={token} />;
}
