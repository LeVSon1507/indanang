"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { rooms as sampleRooms } from "@/data/rooms";
import { Room, Source } from "@/types/room";
import Filters from "@/components/Filters";
import RoomCard from "@/components/RoomCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const cheapThreshold = 2_000_000;

  const districts = useMemo(
    () => Array.from(new Set(sampleRooms.map((r) => r.district))).sort(),
    []
  );
  const allSources = useMemo(
    () =>
      Array.from(new Set(sampleRooms.map((r) => r.source))).sort() as Source[],
    []
  );

  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [district, setDistrict] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [cheapOnly, setCheapOnly] = useState(false);

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (minPrice !== "") params.set("minPrice", String(minPrice));
  if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
  if (district) params.set("district", district);
  if (sources.length) params.set("sources", sources.join(","));
  if (cheapOnly) params.set("cheapOnly", "true");
  params.set("cheapThreshold", String(cheapThreshold));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/rooms?${params.toString()}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const [crawlSource, setCrawlSource] = useState<Source | "serpapi" | "">("");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlQuery, setCrawlQuery] = useState("");
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState("");

  async function triggerCrawl() {
    setCrawlLoading(true);
    setCrawlMsg("");
    try {
      const payload: Record<string, unknown> = { source: crawlSource };
      if (crawlSource === "serpapi")
        payload.query = crawlQuery || query || "phòng trọ giá rẻ Đà Nẵng";
      else payload.url = crawlUrl;
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Crawl failed");
      setCrawlMsg(
        `Đã crawl: upserted ${json.upsertedCount ?? json.upserted ?? 0}`
      );
      mutate();
    } catch (e: unknown) {
      setCrawlMsg(e instanceof Error ? e.message : "Crawl lỗi");
    } finally {
      setCrawlLoading(false);
    }
  }

  const list: Room[] = useMemo(() => {
    const fromApi: Room[] = Array.isArray(data) ? (data as Room[]) : [];
    const base: Room[] = fromApi.length ? fromApi : sampleRooms;
    return base.sort((a, b) => a.price - b.price);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <main className="max-w-6xl mx-auto p-4">
        <div className="border-2 border-black rounded-lg p-4 bg-[#a0e7e5] shadow-[8px_8px_0_0_#000] mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Trọ Rẻ — Tìm trọ giá rẻ Đà Nẵng
          </h1>
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
        />

        <div className="mt-3 border-2 border-black rounded-lg p-3 bg-white shadow-[6px_6px_0_0_#000]">
          <div className="font-bold">Crawler</div>
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            <select
              className="border-2 border-black rounded px-2 py-1"
              value={crawlSource}
              onChange={(e) =>
                setCrawlSource(e.target.value as Source | "serpapi" | "")
              }
            >
              <option value="">Chọn nguồn</option>
              <option value="serpapi">SerpApi (Google)</option>
              <option value="phongtro123">Phongtro123</option>
              <option value="batdongsan">Batdongsan</option>
              <option value="chotot">Chotot</option>
              <option value="facebook_group_pw">Facebook Group (Login)</option>
            </select>
            {crawlSource === "serpapi" ? (
              <input
                className="border-2 border-black rounded px-2 py-1 flex-1"
                placeholder="Query SerpApi (ví dụ: phòng trọ giá rẻ Đà Nẵng)"
                value={crawlQuery}
                onChange={(e) => setCrawlQuery(e.target.value)}
              />
            ) : (
              <input
                className="border-2 border-black rounded px-2 py-1 flex-1"
                placeholder="URL nguồn (ví dụ: https://www.facebook.com/groups/thuetrodanang)"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
              />
            )}
            <button
              className="border-2 border-black rounded px-3 py-1 bg-[#a0e7e5] font-semibold"
              onClick={triggerCrawl}
              disabled={
                crawlLoading ||
                !crawlSource ||
                (!crawlQuery && crawlSource === "serpapi") ||
                (!crawlUrl && crawlSource !== "serpapi")
              }
            >
              {crawlLoading ? "Đang crawl…" : "Chạy crawl"}
            </button>
          </div>
          {crawlMsg && <div className="mt-2 text-sm">{crawlMsg}</div>}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-semibold border-2 border-black px-2 py-1 bg-white rounded">
            Tìm thấy {list.length} phòng
          </span>
          {isLoading && (
            <span className="text-xs border-2 border-black px-2 py-1 bg-[#ffd3e0] rounded">
              Đang tải…
            </span>
          )}
          {error && (
            <span className="text-xs border-2 border-black px-2 py-1 bg-[#ffb4a2] rounded">
              Lỗi tải dữ liệu, dùng dữ liệu mẫu
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
