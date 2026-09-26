import { preloadQuery } from "convex/nextjs";
import { LiveBySlug } from "@/components/guest/live";
import { api } from "@/lib/convex/api";

// Browse any hotel by its slug. The admin's live preview uses this route.
export default async function HotelPage({ params }: PageProps<"/h/[slug]">) {
  const { slug } = await params;
  const preloaded = await preloadQuery(api.guest.storefront.bySlug, { slug });
  return <LiveBySlug preloaded={preloaded} />;
}
