// Chotot thường render client và chống scrape mạnh. Khuyến nghị Playwright + stealth.
// Đây là stub minh hoạ, sẽ trả về rỗng nếu không có Playwright.

export async function crawlChoTot(listUrl) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Chotot dùng API nội bộ; tuỳ trường hợp có thể đọc JSON từ XHR
    // Ở đây demo lấy một số selector nếu có SSR fallback
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('a').forEach((a) => {
        const title = a.getAttribute('title') || '';
        const href = a.getAttribute('href') || '';
        if (title && href && href.includes('/tin/')) {
          results.push({ title, url: new URL(href, location.href).toString() });
        }
      });
      return results;
    });
    await browser.close();
    return { items: items.map((i) => ({ ...i, source: 'chotot' })), error: null };
  } catch (e) {
    return { items: [], error: 'playwright_not_installed_or_blocked' };
  }
}