import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const display = Geist({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://celnoia.com"),
  title: {
    default: "Celnoia — Birthday Experiences & Celebrations",
    template: "%s | Celnoia",
  },
  description: "Premium birthday experiences, protected payments, and warm guest support. Create your birthday profile, share your wishlist, and celebrate in style.",
  keywords: ["birthday experiences", "birthday celebrations", "birthday gifts", "birthday planning", "celebration events"],
  authors: [{ name: "Celnoia", url: "https://celnoia.com" }],
  creator: "Celnoia",
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://celnoia.com",
    siteName: "Celnoia",
    title: "Celnoia — Birthday Experiences & Celebrations",
    description: "Premium birthday experiences, protected payments, and warm guest support.",
    images: [{ url: "/celnoia-logo.png", width: 1200, height: 630, alt: "Celnoia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Celnoia — Birthday Experiences & Celebrations",
    description: "Premium birthday experiences, protected payments, and warm guest support.",
    images: ["/celnoia-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
