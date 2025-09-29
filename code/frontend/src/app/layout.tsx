import type { Metadata } from "next";
import { Geist, Geist_Mono, Sanchez } from "next/font/google";
import { PageTransitions } from "./ClientBoundary";
import "./globals.css";
import Header from "@/component/ui/Header";
import { getLoginCookie } from "@/actions/auth";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sanchez = Sanchez({
  variable: "--font-sanchez",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Kickaas",
  description: "Your Event Manager",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = await getLoginCookie();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sanchez.variable} antialiased`}
      >
        <PageTransitions>
          <Header cookie={cookie?.value || ""} />

          {children}
        </PageTransitions>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
