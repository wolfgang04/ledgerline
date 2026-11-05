import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const publicSans = localFont({
  src: [
    { path: "./fonts/PublicSans-Regular.woff2", weight: "400" },
    { path: "./fonts/PublicSans-Medium.woff2", weight: "500" },
    { path: "./fonts/PublicSans-SemiBold.woff2", weight: "600" },
    { path: "./fonts/PublicSans-Bold.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--font-public-sans",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Ledgerline | Financial operations",
  description:
    "Plan budgets, authorize spending, and keep every financial decision in view.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
