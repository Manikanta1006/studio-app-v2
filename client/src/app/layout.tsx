import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3D Dental Studio - Treatment Planning Platform",
  description: "Advanced 3D dental treatment planning software for orthodontic case management, teeth visualization, and step-wise treatment progression.",
  keywords: ["3D Dental", "Treatment Plan", "Orthodontics", "Clear Aligners", "Dental CAD", "Teeth Visualization"],
  authors: [{ name: "3D Dental Studio" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "3D Dental Studio",
    description: "Advanced 3D dental treatment planning software",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
