import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloud Weather Fleet Dashboard",
  description:
    "Weather analytics and risk monitoring for logistics and fleet operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b bg-card/60 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  WX
                </div>
                <div>
                  <p className="text-base font-semibold">Cloud Weather Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Operational insight for fleets and logistics teams
                  </p>
                </div>
              </div>
              <nav className="flex items-center gap-2 text-sm font-medium">
                {[
                  { href: "/", label: "Overview" },
                  { href: "/comparison", label: "Location Comparison" },
                  { href: "/live", label: "Live Monitor" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
