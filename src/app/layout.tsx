import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Syne } from "next/font/google";
import "./globals.css";
import "./daylora.css";
import "./daylora-shop.css";
import "./daylora-account.css";
import "./daylora-home.css";
import "./daylora-plp.css";
import "./daylora-pdp.css";
import "./daylora-help.css";
import "./daylora-sell.css";
import "./daylora-cart.css";
import "./daylora-checkout.css";
import "./daylora-customer.css";
import "./daylora-refine.css";
import "./daylora-app.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

/** FR-IN-05: Google Analytics 4, when a measurement id is configured. */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  // Absolute canonical and Open Graph URLs (NFR-04).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Ecommerce Collections", template: "%s | Ecommerce Collections" },
  description:
    "Over 1,000 everyday essentials — from headphones to cookware — at prices that make sense.",
  // Added to a phone's home screen, the storefront opens like an app (design 01-homepage_1_2 v3).
  appleWebApp: { capable: true, title: "EC Store", statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes" },
};

/** viewport-fit=cover lets the app-mode header and tab bar pad around the notch and home indicator. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${syne.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
