import type { Metadata } from "next";
import { Fraunces, Newsreader, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Silent",
  description:
    "A live, ephemeral conversation. No messages, no history — just two people watching each other think.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fraunces.variable} ${newsreader.variable} ${inter.variable} bg-void text-white/90 font-ui antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
