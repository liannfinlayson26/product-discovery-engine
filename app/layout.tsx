import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Display serif with character — used for headlines and product names.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Warm, refined grotesk for body and UI text.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lens — Product Discovery Engine",
  description:
    "Photograph anything and find where to buy it online. Visual product identification and shopping links, powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
