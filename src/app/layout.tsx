import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Syne } from "next/font/google";
import "./globals.css";
import "./daylora.css";
import { Toaster } from "@/components/ui/sonner";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Daylora — Homepage",
  description:
    "Over 1,000 everyday essentials — from headphones to cookware — at prices that make sense.",
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
