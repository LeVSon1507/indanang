"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import type { PlaceCategory } from "@/types/place";
import type {
  MapContainerProps,
  TileLayerProps,
  MarkerProps,
  PopupProps,
} from "react-leaflet";
let L: typeof import("leaflet");

if (typeof window !== "undefined") {
  L = await import("leaflet");
}
// Dynamically import react-leaflet components to avoid SSR window errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
) as React.ComponentType<MapContainerProps>;
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
) as React.ComponentType<TileLayerProps>;
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
}) as React.ComponentType<MarkerProps>;
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
}) as React.ComponentType<PopupProps>;
const ClickPicker = dynamic<ClickPickerProps>(() => import("./ClickPicker"), {
  ssr: false,
});
const PanTo = dynamic(() => import("./PanTo"), {
  ssr: false,
}) as React.ComponentType<{
  center: [number, number];
  zoom?: number;
  animate?: boolean;
}>;

// Configure Leaflet marker icons inside component via useEffect (see below)

interface PlaceItem {
  _id?: string;
  title: string;
  address?: string;
  category: PlaceCategory;
  location?: { type: "Point"; coordinates: [number, number] };
  url?: string;
}

interface SuggestedPlace {
  title: string;
  address?: string;
  category?: PlaceCategory;
  lat: number;
  lng: number;
  url?: string;
}

type ClickPickerProps = { onPick: (lat: number, lng: number) => void };

const DANANG: [number, number] = [16.047079, 108.20623]; // lat, lng

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

