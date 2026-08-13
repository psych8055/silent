import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shhh...",
  description: "Live conversation. Zero history.",
  openGraph: {
    title: "Shhh...",
    description: "Live conversation. Zero history.",
    images: [
      {
        url: "https://s3.nyuct.com/kwite.webp",
        width: 1200,
        height: 630,
        alt: "Shhh...",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shhh...",
    description: "Live conversation. Zero history.",
    images: ["https://s3.nyuct.com/kwite.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Noto+Serif+Gujarati:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-white/90 font-ui antialiased">
        {children}
      </body>
    </html>
  );
}
