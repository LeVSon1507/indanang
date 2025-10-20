import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
  description: "Tìm phòng trọ giá rẻ tại Đà Nẵng",
  openGraph: {
    title: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
    description:
      "Ứng dụng tìm phòng trọ giá rẻ tại Đà Nẵng, hỗ trợ lọc theo giá, quận, diện tích.",
    siteName: "Ở Đà Nẵng",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary",
    title: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
    description:
      "Tìm phòng trọ giá rẻ tại Đà Nẵng, lọc theo giá, quận, diện tích.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
