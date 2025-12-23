import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beagle Portal",
  description: "Beagle Property Management Portal - Manage properties, enrollments, and claims",
  icons: {
    icon: "https://app.beagleforpm.com/favicon-prod.png",
    shortcut: "https://app.beagleforpm.com/favicon-prod.png",
    apple: "https://app.beagleforpm.com/favicon-prod.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
