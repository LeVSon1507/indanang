// Playwright-based Facebook Group crawler with login
// Reads credentials from env: FACEBOOK_EMAIL, FACEBOOK_PASSWORD
// Usage: crawlFacebookGroupPW(groupUrl, { scroll: 6 })

export async function crawlFacebookGroupPW(groupUrl, opts = {}) {
  if (!groupUrl) {
    return { items: [], error: 'Missing group URL' };
  }

  const email = process.env.FACEBOOK_EMAIL;
  const password = process.env.FACEBOOK_PASSWORD;
  if (!email || !password) {
    return { items: [], error: 'Missing FACEBOOK_EMAIL or FACEBOOK_PASSWORD in env' };
  }

  let playwright;
  try {
    // dynamic import to avoid crashing if playwright not installed
    playwright = await import('playwright');
  } catch (e) {
    return { items: [], error: 'Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium' };
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // Login
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="pass"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('button[name="login"]'),
    ]);

    // Navigate to group
    await page.goto(groupUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Try waiting for feed/articles
    await page.waitForSelector('[role="article"], [data-pagelet^="GroupFeed"]', { timeout: 20000 }).catch(() => {});

    // Auto scroll to load more posts
    const scrollRounds = typeof opts.scroll === 'number' ? opts.scroll : 6;
    for (let i = 0; i < scrollRounds; i++) {
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
    }

    const rawItems = await page.evaluate(() => {
      const normalize = (t) => (t || '').replace(/[\s\u00A0]+/g, ' ').trim();
      const parsePrice = (text) => {
        const t = normalize(text).toLowerCase();
        // triệu / tr
        const mTrieu = t.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr)\b/i);
        if (mTrieu) {
          const n = parseFloat(mTrieu[1].replace(/\./g, '').replace(',', '.'));
          if (!isNaN(n)) return Math.round(n * 1_000_000);
        }
        // nghìn / ngàn / k
        const mNghin = t.match(/(\d+(?:[.,]\d+)?)\s*(nghìn|ngàn|k)\b/i);
        if (mNghin) {
          const n = parseFloat(mNghin[1].replace(/\./g, '').replace(',', '.'));
          if (!isNaN(n)) return Math.round(n * 1_000);
        }
        // vnđ / vnd / đồng / đ
        const mVnd = t.match(/(\d[\d.,\s]+)\s*(vnđ|vnd|đồng|đ)\b/i);
        if (mVnd) {
          const n = parseInt(mVnd[1].replace(/[^\d]/g, ''), 10);
          if (!isNaN(n)) return n;
        }
        // fallback: chuỗi số dài (>=4)
        const m = t.match(/(\d{4,})/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n)) return n;
        }
        return undefined;
      };
      const districtRe = /(Hải Châu|Thanh Khê|Sơn Trà|Ngũ Hành Sơn|Cẩm Lệ|Liên Chiểu|Hòa Vang)/i;
      const articles = Array.from(document.querySelectorAll('[role="article"]'));
      const out = [];
      for (const el of articles) {
        const text = normalize(el.innerText || '');
        if (!text) continue;
        const title = normalize(text.split('\n')[0]).slice(0, 160) || normalize(text).slice(0, 160);
        const price = parsePrice(text);
        const dm = text.match(districtRe);
        const district = dm ? dm[1] : '';
        let href = '';
        const a = el.querySelector('a[href*="/groups/"]');
        if (a) {
          href = a.getAttribute('href') || '';
        }
        if (href && !href.startsWith('http')) {
          try { href = new URL(href, location.origin).toString(); } catch (e) {}
        }
        const imgs = Array.from(el.querySelectorAll('img')).map((img) => img.src).filter(Boolean);
        const sidMatch = href.match(/permalink\/(\d+)/) || href.match(/posts\/(\d+)/);
        const sourceId = sidMatch ? sidMatch[1] : undefined;
        out.push({
          title,
          price,
          address: district || 'Đà Nẵng',
          district,
          area: 0,
          images: imgs.slice(0, 5),
          url: href || location.href,
          postedAtMs: Date.now(),
          source: 'facebook',
          rawDescription: text,
          sourceId,
        });
      }
      return out;
    });

    // Filter and post-process
    const items = rawItems
      .filter((it) => it.title && it.price)
      .map((it) => ({
        ...it,
        postedAt: new Date(it.postedAtMs),
      }));

    return { items };
  } catch (err) {
    return { items: [], error: err?.message || String(err) };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}