import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Place, type PlaceDoc } from "@/models/Place";
import {
  SuggestItem,
  toStr,
  extractItems,
  getLatLng,
} from "@/lib/suggest-utils";

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

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(content) as unknown;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse JSON from AI" },
      { status: 500 }
    );
  }

  const itemsRaw: unknown[] = extractItems(parsed);

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
