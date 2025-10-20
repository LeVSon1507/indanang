"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { btnSm } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const isActive = (href: string) => pathname?.startsWith(href);
  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`${btnSm} ${isActive(href) ? "bg-[#c0eb75]" : "bg-white"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b-2 border-black bg-[#f7f7f2] shadow-[6px_6px_0_0_#000]">
      <div className="max-w-6xl mx-auto p-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/apartment" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">
              {t("brand_name")}
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {navItem("/apartment", t("nav_apartment"))}
            {navItem("/dn-map", t("nav_map"))}
            {navItem("/dn-places", t("nav_places"))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
