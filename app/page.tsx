import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { HotelDirectory } from "@/components/guest/hotel-directory";
import { api } from "@/lib/convex/api";

export const metadata: Metadata = { title: "Choose your hotel · Guest" };

// Every hotel from Convex, each opening /h/<slug>. Room tags open /r/<token> instead.
export default async function Home() {
  const preloaded = await preloadQuery(api.guest.storefront.directory, {});
  return <HotelDirectory preloaded={preloaded} />;
}
