import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Ở Đà Nẵng — Danh sách phòng",
  description: "Tìm phòng trọ giá rẻ tại Đà Nẵng",
};

export default function ApartmentLayout({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
}