import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kuba Cup",
  description: "Typuj wyniki Mistrzostw Świata 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="text-center text-xs text-gray-600 py-4">
            Kuba Cup &middot; MŚ 2026 &middot; made by Jakub Babula
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
