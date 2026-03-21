/**
 * RSS Feed Service — CARE_FEEDS 기반 뉴스 수집
 * config/feeds.ts의 CARE_FEEDS를 사용하여 4트랙(caretech, investment, competitor, policy) 피드 수집
 */

import type { Feed } from '@/types';
import { FEEDS } from '@/config/feeds';
import { deduplicateNews } from './deduplication';

export interface RssItem {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  description: string;
  track: 'caretech' | 'investment' | 'competitor' | 'policy';
  keywords_matched?: string[];
  relevance_score?: number;
}

interface FeedEntry {
  url: string;
  source: string;
  track: 'caretech' | 'investment' | 'competitor' | 'policy';
}

const TRACK_MAP: Record<string, 'caretech' | 'investment' | 'competitor' | 'policy'> = {
  careTech: 'caretech',
  impactFunding: 'investment',
  publicProcurement: 'policy',
  competitorIntelligence: 'competitor',
};

function resolveFeedUrl(url: string | Record<string, string>): string {
  if (typeof url === 'string') return url;
  return url.en ?? url.ko ?? Object.values(url)[0] ?? '';
}

function buildFeedList(): FeedEntry[] {
  const entries: FeedEntry[] = [];
  const feeds = FEEDS as Record<string, Feed[]>;

  for (const [category, items] of Object.entries(feeds)) {
    const track = TRACK_MAP[category];
    if (!track || !Array.isArray(items)) continue;

    for (const feed of items) {
      const url = resolveFeedUrl(feed.url);
      if (!url) continue;
      entries.push({ url, source: feed.name, track });
    }
  }

  return entries;
}

const FEED_LIST = buildFeedList();
const MAX_ITEMS_PER_FEED = 8;

function calcTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

async function fetchSingleFeed(entry: FeedEntry): Promise<RssItem[]> {
  try {
    const fetchUrl = entry.url.startsWith('/') ? entry.url : `/api/rss-proxy?url=${encodeURIComponent(entry.url)}`;
    const resp = await fetch(fetchUrl, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) return [];
    const text = await resp.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const items = xml.querySelectorAll('item');
    const results: RssItem[] = [];

    items.forEach((item, idx) => {
      if (idx >= MAX_ITEMS_PER_FEED) return;
      const title = item.querySelector('title')?.textContent?.trim() ?? '';
      const link =
        item.querySelector('link')?.textContent?.trim() ??
        item.querySelector('link')?.getAttribute('href') ??
        '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? '';
      const desc = item.querySelector('description')?.textContent?.trim() ?? '';

      if (!title) return;

      results.push({
        id: `${entry.source}-${idx}-${title.slice(0, 40)}`,
        title,
        link,
        source: entry.source,
        pubDate,
        timeAgo: pubDate ? calcTimeAgo(pubDate) : 'Recently',
        description: desc.replace(/<[^>]*>/g, '').slice(0, 200),
        track: entry.track,
      });
    });

    return results;
  } catch {
    console.warn(`[RSS] Failed to fetch ${entry.source}: timeout or error`);
    return [];
  }
}

export async function fetchAllNews(): Promise<RssItem[]> {
  const results = await Promise.allSettled(FEED_LIST.map((f) => fetchSingleFeed(f)));
  const allItems: RssItem[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      allItems.push(...r.value);
    }
  }

  allItems.sort((a, b) => {
    const da = new Date(a.pubDate).getTime() || 0;
    const db = new Date(b.pubDate).getTime() || 0;
    return db - da;
  });

  return deduplicateNews(allItems);
}

export { FEED_LIST };
