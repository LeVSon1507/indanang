import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Place, type PlaceDoc } from '@/models/Place';

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  await connectToDatabase();

  const body = await req.json();
  const {
    query = 'địa điểm hẹn hò, vui chơi tại Đà Nẵng',
    category,
    limit = 10,
    save = false,
  } = body || {};

  const systemPrompt = `Bạn là trợ lý du lịch tại Đà Nẵng. Trả về JSON array (không thêm text khác) các địa điểm phù hợp để hẹn hò/vui chơi. Mỗi item có: title, description, address, category, lat, lng, url (nếu có). Tập trung trong khu vực Đà Nẵng.`;
  const userPrompt = `${query}${category ? `, category: ${category}` : ''}. Trả về tối đa ${limit} địa điểm.`;

  // Using fetch to OpenAI for minimal dependency
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return NextResponse.json({ error: 'OpenAI error', detail: errText }, { status: 500 });
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '{}';

  type SuggestItem = {
    title?: unknown;
    description?: unknown;
    address?: unknown;
    category?: unknown;
    lat?: unknown;
    lng?: unknown;
    url?: unknown;
  };

  function toStr(v: unknown): string {
    return typeof v === 'string' ? v : String(v ?? '');
  }
  function toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(content) as unknown;
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse JSON from AI' }, { status: 500 });
  }

  function extractItems(p: unknown): unknown[] {
    if (Array.isArray(p)) return p as unknown[];
    if (typeof p === 'object' && p !== null) {
      const obj = p as Record<string, unknown>;
      const items = obj.items;
      if (Array.isArray(items)) return items as unknown[];
    }
    return [];
  }

  const itemsRaw: unknown[] = extractItems(parsed);

  const normalized = (itemsRaw as SuggestItem[])
    .map((it) => ({
      title: toStr(it.title).trim(),
      description: it.description ? toStr(it.description) : undefined,
      address: it.address ? toStr(it.address) : undefined,
      category: toStr(it.category ?? category ?? 'entertainment'),
      lat: toNum(it.lat),
      lng: toNum(it.lng),
      url: it.url ? toStr(it.url) : undefined,
    }))
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
          location: { type: 'Point', coordinates: [n.lng, n.lat] },
          url: n.url,
          source: 'ai',
        })
      )
    );
    return NextResponse.json({ ok: true, saved: docs.length, items: docs.map((d: PlaceDoc) => d.toObject()) });
  }

  return NextResponse.json({ ok: true, items: normalized });
}