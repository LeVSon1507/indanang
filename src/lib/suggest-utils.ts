// Utilities for parsing AI-suggested places
export type SuggestItem = {
  title?: unknown;
  name?: unknown;
  description?: unknown;
  address?: unknown;
  category?: unknown;
  lat?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  long?: unknown;
  location?: unknown;
  latlng?: unknown;
  gps?: unknown;
  url?: unknown;
};

export function toStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

export function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function extractItems(p: unknown): unknown[] {
  if (Array.isArray(p)) return p as unknown[];
  if (typeof p === "object" && p !== null) {
    const obj = p as Record<string, unknown>;
    const keys = ["items", "places", "results", "data", "suggestions", "list"];
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) return v as unknown[];
    }
    // Fallback: find the first array in object values
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
}

export function getLatLng(it: SuggestItem): { lat: number; lng: number } {
  // Direct fields
  let lat = toNum(it.lat ?? it.latitude);
  let lng = toNum(it.lng ?? it.long ?? it.longitude);

  // Try parsing string fields like "latlng" or "gps" (e.g., "16.04,108.23")
  function parseCoordString(v: unknown): { lat: number; lng: number } | null {
    if (typeof v !== "string") return null;
    const s = v.replace(/\n/g, " ").trim();
    const nums = s.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (nums && nums.length >= 2) {
      const a = toNum(nums[0]);
      const b = toNum(nums[1]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        // heuristic: lat in [-90, 90]
        if (Math.abs(a) <= 90 && Math.abs(b) > 90) return { lat: a, lng: b };
        if (Math.abs(b) <= 90 && Math.abs(a) > 90) return { lat: b, lng: a };
        // default to [lat, lng]
        return { lat: a, lng: b };
      }
    }
    return null;
  }

  const asItem = it as SuggestItem;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const p1 = parseCoordString(asItem.latlng);
    if (p1) {
      if (Number.isNaN(lat)) lat = p1.lat;
      if (Number.isNaN(lng)) lng = p1.lng;
    }
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const p2 = parseCoordString(asItem.gps);
    if (p2) {
      if (Number.isNaN(lat)) lat = p2.lat;
      if (Number.isNaN(lng)) lng = p2.lng;
    }
  }

  // Fallback to nested location object
  if ((Number.isNaN(lat) || Number.isNaN(lng)) && typeof it.location === "object" && it.location !== null) {
    const o = it.location as Record<string, unknown>;
    const la = toNum(o.lat ?? o.latitude);
    const ln = toNum(o.lng ?? o.long ?? o.longitude);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) {
      lat = la; lng = ln;
    } else {
      const coords = (o.coordinates ?? (o as Record<string, unknown>).coords) as unknown;
      if (Array.isArray(coords) && coords.length >= 2) {
        const a = toNum(coords[0]);
        const b = toNum(coords[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          // Assume [lng, lat] by Leaflet/GeoJSON convention; apply simple heuristic
          if (Math.abs(b) <= 90 && Math.abs(a) > 90) {
            lat = b; lng = a;
          } else if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
            lat = a; lng = b;
          } else {
            // default to GeoJSON [lng, lat]
            lat = b; lng = a;
          }
        }
      }
    }
  }

  return { lat, lng };
}