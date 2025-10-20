"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { PlaceCategory } from "@/types/place";
import { fetcher } from "@/lib/fetcher";
import { baseInput, btn } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";

type PlaceItem = {
  _id?: string;
  title: string;
  address?: string;
  category: PlaceCategory;
  location?: { type: "Point"; coordinates: [number, number] };
  url?: string;
};

const CATEGORIES: PlaceCategory[] = [
  "date",
  "cafe",
  "restaurant",
  "bar",
  "entertainment",
  "scenic",
  "activity",
  "cinema",
  "park",
  "museum",
  "beach",
];

export default function DnPlacesPage() {
  const [category, setCategory] = useState<PlaceCategory>("cafe");
  const [q, setQ] = useState("");

  const params = new URLSearchParams();
  params.set("limit", "500");
  params.set("category", category);
  if (q.trim()) params.set("q", q.trim());
  const url = `/api/places?${params.toString()}`;

  const { data, isLoading, error } = useSWR<PlaceItem[]>(url, fetcher);
  const places = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <main className="max-w-6xl mx-auto p-4">
        <div className="border-2 border-black rounded-lg p-4 bg-[#c0eb75] shadow-[8px_8px_0_0_#000] mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {t("places_title")}
          </h1>
          <p className="text-sm mt-1">
            {t("places_instruction")}
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/dn-map" className={btn}>
              {t("open_map")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 border-2 border-black rounded-lg p-3 bg-[#f7f7f2] shadow-[8px_8px_0_0_#000]">
            <div className="grid grid-cols-1 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                className={baseInput}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search_name")}
                className={baseInput}
              />
            </div>
          </div>

          <div className="md:col-span-2 border-2 border-black rounded-lg p-3 bg-white shadow-[8px_8px_0_0_#000]">
            {error && (
              <div className="text-red-700">
                {t("error_loading")}:{" "}{String(error)}
              </div>
            )}
            {isLoading && <div>{t("loading")}</div>}
            {!isLoading && places.length === 0 && (
              <div>{t("no_places")}</div>
            )}
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {places.map((p, idx) => (
                <li
                  key={p._id || idx}
                  className="border-2 border-black rounded p-3"
                >
                  <div className="font-bold">{p.title}</div>
                  {p.address && <div className="text-sm">{p.address}</div>}
                  <div className="text-xs">{p.category}</div>
                  {Array.isArray(p.location?.coordinates) && (
                    <div className="text-xs mt-1">
                      ({p.location!.coordinates[1]},{" "}
                      {p.location!.coordinates[0]})
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-black bg-[#a0e7e5] border-2 border-black px-2 py-1 rounded"
                      >
                        {t("see_more")}
                      </a>
                    )}
                    {Array.isArray(p.location?.coordinates) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${
                          p.location!.coordinates[1]
                        },${p.location!.coordinates[0]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                      >
                        {t("open_gg_maps")}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
