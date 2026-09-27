import type { Metadata, Viewport } from "next";
import { Caveat, Noto_Sans_Georgian, Red_Hat_Display } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Intro } from "@/components/guest/intro";
import { ThemeProvider } from "@/components/theme";
import "./globals.css";

const redHat = Red_Hat_Display({
  variable: "--font-red-hat",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

// Red Hat Display has no Georgian glyphs; this fills them in.
const georgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  // Only needed when Georgian text is on screen; the browser fetches it on demand.
  preload: false,
});

export const metadata: Metadata = {
  title: "Guest",
  description: "Room requests, the water park, spa, dining and a concierge for your stay.",
  applicationName: "Guest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Guest" },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // The image itself comes from app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: "Stumar Maspindzeli",
    title: "Stumar Maspindzeli · Guest app",
    description: "Room requests, dining, spa and a concierge for your stay, one tap away.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // The phone keyboard shrinks the page instead of covering the AI chat's input.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${redHat.variable} ${caveat.variable} ${georgian.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <ConvexClientProvider>
            {/* Loading screen first, whichever page the guest opens (QR, NFC tag, installed app). */}
            <Intro>{children}</Intro>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
