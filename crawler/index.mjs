import fs from 'fs';
import path from 'path';
import { connect } from './db.mjs';
import { upsertRooms } from './save.mjs';
import { crawlPhongTro123 } from './sources/phongtro123.mjs';
import { crawlBatDongSan } from './sources/batdongsan.mjs';
import { crawlChoTot } from './sources/chotot.mjs';
import { crawlFacebookGroup } from './sources/facebook.mjs';
import { crawlFacebookGroupPW } from './sources/facebook_pw.mjs'
import { geocodeAddress } from './utils/google.mjs';
import { enhanceBatchWithLLM } from './pipeline/llm.mjs';
import { discoverSerpApi } from './sources/serpapi.mjs';

const SOURCES = {
  phongtro123: crawlPhongTro123,
  batdongsan: crawlBatDongSan,
  chotot: crawlChoTot,
  facebook_group: crawlFacebookGroup,
  facebook_group_pw: crawlFacebookGroupPW,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const clean = a.replace(/^--/, '');
      if (clean.includes('=')) {
        const [k, v] = clean.split('=');
        params[k] = v;
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          params[clean] = next;
          i++;
        } else {
          params[clean] = true;
        }
      }
    } else if (a.includes('=')) {
      const [k, v] = a.split('=');
      params[k] = v;
    }
  }
  return params;
}

async function enrichItems(items) {
  const withGeo = [];
  for (const it of items) {
    if (it.address) {
      const { location, district } = await geocodeAddress(it.address);
      if (location) it.location = location;
      if (!it.district && district) it.district = district;
    }
    withGeo.push(it);
    await new Promise((r) => setTimeout(r, 200));
  }
  const enhanced = await enhanceBatchWithLLM(withGeo, { enabled: true });
  return enhanced.map((x) => ({ ...x, crawledAt: new Date() }));
}

export async function runSingle(source, url, params) {
  await connect();
  if (source === 'serpapi') {
    const { discovered, error } = await discoverSerpApi(url, params || {});
    if (error) console.warn(`[serpapi] discovery error:`, error);
    const targets = discovered || [];
    let totalItems = 0;
    let totalUpserted = 0;
    const crawledSources = [];
    for (const t of targets) {
      if (!SOURCES[t.source]) continue;
      try {
        const { items } = await SOURCES[t.source](t.url, params);
        if (items?.length) {
          const enriched = await enrichItems(items);
          const { upserted } = await upsertRooms(enriched);
          totalItems += items.length;
          totalUpserted += upserted;
          crawledSources.push(t.source);
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e) {
        console.warn(`[${t.source}] crawl failed:`, e?.message || e);
      }
    }
    console.log(`[serpapi] discovered ${targets.length}, crawled ${totalItems}, upserted ${totalUpserted}`);
    return { discoveredCount: targets.length, crawledCount: totalItems, upsertedCount: totalUpserted, sourcesCrawled: crawledSources };
  }

  if (!SOURCES[source]) {
    console.error('Unknown source:', source);
    process.exitCode = 2;
    return { discoveredCount: 0, crawledCount: 0, upsertedCount: 0, sourcesCrawled: [] };
  }
  const { items, error } = await SOURCES[source](url, params);
  if (error) {
    console.warn(`[${source}] crawl error:`, error);
  }
  let crawledCount = items?.length || 0;
  let upsertedCount = 0;
  if (items?.length) {
    const enriched = await enrichItems(items);
    const { upserted } = await upsertRooms(enriched);
    upsertedCount = upserted;
    console.log(`[${source}] crawled ${items.length}, upserted ${upserted}`);
  } else {
    console.log(`[${source}] no items`);
  }
  return { discoveredCount: 0, crawledCount, upsertedCount, sourcesCrawled: [source] };
}

export async function runJobs() {
  await connect();
  const jobsPath = path.join(process.cwd(), 'crawler', 'jobs.json');
  let jobs = [];
  if (!fs.existsSync(jobsPath)) {
    console.log('No jobs.json found, exiting.');
    return;
  }
  try {
    const text = fs.readFileSync(jobsPath, 'utf-8');
    jobs = JSON.parse(text);
  } catch (e) {
    console.warn('Failed to read jobs.json:', e?.message || e);
    return;
  }
  for (const job of jobs) {
    const { source, url } = job;
    if (source === 'serpapi') {
      const { discovered, error } = await discoverSerpApi(url, job);
      if (error) console.warn(`[serpapi] job discovery error:`, error);
      const targets = discovered || [];
      let totalItems = 0;
      let totalUpserted = 0;
      for (const t of targets) {
        if (!SOURCES[t.source]) continue;
        try {
          const { items } = await SOURCES[t.source](t.url, job);
          if (items?.length) {
            const enriched = await enrichItems(items);
            const { upserted } = await upsertRooms(enriched);
            totalItems += items.length;
            totalUpserted += upserted;
            await new Promise((r) => setTimeout(r, 1000));
          }
        } catch (e) {
          console.warn(`[${t.source}] job failed:`, e?.message || e);
        }
      }
      console.log(`[serpapi] job discovered ${targets.length}, crawled ${totalItems}, upserted ${totalUpserted}`);
      continue;
    }
    if (!SOURCES[source]) {
      console.warn('Unknown source in jobs:', source);
      continue;
    }
    try {
      const { items, error } = await SOURCES[source](url, job);
      if (error) console.warn(`[${source}] job error:`, error);
      if (items?.length) {
        const enriched = await enrichItems(items);
        const { upserted } = await upsertRooms(enriched);
        console.log(`[${source}] job crawled ${items.length}, upserted ${upserted}`);
      } else {
        console.log(`[${source}] job no items`);
      }
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.warn(`[${source}] job failed:`, e?.message || e);
    }
  }
}

(async () => {
  const params = parseArgs();
  const source = params.source;
  const url = params.url;
  if (source && url) {
    await runSingle(source, url, params);
  } else {
    await runJobs();
  }
})();