import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "DS95 — Turn any learning goal into a 95-day plan",
    description: "Choose what you want to master. DS95 builds a personal AI syllabus, daily plan, direct learning resources and proof-of-learning projects.",
    icons: {
      icon: "/brand/ds95-logo.png",
      shortcut: "/brand/ds95-logo.png",
      apple: "/brand/ds95-logo.png",
    },
    openGraph: {
      title: "DS95 — Your AI learning system",
      description: "One goal. A personal syllabus. 95 days of focused progress.",
      images: [{ url: new URL("/og-dusk-workspace.png", base).toString(), width: 1200, height: 630, alt: "DS95 — Choose a goal and build it in 95 days." }],
    },
    twitter: { card: "summary_large_image", images: [new URL("/og-dusk-workspace.png", base).toString()] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