export default function DateMapPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("entertainment");
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPlace[]>([]);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Ensure Leaflet marker icons load on client
  useEffect(() => {
    (async () => {
      L.Icon.Default.mergeOptions({
        iconUrl: "/cursor.png",
        iconRetinaUrl: "/cursor.png",
        shadowUrl: "/cursor-shadow.png",
      });
    })();
  }, []);

  const params = new URLSearchParams();
  params.set("limit", "500");
  params.set("category", category);
  const url = `/api/places?${params.toString()}`;

  const { data: placesData, mutate } = useSWR<PlaceItem[]>(url, (u: string) =>
    fetch(u).then((r) => r.json())
  );
  const places: PlaceItem[] = useMemo(
    () => (Array.isArray(placesData) ? placesData : []),
    [placesData]
  );

  async function addManual() {
    if (!picked) return alert("Bấm lên bản đồ để chọn vị trí");
    if (!title.trim()) return alert("Nhập tiêu đề địa điểm");
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: desc || undefined,
        address: address || undefined,
        category,
        lat: picked.lat,
        lng: picked.lng,
        source: "manual",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Lỗi thêm địa điểm: " + t);
      return;
    }
    setTitle("");
    setAddress("");
    setDesc("");
    setFocus([picked.lat, picked.lng]);
    setPicked(null);
    mutate();
  }

  async function callSuggest() {
    setLoadingSuggest(true);
    try {
      const res = await fetch("/api/places/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || undefined,
          category,
          limit: 10,
          save: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "OpenAI error");
      setSuggestions(
        Array.isArray(json.items) ? (json.items as SuggestedPlace[]) : []
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Lỗi gợi ý: " + msg);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function addSuggested(s: SuggestedPlace) {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: s.title,
        description: undefined,
        address: s.address,
        category: s.category || category,
        lat: s.lat,
        lng: s.lng,
        url: s.url,
        source: "ai",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Lỗi thêm gợi ý: " + t);
      return;
    }
    setFocus([s.lat, s.lng]);
    mutate();
  }

  const resetManual = () => {
    setTitle("");
    setAddress("");
    setDesc("");
    setPicked(null);
    setManualMode(false);
  };

  const baseInput =
    "border-2 border-black rounded-md px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <main className="max-w-6xl mx-auto p-4">
        <div className="border-2 border-black rounded-lg p-4 bg-[#c0eb75] shadow-[8px_8px_0_0_#000] mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Bản đồ Đà Nẵng
          </h1>
          <p className="text-sm mt-1">
            Chọn vị trí trên bản đồ hoặc dùng AI để gợi ý địa điểm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border-2 border-black rounded-lg overflow-hidden shadow-[8px_8px_0_0_#000]">
            <MapContainer center={DANANG} zoom={13} style={{ height: 520 }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              {places
                .filter((p) => Array.isArray(p.location?.coordinates))
                .map((p, idx) => (
                  <Marker
                    key={idx}
                    position={[
                      p.location!.coordinates[1],
                      p.location!.coordinates[0],
                    ]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold">{p.title}</div>
                        {p.address && <div>{p.address}</div>}
                        <div>Loại: {p.category}</div>
                        <div className="mt-1 flex gap-2">
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-black bg-[#a0e7e5] border-2 border-black px-2 py-1 rounded"
                            >
                              Xem thêm
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${
                              p.location!.coordinates[1]
                            },${p.location!.coordinates[0]}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                          >
                            Mở GG Maps
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              {picked && (
                <Marker position={[picked.lat, picked.lng]}>
                  <Popup>
                    <div className="text-sm">Vị trí đã chọn</div>
                  </Popup>
                </Marker>
              )}
              {/* Picker for map clicks */}
              <ClickPicker
                onPick={(lat: number, lng: number) => setPicked({ lat, lng })}
              />
              {focus && <PanTo center={focus} zoom={17} />}
              {/* AI suggestions as temporary markers (not saved) */}
              {suggestions.map((s, idx) => (
                <Marker key={`suggest-${idx}`} position={[s.lat, s.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold">
                        Gợi ý (chưa lưu): {s.title}
                      </div>
                      {s.address && <div>{s.address}</div>}
                      <div>{s.category}</div>
                      <div>
                        ({s.lat}, {s.lng})
                      </div>
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => addSuggested(s)}
                          className="text-black bg-[#c0eb75] border-2 border-black px-2 py-1 rounded"
                        >
                          Thêm vào map
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                        >
                          Mở GG Maps
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-[#f7f7f2] border-2 border-black rounded-lg shadow-[8px_8px_0_0_#000]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 select-none cursor-pointer">
                <span className="text-sm">Thêm thủ công</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={manualMode}
                    onChange={(e) => setManualMode(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 border-2 border-black rounded-full shadow-[4px_4px_0_0_#000] transition-colors ${
                      manualMode ? "bg-[#c0eb75]" : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-black rounded-full transition-transform ${
                        manualMode ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </label>
            </div>
            {manualMode ? (
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tên địa điểm"
                  className={baseInput}
                />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ (tuỳ chọn)"
                  className={baseInput}
                />
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Mô tả (tuỳ chọn)"
                  className={baseInput}
                  rows={3}
                />
                <button
                  onClick={addManual}
                  className="text-black bg-[#ffd3e0] border-2 border-black px-3 py-2 rounded shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  Thêm thủ công
                </button>
                <div className="text-xs text-gray-700">
                  Bấm lên bản đồ để chọn lat/lng.
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-700 p-2">
                Bật “Thêm thủ công” để nhập thông tin.
              </div>
            )}

            <hr className="border-black" />

            <div className="grid grid-cols-1 gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ví dụ: địa điểm hẹn hò lãng mạn"
                className={baseInput}
              />
              <button
                disabled={loadingSuggest}
                onClick={callSuggest}
                className="text-black bg-[#a0e7e5] border-2 border-black px-3 py-2 rounded shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                {loadingSuggest ? "Đang gợi ý…" : "Gợi ý bằng AI"}
              </button>
              <div className="text-xs text-gray-700">
                AI trả về danh sách địa điểm ở Đà Nẵng, bạn có thể thêm từng địa
                điểm vào bản đồ.
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2">
                <div className="font-bold mb-2">Gợi ý:</div>
                <div className="flex flex-col gap-2 max-h-64 overflow-auto pr-2">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-black rounded p-2 bg-white"
                    >
                      <div className="text-sm font-semibold">{s.title}</div>
                      {s.address && <div className="text-xs">{s.address}</div>}
                      <div className="text-xs">{s.category}</div>
                      <div className="text-xs">
                        ({s.lat}, {s.lng})
                      </div>
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => addSuggested(s)}
                          className="text-black bg-[#c0eb75] border-2 border-black px-2 py-1 rounded"
                        >
                          Thêm vào map
                        </button>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-black bg-[#a0e7e5] border-2 border-black px-2 py-1 rounded"
                          >
                            Mở link
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                        >
                          Mở GG Maps
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
