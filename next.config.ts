import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Room tokens live in the URL path; never leak them to other sites.
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "same-origin" }],
      },
      {
        source: "/r/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
