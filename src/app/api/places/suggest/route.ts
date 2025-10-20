import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Place, type PlaceDoc } from "@/models/Place";

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  await connectToDatabase();

  const body = await req.json();
  const {
    query = "địa điểm hẹn hò, vui chơi tại Đà Nẵng",
    category,
    limit = 10,
    save = false,
    debug = false,
  } = body || {};

  const systemPrompt = `Bạn là trợ lý du lịch tại Đà Nẵng. Trả về duy nhất JSON object dạng { items: [ ... ] } (không thêm văn bản ngoài JSON). Mỗi item có: title, address, category, lat, lng, url (nếu có). lat/lng là số thập phân. Tập trung trong khu vực Đà Nẵng.`;
  const userPrompt = `${query}${
    category ? `, category: ${category}` : ""
  }. Trả về tối đa ${limit} địa điểm trong mảng items.`;

  // Using fetch to OpenAI for minimal dependency
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return NextResponse.json(
      { error: "OpenAI error", detail: errText },
      { status: 500 }
    );
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "{}";

  type SuggestItem = {
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

  function toStr(v: unknown): string {
    return typeof v === "string" ? v : String(v ?? "");
  }
  function toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(content) as unknown;
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse JSON from AI" },
      { status: 500 }
    );
  }

  function extractItems(p: unknown): unknown[] {
    if (Array.isArray(p)) return p as unknown[];
    if (typeof p === "object" && p !== null) {
      const obj = p as Record<string, unknown>;
      const keys = [
        "items",
        "places",
        "results",
        "data",
        "suggestions",
        "list",
      ];
      for (const k of keys) {
        const v = obj[k];
        if (Array.isArray(v)) return v as unknown[];
      }
      // Fallback: tìm mảng đầu tiên trong các giá trị object
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) return v as unknown[];
      }
    }
    return [];
  }

  const itemsRaw: unknown[] = extractItems(parsed);

  function getLatLng(it: SuggestItem): { lat: number; lng: number } {
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
    if (
      (Number.isNaN(lat) || Number.isNaN(lng)) &&
      typeof it.location === "object" &&
      it.location !== null
    ) {
      const o = it.location as Record<string, unknown>;
      const la = toNum(o.lat ?? o.latitude);
      const ln = toNum(o.lng ?? o.long ?? o.longitude);
      if (!Number.isNaN(la) && !Number.isNaN(ln)) {
        lat = la;
        lng = ln;
      } else {
        const coords = (o.coordinates ??
          (o as Record<string, unknown>).coords) as unknown;
        if (Array.isArray(coords) && coords.length >= 2) {
          const a = toNum(coords[0]);
          const b = toNum(coords[1]);
          if (!Number.isNaN(a) && !Number.isNaN(b)) {
            // Assume [lng, lat] by Leaflet/GeoJSON convention; apply simple heuristic
            if (Math.abs(b) <= 90 && Math.abs(a) > 90) {
              lat = b;
              lng = a;
            } else if (Math.abs(a) <= 90 && Math.abs(b) > 90) {
              lat = a;
              lng = b;
            } else {
              // default to GeoJSON [lng, lat]
              lat = b;
              lng = a;
            }
          }
        }
      }
    }

    return { lat, lng };
  }

  const normalized = (itemsRaw as SuggestItem[])
    .map((it) => {
      const { lat, lng } = getLatLng(it);
      return {
        title: toStr(it.title ?? it.name).trim(),
        description: it.description ? toStr(it.description) : undefined,
        address: it.address ? toStr(it.address) : undefined,
        category: toStr(it.category ?? category ?? "entertainment"),
        lat,
        lng,
        url: it.url ? toStr(it.url) : undefined,
      };
    })
    .filter((it) => it.title && !Number.isNaN(it.lat) && !Number.isNaN(it.lng));

  if (save) {
    type NormalizedItem = {
      title: string;
      description?: string;
      address?: string;
      category: string;
      lat: number;
      lng: number;
      url?: string;
    };
    const docs = await Promise.all(
      (normalized as NormalizedItem[]).map((n) =>
        Place.create({
          title: n.title,
          description: n.description,
          address: n.address,
          category: n.category,
          location: { type: "Point", coordinates: [n.lng, n.lat] },
          url: n.url,
          source: "ai",
        })
      )
    );
    return NextResponse.json({
      ok: true,
      saved: docs.length,
      items: docs.map((d: PlaceDoc) => d.toObject()),
    });
  }

  return NextResponse.json(
    debug
      ? {
          ok: true,
          items: normalized,
          debug: {
            content,
            keys: Array.isArray(parsed)
              ? []
              : Object.keys((parsed as Record<string, unknown>) || {}),
            itemsRawLength: itemsRaw.length,
          },
        }
      : { ok: true, items: normalized }
  );
}
