import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Room links (/r/<token>) act as the room's key; crawlers must never index them.
    rules: { userAgent: "*", allow: "/", disallow: "/r/" },
  };
}
