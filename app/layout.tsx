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
    title: "DataSprint 95 — Build skills that compound",
    description: "A focused 95-day data science and machine-learning learning sprint.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "DataSprint 95",
      description: "95 days. 178 hours. One job-ready data science portfolio.",
      images: [{ url: new URL("/og-dusk-workspace.png", base).toString(), width: 1200, height: 630, alt: "DataSprint 95 — Build skills daily. Stay on track." }],
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
