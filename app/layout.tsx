import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insur3Tech Portal",
  description: "Insur3Tech - Syndicated Real Estate Insurance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
