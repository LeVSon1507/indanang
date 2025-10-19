export function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

export function parsePrice(text) {
  const cleaned = (text || "").toLowerCase();
  const match = cleaned.match(/([0-9][0-9\.,]*)/);
  if (!match) return 0;
  const num = Number(match[1].replace(/\./g, "").replace(/,/g, ""));
  if (cleaned.includes("triệu")) return num * 1_000_000;
  if (cleaned.includes("k") || cleaned.includes("nghìn")) return num * 1_000;
  return num; // assume VND
}

export function detectDistrict(text) {
  const t = (text || "").toLowerCase();
  const districts = [
    "hải châu",
    "thanh khê",
    "sơn trà",
    "ngũ hành sơn",
    "cẩm lệ",
    "liên chiểu",
    "hòa vang",
  ];
  const found = districts.find((d) => t.includes(d));
  if (!found) return "";
  return found
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}