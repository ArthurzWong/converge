import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  title: "CONVERGE — Turn complexity into clarity",
  description:
    "CONVERGE turns messy ideas, problems and notes into a clear visual story and actionable next steps.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${kalam.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
