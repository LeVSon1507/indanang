"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "vi" | "en";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const dictionary: Record<Lang, Record<string, string>> = {
  vi: {
    // Common
    brand_name: "Ở Đà Nẵng",
    nav_apartment: "Phòng trọ",
    nav_map: "Bản đồ",
    nav_places: "Địa điểm",

    // Home/apartment
    title_home: "Ở Đà Nẵng — Tìm trọ giá rẻ Đà Nẵng",
    found_rooms: "Tìm thấy {{count}} phòng",
    loading: "Đang tải…",
    error_loading: "Lỗi tải dữ liệu",
    error_loading_with_detail: "Lỗi tải dữ liệu: {{detail}}",
    open_map: "Mở bản đồ",
    subtitle_home:
      "Tìm phòng trọ giá rẻ tại Đà Nẵng, lọc theo giá, quận, diện tích...",

    // Filters
    query_placeholder: "Từ khóa (tiêu đề/địa chỉ)",
    price_min_placeholder: "Giá min (VND)",
    price_max_placeholder: "Giá max (VND)",
    district_all: "Tất cả quận/huyện",
    area_min_placeholder: "Diện tích min (m²)",
    area_max_placeholder: "Diện tích max (m²)",
    sort_price_asc: "Sắp xếp: Giá tăng dần",
    sort_price_desc: "Sắp xếp: Giá giảm dần",
    sort_recent: "Sắp xếp: Mới nhất",
    sort_area_desc: "Sắp xếp: Diện tích lớn",
    sort_area_asc: "Sắp xếp: Diện tích nhỏ",
    filter_owner_only: "Chính chủ",
    filter_has_images: "Có hình ảnh",
    filter_cheap_only: "Chỉ hiển thị giá ≤ {{cheap}} VND",
    source_label: "Nguồn: {{source}}",

    // Room card
    cheap_badge: "Giá rẻ",
    owner_badge: "Chính chủ",
    trust_score: "Độ tin cậy",
    source_prefix: "Nguồn:",
    posted_prefix: "Đăng:",
    view_source: "Xem nguồn",
    view_location: "Xem vị trí",
    no_image: "Không có hình",

    // Places page
    places_title: "Địa điểm Đà Nẵng",
    places_filter_hint: "Lọc theo category hoặc tìm kiếm bằng từ khóa.",
    places_instruction: "Lọc theo category hoặc tìm kiếm bằng từ khóa.",
    search_by_name_placeholder: "Tìm theo tên",
    search_name: "Tìm theo tên",
    no_places: "Không có địa điểm phù hợp.",
    more_info: "Xem thêm",
    see_more: "Xem thêm",
    open_gg_maps: "Mở GG Maps",

    // Map page
    map_title: "Bản đồ Đà Nẵng",
    map_hint: "Chọn vị trí trên bản đồ hoặc dùng AI để gợi ý địa điểm.",
    map_instruction: "Chọn vị trí trên bản đồ hoặc dùng AI để gợi ý địa điểm.",
    selected_location: "Vị trí đã chọn",
    picked_location: "Vị trí đã chọn",
    suggest_unsaved_prefix: "Gợi ý (chưa lưu):",
    suggestion_unsaved_prefix: "Gợi ý (chưa lưu):",
    add_to_map: "Thêm vào map",
    open_link: "Mở link",
    ai_query_placeholder: "Ví dụ: địa điểm hẹn hò lãng mạn",
    ai_suggest_button: "Gợi ý bằng AI",
    ai_suggest: "Gợi ý bằng AI",
    ai_suggest_loading: "Đang gợi ý…",
    ai_hint:
      "AI trả về danh sách địa điểm ở Đà Nẵng, bạn có thể thêm từng địa điểm vào bản đồ.",
    ai_suggest_explain:
      "AI trả về danh sách địa điểm ở Đà Nẵng, bạn có thể thêm từng địa điểm vào bản đồ.",
    manual_add: "Thêm thủ công",
    manual_add_toggle: "Thêm thủ công",
    pick_on_map_hint: "Bấm lên bản đồ để chọn lat/lng.",
    choose_latlng_hint: "Bấm lên bản đồ để chọn lat/lng.",
    manual_toggle_hint: 'Bật "Thêm thủ công" để nhập thông tin.',
    enable_manual_hint: 'Bật "Thêm thủ công" để nhập thông tin.',
    suggestions_label: "Gợi ý:",
    suggestions: "Gợi ý:",
    type_label: "Loại:",
    category_label: "Loại:",
    place_name: "Tên địa điểm",
    place_address_optional: "Địa chỉ (tuỳ chọn)",
    place_desc_optional: "Mô tả (tuỳ chọn)",
    alert_enter_title: "Nhập tiêu đề địa điểm",
    error_add_place_with_detail: "Lỗi thêm địa điểm: {{detail}}",
    error_suggest_with_detail: "Lỗi gợi ý: {{detail}}",
    error_add_suggestion_with_detail: "Lỗi thêm gợi ý: {{detail}}",
    category_date: "Hẹn hò",
    category_cafe: "Cà phê",
    category_restaurant: "Nhà hàng",
    category_bar: "Quán bar",
    category_entertainment: "Giải trí",
    category_scenic: "Cảnh đẹp",
    category_activity: "Hoạt động",
    category_cinema: "Rạp phim",
    category_park: "Công viên",
    category_museum: "Bảo tàng",
    category_beach: "Bãi biển",
  },
  en: {
    // Common
    brand_name: "In Danang",
    nav_apartment: "Rooms",
    nav_map: "Map",
    nav_places: "Places",

    // Home/apartment
    title_home: "Cheap Rooms — Find affordable rentals in Danang",
    found_rooms: "Found {{count}} rooms",
    loading: "Loading…",
    error_loading: "Error loading data",
    error_loading_with_detail: "Error loading data: {{detail}}",
    open_map: "Open Map",
    subtitle_home:
      "Find affordable rentals in Danang, filter by price, district, and area...",

    // Filters
    query_placeholder: "Keyword (title/address)",
    price_min_placeholder: "Min price (VND)",
    price_max_placeholder: "Max price (VND)",
    district_all: "All districts",
    area_min_placeholder: "Min area (m²)",
    area_max_placeholder: "Max area (m²)",
    sort_price_asc: "Sort: Price ascending",
    sort_price_desc: "Sort: Price descending",
    sort_recent: "Sort: Most recent",
    sort_area_desc: "Sort: Largest area",
    sort_area_asc: "Sort: Smallest area",
    filter_owner_only: "Owner listed",
    filter_has_images: "Has images",
    filter_cheap_only: "Only show price ≤ {{cheap}} VND",
    source_label: "Source: {{source}}",

    // Room card
    cheap_badge: "Cheap",
    owner_badge: "Owner",
    trust_score: "Trust score",
    source_prefix: "Source:",
    posted_prefix: "Posted:",
    view_source: "View source",
    view_location: "View location",
    no_image: "No image",

    // Places page
    places_title: "Danang Places",
    places_filter_hint: "Filter by category or search with keyword.",
    places_instruction: "Filter by category or search with keyword.",
    search_by_name_placeholder: "Search by name",
    search_name: "Search by name",
    no_places: "No matching places.",
    more_info: "More info",
    see_more: "More info",
    open_gg_maps: "Open GG Maps",

    // Map page
    map_title: "Danang Map",
    map_hint: "Pick a location on the map or use AI suggestions.",
    map_instruction: "Pick a location on the map or use AI suggestions.",
    selected_location: "Selected location",
    picked_location: "Selected location",
    suggest_unsaved_prefix: "Suggestion (unsaved):",
    suggestion_unsaved_prefix: "Suggestion (unsaved):",
    add_to_map: "Add to map",
    open_link: "Open link",
    ai_query_placeholder: "E.g., romantic dating spots",
    ai_suggest_button: "Suggest with AI",
    ai_suggest: "Suggest with AI",
    ai_suggest_loading: "Suggesting…",
    ai_hint: "AI returns places in Danang; add them to the map.",
    ai_suggest_explain: "AI returns places in Danang; add them to the map.",
    manual_add: "Manual add",
    manual_add_toggle: "Manual add",
    pick_on_map_hint: "Click on the map to pick lat/lng.",
    choose_latlng_hint: "Click on the map to pick lat/lng.",
    manual_toggle_hint: 'Enable "Manual add" to input details.',
    enable_manual_hint: 'Enable "Manual add" to input details.',
    suggestions_label: "Suggestions:",
    suggestions: "Suggestions:",
    type_label: "Type:",
    category_label: "Type:",
    place_name: "Place name",
    place_address_optional: "Address (optional)",
    place_desc_optional: "Description (optional)",
    alert_enter_title: "Enter place title",
    error_add_place_with_detail: "Error adding place: {{detail}}",
    error_suggest_with_detail: "Suggestion error: {{detail}}",
    error_add_suggestion_with_detail: "Error adding suggestion: {{detail}}",
    category_date: "Date",
    category_cafe: "Cafe",
    category_restaurant: "Restaurant",
    category_bar: "Bar",
    category_entertainment: "Entertainment",
    category_scenic: "Scenic",
    category_activity: "Activity",
    category_cinema: "Cinema",
    category_park: "Park",
    category_museum: "Museum",
    category_beach: "Beach",
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("app.lang") as Lang | null)
        : null;
    if (saved === "vi" || saved === "en") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app.lang", lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const dict = dictionary[lang] || {};
      let text = dict[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      return text;
    };
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === "vi" ? "en" : "vi"));

  const value: I18nContextValue = { lang, setLang, toggleLang, t };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
