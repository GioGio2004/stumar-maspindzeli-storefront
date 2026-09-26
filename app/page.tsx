import { preloadQuery } from "convex/nextjs";
import { LiveBySlug } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

// Browse mode for the default hotel. Room tags open /r/<token> instead.
export default async function Home() {
  const slug = process.env.NEXT_PUBLIC_HOTEL_SLUG ?? "gino-seaside";
  const preloaded = await preloadQuery(api.guest.storefront.bySlug, { slug });
  return <LiveBySlug preloaded={preloaded} />;
}
