import { normalizeText, parsePrice, detectDistrict } from '../utils/normalize.mjs';

export async function crawlBatDongSan(listUrl) {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  const res = await fetch(listUrl, { headers: { 'User-Agent': ua } });
  if (!res.ok) {
    return { items: [], error: `HTTP ${res.status}` };
  }
  const html = await res.text();
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);

  const items = [];
  $('.js-bds-search-list .search-productItem, .item').each((_, el) => {
    const title = normalizeText($(el).find('h3 a, .pr-title a').first().text());
    const href = $(el).find('h3 a, .pr-title a').first().attr('href') || '';
    const priceText = normalizeText($(el).find('.price, .pr-price').first().text());
    const address = normalizeText($(el).find('.address, .location').first().text());
    const price = parsePrice(priceText);
    const district = detectDistrict(address);

    let abs = href;
    try { abs = new URL(href, listUrl).toString(); } catch {}

    if (title && price && abs) {
      items.push({ title, price, address, district, url: abs, source: 'batdongsan', postedAt: new Date() });
    }
  });

  return { items, error: null };
}