import type { Metadata } from "next";
import { Geist, Geist_Mono, B612 } from "next/font/google";
import { Roboto_Mono } from 'next/font/google';
import "./globals.css";

const robotoMono = Roboto_Mono({ subsets: ['latin'] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const b612 = B612({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-b612",
  });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={` ${robotoMono.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
