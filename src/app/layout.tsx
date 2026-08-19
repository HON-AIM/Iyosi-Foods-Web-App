import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://iyosifoods.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Iyosi Foods | Premium Food & Agro-Allied Products in Nigeria",
    template: "%s | Iyosi Foods",
  },
  description:
    "Iyosi Foods is a premier Nigerian food company delivering premium flour, sugar, rice, edible oils, and tomato paste. Shop online for quality food products delivered across Nigeria.",
  keywords: [
    "Iyosi Foods",
    "flour Nigeria",
    "baking flour",
    "semolina Nigeria",
    "wheat flour",
    "buy flour online Nigeria",
    "food products Nigeria",
    "sugar Nigeria",
    "rice Nigeria",
    "premium food brand",
  ],
  authors: [{ name: "Iyosi Foods", url: BASE_URL }],
  creator: "Iyosi Foods",
  publisher: "Iyosi Foods",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: BASE_URL,
    siteName: "Iyosi Foods",
    title: "Iyosi Foods | Premium Food & Agro-Allied Products",
    description:
      "Premier Nigerian food company delivering premium flour, sugar, rice, edible oils, and tomato paste.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iyosi Foods | Premium Food & Agro Products",
    description:
      "Shop premium flour, sugar, rice, and more. Quality food products delivered in Nigeria.",
    creator: "@iyosifoods",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href={BASE_URL} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.className} min-h-screen flex flex-col antialiased bg-surface-50 text-surface-900`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
