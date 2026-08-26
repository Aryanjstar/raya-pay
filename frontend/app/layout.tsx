import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-face",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-face",
});

export const metadata: Metadata = {
  title: "Raya Pay",
  description: "Spend dashboard and rewards for Digital Alpha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
