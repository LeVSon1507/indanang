import { normalizeText, parsePrice, detectDistrict } from '../utils/normalize.mjs';

export async function crawlFacebookGroup(groupId) {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    return { items: [], error: 'Missing FACEBOOK_ACCESS_TOKEN' };
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${groupId}/feed?fields=message,created_time,permalink_url,id,attachments{media_type,media,url},from&limit=50&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { items: [], error: `Facebook API ${res.status}` };
    }
    const data = await res.json();
    const posts = data.data || [];
    const items = posts
      .map((p) => {
        const text = normalizeText(p.message || '');
        // Heuristic: chỉ lấy bài có từ khóa cho thuê/phòng trọ
        const hasKeyword = /(cho thuê|phòng trọ|chung cư|căn hộ|trọ)/i.test(text);
        if (!hasKeyword) return null;
        const price = parsePrice(text) || 0;
        const district = detectDistrict(text) || '';
        const title = text.slice(0, 80);
        const address = ''; // Thường không có địa chỉ rõ ràng trong bài FB
        const images = [];
        const postedAt = p.created_time ? new Date(p.created_time) : new Date();
        const url = p.permalink_url || `https://facebook.com/${p.id}`;
        const sourceId = p.id;
        return {
          title,
          price,
          address,
          district,
          area: 0,
          images,
          url,
          postedAt,
          source: 'facebook',
          rawDescription: p.message || '',
          sourceId,
        };
      })
      .filter(Boolean);
    return { items };
  } catch (e) {
    return { items: [], error: e?.message || String(e) };
  }
}