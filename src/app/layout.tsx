import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stratos — AI Hedge Fund",
  description: "Paper trading dashboard for Palla Srinivasa Rao",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-white antialiased">{children}</body>
    </html>
  );
}