import type { Metadata } from "next";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import { LiveBySlug } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

const slug = process.env.NEXT_PUBLIC_HOTEL_SLUG ?? "gino-seaside";

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchQuery(api.guest.storefront.bySlug, { slug });
  return data ? { title: `${data.hotel.name} · Guest`, description: data.settings.heroSubtitle } : {};
}

// Browse mode for the default hotel. Room tags open /r/<token> instead.
export default async function Home() {
  const preloaded = await preloadQuery(api.guest.storefront.bySlug, { slug });
  return <LiveBySlug preloaded={preloaded} />;
}
