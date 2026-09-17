import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moral Machine — AI Edition",
  description: "The Moral Machine experiment, run on AI models.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}>
        <nav className="flex items-center gap-5 border-b border-line px-6 py-3 font-mono text-[11px] tracking-[0.22em] text-ink-muted md:px-10">
          <Link href="/" className="text-ink">
            MORAL MACHINE · AI EDITION
          </Link>
          <Link href="/" className="hover:text-ink">
            BATTERY
          </Link>
          <Link href="/designer" className="hover:text-ink">
            DESIGNER
          </Link>
          <a
            href="https://www.moralmachine.net"
            target="_blank"
            rel="noreferrer"
            className="ml-auto hover:text-ink"
          >
            ORIGINAL STUDY ↗
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}
