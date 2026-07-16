import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SoundProvider } from "@/components/SoundProvider";
import { ToastProvider } from "@/components/ToastProvider";
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
  title: "作業の航海日誌",
  description: "作業の進捗を航海に見立てて記録するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <SoundProvider>
            <AuthGuard>
              <Header />
              {children}
            </AuthGuard>
          </SoundProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
