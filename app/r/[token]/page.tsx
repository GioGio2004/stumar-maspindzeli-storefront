import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { LiveByToken } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

export async function generateMetadata({ params }: PageProps<"/r/[token]">): Promise<Metadata> {
  const { token } = await params;
  return {
    // Room links carry the room's credential in the path. Keep them out of search.
    robots: { index: false, follow: false },
    manifest: `/r/${encodeURIComponent(token)}/manifest.webmanifest`,
  };
}

export default async function RoomPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  // Server-render the first frame, then the client keeps it live.
  const preloaded = await preloadQuery(api.guest.storefront.byToken, { token });
  const data = preloadedQueryResult(preloaded);
  return (
    <>
      {data && <title>{`${data.hotel.name} · Room ${data.room?.number ?? ""}`}</title>}
      <LiveByToken preloaded={preloaded} token={token} />
    </>
  );
}
