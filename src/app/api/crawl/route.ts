import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { connectToDatabase } from '@/lib/mongoose';
import { Room } from '@/models/Room';

function normalize(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}
function parsePrice(text: string): number {
  const cleaned = text.toLowerCase();
  const match = cleaned.match(/([0-9][0-9\.,]*)/);
  if (!match) return 0;
  const num = Number(match[1].replace(/\./g, '').replace(/,/g, ''));
  if (cleaned.includes('triệu')) return num * 1_000_000;
  if (cleaned.includes('k') || cleaned.includes('nghìn')) return num * 1_000;
  return num; // assume VND
}
function absoluteUrl(href: string, base: string): string {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  type CrawlBody = { url?: string; source?: string; query?: string; params?: Record<string, unknown> };
  let body: CrawlBody;
  try {
    body = await req.json() as CrawlBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Prefer orchestrator if source provided
  if (body?.source) {
    const source = String(body.source);
    const urlOrQuery = source === 'serpapi' ? (body.query || body.url || '') : (body.url || '');
    if (!urlOrQuery) {
      return NextResponse.json({ error: 'Missing url/query for source' }, { status: 400 });
    }
    try {
      const mod = await import('../../../../crawler/index.mjs');
      const result = await mod.runSingle(source, urlOrQuery, body.params || body);
      return NextResponse.json({ ok: true, ...result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg || 'Crawler invocation failed' }, { status: 500 });
    }
  }

  // Fallback: direct URL crawl via Cheerio (legacy)
  const url: string = body?.url || '';
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  const hostname = new URL(url).hostname;
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) {
    return NextResponse.json({ error: 'Fetch failed', status: res.status }, { status: 502 });
  }
  const html = await res.text();
  const $ = load(html);

  const items: Array<{
    title: string;
    price: number;
    address: string;
    district: string;
    area?: number;
    images?: string[];
    url: string;
    postedAt?: Date;
    source: string;
  }> = [];

  if (hostname.includes('phongtro123.com')) {
    $('.post-item, .listing-item, .item').each((_, el) => {
      const title = normalize($(el).find('h3 a, a.title, h3').first().text() || $(el).find('a').attr('title') || '');
      const href = $(el).find('h3 a, a.title, a').first().attr('href') || '';
      const priceText = normalize($(el).find('.price, .post-price, .listing-price').first().text());
      const address = normalize($(el).find('.address, .post-meta .post-location').first().text());
      const areaText = normalize($(el).find('.acreage, .post-meta').text());
      const price = parsePrice(priceText);
      const areaMatch = areaText.match(/([0-9]+)\s*m²|m2/i);
      const area = areaMatch ? Number(areaMatch[1]) : undefined;
      const districtMatch = address.match(/(Hải Châu|Thanh Khê|Sơn Trà|Ngũ Hành Sơn|Cẩm Lệ|Liên Chiểu|Hòa Vang)/i);
      const district = districtMatch ? districtMatch[1] : '';
      const abs = absoluteUrl(href, url);
      if (title && price && abs) {
        items.push({ title, price, address, district, area, url: abs, source: 'phongtro123', postedAt: new Date() });
      }
    });
  } else if (hostname.includes('batdongsan.com.vn')) {
    $('.js-bds-search-list .search-productItem, .item').each((_, el) => {
      const title = normalize($(el).find('h3 a, .pr-title a').first().text());
      const href = $(el).find('h3 a, .pr-title a').first().attr('href') || '';
      const priceText = normalize($(el).find('.price, .pr-price').first().text());
      const address = normalize($(el).find('.address, .location').first().text());
      const price = parsePrice(priceText);
      const districtMatch = address.match(/(Hải Châu|Thanh Khê|Sơn Trà|Ngũ Hành Sơn|Cẩm Lệ|Liên Chiểu|Hòa Vang)/i);
      const district = districtMatch ? districtMatch[1] : '';
      const abs = absoluteUrl(href, url);
      if (title && price && abs) {
        items.push({ title, price, address, district, url: abs, source: 'batdongsan', postedAt: new Date() });
      }
    });
  } else if (hostname.includes('chotot.com')) {
    // Chotot is heavily client-rendered; fallback to zero items here
  } else if (hostname.includes('facebook.com')) {
    // Facebook requires authentication; skip here.
  } else {
    return NextResponse.json({ ok: true, upserted: 0, items: [] });
  }

  const bulkOps = items.map((r) => ({
    updateOne: {
      filter: { url: r.url },
      update: { $set: r },
      upsert: true,
    },
  }));

  if (bulkOps.length) {
    await Room.bulkWrite(bulkOps);
  }

  return NextResponse.json({ ok: true, upserted: bulkOps.length, items: items.length });
}