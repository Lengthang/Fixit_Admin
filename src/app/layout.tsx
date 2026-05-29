import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

// Distinctive pairing: Fraunces (characterful serif) for display,
// Plus Jakarta Sans for clean body text. Avoids the Inter/Roboto default look.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "FixIt Admin",
  description: "Operations console for the FixIt home-services platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="grain">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
