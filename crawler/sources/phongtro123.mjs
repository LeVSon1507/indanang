import { normalizeText, parsePrice, detectDistrict } from '../utils/normalize.mjs';

export async function crawlPhongTro123(listUrl) {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  const res = await fetch(listUrl, { headers: { 'User-Agent': ua } });
  if (!res.ok) {
    return { items: [], error: `HTTP ${res.status}` };
  }
  const html = await res.text();
  // Some pages are client-rendered; try to extract SSR listings when available
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);

  const items = [];
  $('.post-item, .listing-item, .item').each((_, el) => {
    const title = normalizeText($(el).find('h3 a, a.title, h3').first().text() || $(el).find('a').attr('title') || '');
    const href = $(el).find('h3 a, a.title, a').first().attr('href') || '';
    const priceText = normalizeText($(el).find('.price, .post-price, .listing-price').first().text());
    const address = normalizeText($(el).find('.address, .post-meta .post-location').first().text());
    const areaText = normalizeText($(el).find('.acreage, .post-meta').text());
    const price = parsePrice(priceText);
    const areaMatch = areaText.match(/([0-9]+)\s*(m²|m2)/i);
    const area = areaMatch ? Number(areaMatch[1]) : undefined;
    const district = detectDistrict(address);

    let abs = href;
    try { abs = new URL(href, listUrl).toString(); } catch {}

    if (title && price && abs) {
      items.push({ title, price, address, district, area, url: abs, source: 'phongtro123', postedAt: new Date() });
    }
  });

  return { items, error: null };
}