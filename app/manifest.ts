import type { MetadataRoute } from "next";

// Guests can add the hotel app to their home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guest app",
    short_name: "Guest",
    description: "Room requests, the water park, spa, dining and a concierge for your stay.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
