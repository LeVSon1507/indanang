"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import type { PlaceCategory } from "@/types/place";
import type {
  MapContainerProps,
  TileLayerProps,
  MarkerProps,
  PopupProps,
} from "react-leaflet";
import { baseInput } from "@/lib/ui";
import { useDnMap } from "@/hooks/useDnMap";
import { useI18n } from "@/lib/i18n";

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
const ClickPicker = dynamic<ClickPickerProps>(
  () => import("./components/ClickPicker"),
  {
    ssr: false,
  }
);
const PanTo = dynamic(() => import("./components/PanTo"), {
  ssr: false,
}) as React.ComponentType<{
  center: [number, number];
  zoom?: number;
  animate?: boolean;
}>;

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
  const {
    query,
    setQuery,
    category,
    setCategory,
    picked,
    setPicked,
    title,
    setTitle,
    address,
    setAddress,
    desc,
    setDesc,
    loadingSuggest,
    suggestions,
    focus,
    setFocus,
    manualMode,
    setManualMode,
    places,
    addManual,
    callSuggest,
    addSuggested,
  } = useDnMap();
  const { t } = useI18n();

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

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <main className="max-w-6xl mx-auto p-4">
        <div className="border-2 border-black rounded-lg p-4 bg-[#c0eb75] shadow-[8px_8px_0_0_#000] mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {t("map_title")}
          </h1>
          <p className="text-sm mt-1">
            {t("map_instruction")}
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
                        <div>{t("category_label")}: {t(`category_${p.category}`)}</div>
                        <div className="mt-1 flex gap-2">
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
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              {picked && (
                <Marker position={[picked.lat, picked.lng]}>
                  <Popup>
                    <div className="text-sm">{t("picked_location")}</div>
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
                        {t("suggestion_unsaved_prefix")} {s.title}
                      </div>
                      {s.address && <div>{s.address}</div>}
                      <div>{t(`category_${s.category ?? category}`)}</div>
                      <div>
                        ({s.lat}, {s.lng})
                      </div>
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => addSuggested(s)}
                          className="text-black bg-[#c0eb75] border-2 border-black px-2 py-1 rounded"
                        >
                          {t("add_to_map")}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                        >
                          {t("open_gg_maps")}
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
                <span className="text-sm">{t("manual_add_toggle")}</span>
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
                      {t(`category_${c}`)}
                    </option>
                  ))}
                </select>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("place_name")}
                  className={baseInput}
                />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("place_address_optional")}
                  className={baseInput}
                />
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={t("place_desc_optional")}
                  className={baseInput}
                  rows={3}
                />
                <button
                  onClick={addManual}
                  className="text-black bg-[#ffd3e0] border-2 border-black px-3 py-2 rounded shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  {t("manual_add")}
                </button>
                <div className="text-xs text-gray-700">
                  {t("choose_latlng_hint")}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-700 p-2">
                {t("enable_manual_hint")}
              </div>
            )}

            <hr className="border-black" />

            <div className="grid grid-cols-1 gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ai_query_placeholder")}
                className={baseInput}
              />
              <button
                disabled={loadingSuggest}
                onClick={callSuggest}
                className="text-black bg-[#a0e7e5] border-2 border-black px-3 py-2 rounded shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                {loadingSuggest ? t("ai_suggest_loading") : t("ai_suggest")}
              </button>
              <div className="text-xs text-gray-700">
                {t("ai_suggest_explain")}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2">
                <div className="font-bold mb-2">{t("suggestions")}</div>
                <div className="flex flex-col gap-2 max-h-64 overflow-auto pr-2">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-black rounded p-2 bg-white"
                    >
                      <div className="text-sm font-semibold">{s.title}</div>
                      {s.address && <div className="text-xs">{s.address}</div>}
                      <div className="text-xs">{t(`category_${s.category ?? category}`)}</div>
                      <div className="text-xs">
                        ({s.lat}, {s.lng})
                      </div>
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => addSuggested(s)}
                          className="text-black bg-[#c0eb75] border-2 border-black px-2 py-1 rounded"
                        >
                          {t("add_to_map")}
                        </button>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-black bg-[#a0e7e5] border-2 border-black px-2 py-1 rounded"
                          >
                            {t("open_link")}
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-black bg-[#d3d850] border-2 border-black px-2 py-1 rounded"
                        >
                          {t("open_gg_maps")}
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
