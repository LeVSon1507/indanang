// Simple ChatGPT enrichment via OpenAI Chat Completions API without SDK
export async function enhanceBatchWithLLM(items, { enabled = true } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!enabled || !key) return items;
  const enhanced = [];
  for (const item of items) {
    try {
      const enriched = await enhanceWithLLM(item, key);
      enhanced.push({ ...item, ...enriched });
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      enhanced.push(item);
    }
  }
  return enhanced;
}

export async function enhanceWithLLM(item, key) {
  const prompt = `Bạn là trợ lý giúp phân tích tin thuê nhà tại Việt Nam. Trả về JSON với các trường: amenities (array), roomType (string), isOwner (boolean), spamScore (0-1). Dựa trên tiêu đề và mô tả dưới đây. Không giải thích thêm, chỉ JSON.\nTiêu đề: ${item.title}\nMô tả: ${item.rawDescription || ''}\nĐịa chỉ: ${item.address || ''}`;
  const body = {
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Bạn là trợ lý phân tích tin thuê nhà.' },
      { role: 'user', content: prompt },
    ],
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return {};
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    const json = JSON.parse(text);
    const amenities = Array.isArray(json.amenities) ? json.amenities : [];
    const roomType = typeof json.roomType === 'string' ? json.roomType : undefined;
    const isOwner = typeof json.isOwner === 'boolean' ? json.isOwner : undefined;
    const spamScore = typeof json.spamScore === 'number' ? json.spamScore : undefined;
    return { amenities, roomType, isOwner, spamScore };
  } catch {
    return {};
  }
}