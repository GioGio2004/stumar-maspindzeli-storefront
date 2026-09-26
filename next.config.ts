import type { NextConfig } from "next";

// The admin embeds this app in its live preview. When ADMIN_APP_URL is set,
// only the admin (and this site) may frame it.
const admin = process.env.ADMIN_APP_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Room tokens live in the URL path; never leak them to other sites.
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(admin ? [{ key: "Content-Security-Policy", value: `frame-ancestors 'self' ${admin}` }] : []),
        ],
      },
      {
        source: "/r/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
