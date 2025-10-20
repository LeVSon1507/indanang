"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Room, Source } from "@/types/room";
import Filters from "./components/Filters";
import RoomCard from "./components/RoomCard";
import { useI18n } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ApartmentHomePage() {
  const { t } = useI18n();
  const cheapThreshold = 2_000_000;

  type RoomsMeta = {
    districts: string[];
    sources: Source[];
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    totalCount: number;
  };

  const { data: meta } = useSWR<RoomsMeta>("/api/rooms/meta", fetcher);
  const districts = useMemo(() => {
    const fromMeta = Array.isArray(meta?.districts) ? meta!.districts : [];
    return (fromMeta.length ? fromMeta : []).sort((a, b) => a.localeCompare(b));
  }, [meta]);
  const allSources = useMemo(() => {
    const fromMeta = Array.isArray(meta?.sources) ? meta!.sources : [];
    return (fromMeta.length ? fromMeta : []).sort((a, b) => a.localeCompare(b));
  }, [meta]);

  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [district, setDistrict] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [cheapOnly, setCheapOnly] = useState(false);
  const [minArea, setMinArea] = useState<number | "">("");
  const [maxArea, setMaxArea] = useState<number | "">("");
  const [sort, setSort] = useState<string>("price_asc");
  const [ownerOnly, setOwnerOnly] = useState<boolean>(false);
  const [hasImages, setHasImages] = useState<boolean>(false);

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (minPrice !== "") params.set("minPrice", String(minPrice));
  if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
  if (district) params.set("district", district);
  if (sources.length) params.set("sources", sources.join(","));
  if (cheapOnly) params.set("cheapOnly", "true");
  params.set("cheapThreshold", String(cheapThreshold));
  if (minArea !== "") params.set("minArea", String(minArea));
  if (maxArea !== "") params.set("maxArea", String(maxArea));
  if (ownerOnly) params.set("ownerOnly", "true");
  if (hasImages) params.set("hasImages", "true");
  if (sort) params.set("sort", sort);

  const { data, error, isLoading } = useSWR(
    `/api/rooms?${params.toString()}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const list: Room[] = useMemo(() => {
    const fromApi: Room[] = Array.isArray(data) ? (data as Room[]) : [];
    return fromApi.sort((a, b) => a.price - b.price);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <main className="max-w-6xl mx-auto p-4">
        <div className="border-2 border-black rounded-lg p-4 bg-[#a0e7e5] shadow-[8px_8px_0_0_#000] mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {t("title_home")}
          </h1>
          <p className="mt-2 text-base md:text-sm text-gray-800">
            {t("subtitle_home")}
          </p>
          {/* <div className="mt-3">
            <Link
              href="/dn-map"
              className="inline-block text-sm border-2 border-black px-3 py-1 bg-white rounded hover:bg-[#ffd3e0] shadow-[4px_4px_0_0_#000]"
            >
              {t("open_map")}
            </Link>
          </div> */}
        </div>

        <Filters
          query={query}
          setQuery={setQuery}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          district={district}
          setDistrict={setDistrict}
          sources={sources}
          setSources={setSources}
          cheapOnly={cheapOnly}
          setCheapOnly={setCheapOnly}
          districts={districts}
          allSources={allSources}
          cheapThreshold={cheapThreshold}
          minArea={minArea}
          setMinArea={setMinArea}
          maxArea={maxArea}
          setMaxArea={setMaxArea}
          sort={sort}
          setSort={setSort}
          ownerOnly={ownerOnly}
          setOwnerOnly={setOwnerOnly}
          hasImages={hasImages}
          setHasImages={setHasImages}
        />

        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-semibold border-2 border-black px-2 py-1 bg-white rounded">
            {t("found_rooms", { count: list.length })}
          </span>
          {isLoading && (
            <span className="text-xs border-2 border-black px-2 py-1 bg-[#ffd3e0] rounded">
              {t("loading")}
            </span>
          )}
          {error && (
            <span className="text-xs border-2 border-black px-2 py-1 bg-[#ffb4a2] rounded">
              {t("error_loading")}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          {list.map((room: Room) => (
            <RoomCard
              key={`${room.url}-${room.title}`}
              room={room}
              cheapThreshold={cheapThreshold}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
