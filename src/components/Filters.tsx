"use client";

import React from "react";
import { Source } from "@/types/room";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  minPrice: number | "";
  setMinPrice: (v: number | "") => void;
  maxPrice: number | "";
  setMaxPrice: (v: number | "") => void;
  district: string;
  setDistrict: (v: string) => void;
  sources: Source[];
  setSources: (v: Source[]) => void;
  cheapOnly: boolean;
  setCheapOnly: (v: boolean) => void;
  districts: string[];
  allSources: Source[];
  cheapThreshold: number;
  // new filters
  minArea: number | "";
  setMinArea: (v: number | "") => void;
  maxArea: number | "";
  setMaxArea: (v: number | "") => void;
  sort: string;
  setSort: (v: string) => void;
  ownerOnly: boolean;
  setOwnerOnly: (v: boolean) => void;
  hasImages: boolean;
  setHasImages: (v: boolean) => void;
};

export default function Filters({
  query,
  setQuery,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  district,
  setDistrict,
  sources,
  setSources,
  cheapOnly,
  setCheapOnly,
  districts,
  allSources,
  cheapThreshold,
  // new filters
  minArea,
  setMinArea,
  maxArea,
  setMaxArea,
  sort,
  setSort,
  ownerOnly,
  setOwnerOnly,
  hasImages,
  setHasImages,
}: Props) {
  const toggleSource = (s: Source) => {
    if (sources.includes(s)) setSources(sources.filter((x) => x !== s));
    else setSources([...sources, s]);
  };

  const baseInput = "border-2 border-black rounded-md px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#f7f7f2] border-2 border-black rounded-lg shadow-[6px_6px_0_0_#000]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Từ khóa (tiêu đề/địa chỉ)"
          className={baseInput}
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="Giá min (VND)"
            className={baseInput}
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="Giá max (VND)"
            className={baseInput}
          />
        </div>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className={baseInput}
        >
          <option value="">Tất cả quận/huyện</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Extra filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={minArea}
            onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : "")}
            placeholder="Diện tích min (m²)"
            className={baseInput}
          />
          <input
            type="number"
            min={0}
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : "")}
            placeholder="Diện tích max (m²)"
            className={baseInput}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={baseInput}
        >
          <option value="price_asc">Sắp xếp: Giá tăng dần</option>
          <option value="price_desc">Sắp xếp: Giá giảm dần</option>
          <option value="recent">Sắp xếp: Mới nhất</option>
          <option value="area_desc">Sắp xếp: Diện tích lớn</option>
          <option value="area_asc">Sắp xếp: Diện tích nhỏ</option>
        </select>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={ownerOnly}
              onChange={(e) => setOwnerOnly(e.target.checked)}
              className="appearance-none w-4 h-4 border-2 border-black bg-white checked:bg-[#ffe066]"
            />
            Chính chủ
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasImages}
              onChange={(e) => setHasImages(e.target.checked)}
              className="appearance-none w-4 h-4 border-2 border-black bg-white checked:bg-[#a0e7e5]"
            />
            Có hình ảnh
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={cheapOnly}
            onChange={(e) => setCheapOnly(e.target.checked)}
            className="appearance-none w-4 h-4 border-2 border-black bg-white checked:bg-[#32CD32]"
          />
          Chỉ hiển thị giá ≤ {cheapThreshold.toLocaleString("vi-VN")} VND
        </label>

        <div className="flex flex-wrap gap-2">
          {allSources.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={sources.includes(s)}
                onChange={() => toggleSource(s)}
                className="appearance-none w-4 h-4 border-2 border-black bg-white checked:bg-[#ffd3e0]"
              />
              Nguồn: {s}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}