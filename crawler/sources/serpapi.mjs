export async function discoverSerpApi(query, opts = {}) {
  const key = process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY;
  if (!key) {
    return { discovered: [], error: 'Missing SERPAPI_API_KEY' };
  }
  try {
    const params = new URLSearchParams();
    params.set('engine', opts.engine || 'google');
    params.set('q', query);
    params.set('hl', opts.hl || 'vi');
    params.set('gl', opts.gl || 'vn');
    params.set('num', String(opts.num || 20));
    if (opts.start != null) params.set('start', String(opts.start));
    if (opts.location) params.set('location', opts.location);
    if (opts.uule) params.set('uule', opts.uule);
    // pass-through advanced params if provided
    const advancedKeys = ['ludocid', 'lsig', 'kgmid', 'si', 'ibp', 'uds'];
    for (const k of advancedKeys) {
      if (opts[k]) params.set(k, opts[k]);
    }

    const url = `https://serpapi.com/search?${params.toString()}&api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { discovered: [], error: `SerpApi ${res.status}` };
    }
    const data = await res.json();
    if (data.error) {
      return { discovered: [], error: data.error };
    }
    const organic = data.organic_results || [];
    const discovered = [];
    for (const r of organic) {
      const link = r.link || r.url;
      if (!link) continue;
      let host;
      try { host = new URL(link).hostname.replace('www.', ''); } catch { continue; }
      let source = null;
      if (host.includes('phongtro123.com')) source = 'phongtro123';
      else if (host.includes('batdongsan.com.vn')) source = 'batdongsan';
      else if (host.includes('chotot.com')) source = 'chotot';
      else if (host.includes('facebook.com')) {
        const m = link.match(/facebook\.com\/groups\/(\d+)/);
        if (m) source = 'facebook_group_pw';
      }
      if (source) discovered.push({ source, url: link, title: r.title || '' });
    }
    return { discovered, raw: data };
  } catch (e) {
    return { discovered: [], error: e?.message || String(e) };
  }
}