import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { LiveByToken } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

// Room links carry the room's credential in the path. Keep them out of search.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RoomPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  const preloaded = await preloadQuery(api.guest.storefront.byToken, { token });
  return <LiveByToken preloaded={preloaded} token={token} />;
}
