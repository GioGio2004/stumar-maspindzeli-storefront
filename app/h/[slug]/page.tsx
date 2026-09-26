import type { Metadata } from "next";
import { fetchQuery, preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { notFound } from "next/navigation";
import { LiveBySlug } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

export async function generateMetadata({ params }: PageProps<"/h/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchQuery(api.guest.storefront.bySlug, { slug });
  return data ? { title: `${data.hotel.name} · Guest`, description: data.settings.heroSubtitle } : { title: "Hotel not found" };
}

// Browse any hotel by its slug. The admin's live preview uses this route.
export default async function HotelPage({ params }: PageProps<"/h/[slug]">) {
  const { slug } = await params;
  const preloaded = await preloadQuery(api.guest.storefront.bySlug, { slug });
  if (preloadedQueryResult(preloaded) === null) notFound();
  return <LiveBySlug preloaded={preloaded} />;
}
