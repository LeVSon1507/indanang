"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, toggleLang } = useI18n();
  return (
    <button
      onClick={toggleLang}
      className="text-sm border-2 border-black px-2 py-1 rounded bg-white hover:bg-[#a0e7e5] shadow-[4px_4px_0_0_#000]"
      aria-label="Toggle language"
      title={lang === "vi" ? "Chuyển sang English" : "Switch to Vietnamese"}
    >
      {lang === "vi" ? "VI" : "EN"}
    </button>
  );
}
