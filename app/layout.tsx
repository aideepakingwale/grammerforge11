import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrammarForge 11+",
  description: "AI-powered UK 11+ Grammar School exam preparation SaaS."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
