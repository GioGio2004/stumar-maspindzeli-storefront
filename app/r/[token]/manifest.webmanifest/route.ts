// Installing from a room link must reopen that room, not browse mode.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const safe = token.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const manifest = {
    name: "Guest app",
    short_name: "Guest",
    id: `/r/${safe}`,
    start_url: `/r/${safe}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "X-Robots-Tag": "noindex" },
  });
}
