import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
  description: "Tìm phòng trọ giá rẻ tại Đà Nẵng",
  openGraph: {
    title: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
    description:
      "Lọc theo giá, quận, diện tích để tìm phòng trọ phù hợp tại Đà Nẵng.",
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

export default function ApartmentLayout({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
}