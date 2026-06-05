import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ShopHub — Online Shopping for Everything You Need",
  description:
    "Your one-stop shop for everything you need. Quality products, unbeatable prices, and fast delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${syne.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
