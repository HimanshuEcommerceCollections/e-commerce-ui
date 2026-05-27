import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Syne } from "next/font/google";
import ClientLayout from "@/components/shared/ClientLayout";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NexusCommerce — Multi-Vendor Marketplace",
  description: "The modern multi-vendor e-commerce platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ClientLayout>
        {children}
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
