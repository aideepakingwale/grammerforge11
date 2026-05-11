import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "GrammarForge 11+",
  description: "AI-powered UK 11+ Grammar School exam preparation SaaS."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
