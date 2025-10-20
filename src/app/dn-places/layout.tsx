import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Địa điểm Đà Nẵng",
  description: "Xem danh sách địa điểm theo loại và tìm kiếm",
};

export default function DnPlacesLayout({ children }: { children: ReactNode }) {
  return <section>{children}</section>;
}
