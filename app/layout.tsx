import type { Metadata } from "next";
import Link from "next/link";
import About from "@/components/About";
import SoundToggle from "@/components/SoundToggle";
import { Anton, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", variable: "--font-anton", subsets: ["latin"] });
const plex = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SWERVE — an AI moral machine",
  description:
    "The Moral Machine experiment, replicated on AI models. Who does the machine choose?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${anton.variable} ${plex.variable} min-h-dvh font-mono antialiased`}>
        <div className="hazard h-1.5 w-full" />
        <nav className="flex items-center gap-6 border-b border-line px-6 py-3 md:px-10">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="display text-2xl leading-none text-paint">SWERVE</span>
            <span className="text-[10px] tracking-[0.28em] text-ink-faint">
              AN AI MORAL MACHINE
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-5 text-[11px] tracking-[0.24em] text-ink-muted">
            <Link href="/" className="hover:text-paint">
              JUDGE
            </Link>
            <Link href="/designer" className="hover:text-paint">
              DESIGN
            </Link>
            <Link href="/results" className="hover:text-paint">
              RESULTS
            </Link>
            <SoundToggle />
            <About />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
