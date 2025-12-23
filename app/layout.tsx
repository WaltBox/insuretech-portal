import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
