export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export const formatVNDLocale = (n: number, lang: "vi" | "en") =>
  new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND" }).format(n);

export const formatDate = (d: string | Date, lang: "vi" | "en") =>
  new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(typeof d === "string" ? new Date(d) : d);

export const formatDateVI = (d: string | Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(typeof d === "string" ? new Date(d) : d);