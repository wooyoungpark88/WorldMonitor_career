/**
 * RSS Feed Service — 실제 RSS 피드를 파싱해 뉴스 아이템을 반환합니다.
 * Vite dev 서버 proxy 및 production Caddy proxy를 통해 CORS 우회합니다.
 */

export interface RssItem {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  description: string;
}

interface FeedConfig {
  url: string;
  source: string;
}

const CARE_FEEDS: FeedConfig[] = [
  { url: '/rss/guardian/society/rss', source: 'The Guardian' },
  { url: '/rss/bbc/news/health/rss.xml', source: 'BBC Health' },
  { url: '/rss/cnbc/id/10000108/device/rss/rss.html', source: 'CNBC Healthcare' },
];

const TECH_FEEDS: FeedConfig[] = [
  { url: '/rss/techcrunch/feed/', source: 'TechCrunch' },
  { url: '/rss/hn/newest?q=healthcare+AI', source: 'Hacker News' },
];

const ALL_FEEDS = [...CARE_FEEDS, ...TECH_FEEDS];

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

async function fetchSingleFeed(feed: FeedConfig): Promise<RssItem[]> {
  try {
    const resp = await fetch(feed.url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const text = await resp.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    const results: RssItem[] = [];
    
    items.forEach((item, idx) => {
      if (idx >= 5) return; // max 5 per feed
      const title = item.querySelector('title')?.textContent?.trim() ?? '';
      const link = item.querySelector('link')?.textContent?.trim() ?? '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? '';
      const desc = item.querySelector('description')?.textContent?.trim() ?? '';
      
      if (!title) return;
      
      results.push({
        id: `${feed.source}-${idx}`,
        title,
        link,
        source: feed.source,
        pubDate,
        timeAgo: pubDate ? calcTimeAgo(pubDate) : 'Recently',
        description: desc.replace(/<[^>]*>/g, '').slice(0, 200),
      });
    });
    
    return results;
  } catch {
    console.warn(`[RSS] Failed to fetch ${feed.source}: timeout or error`);
    return [];
  }
}

export async function fetchAllNews(): Promise<RssItem[]> {
  const results = await Promise.allSettled(ALL_FEEDS.map(f => fetchSingleFeed(f)));
  const allItems: RssItem[] = [];
  
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allItems.push(...r.value);
    }
  }
  
  // Sort by date descending
  allItems.sort((a, b) => {
    const da = new Date(a.pubDate).getTime() || 0;
    const db = new Date(b.pubDate).getTime() || 0;
    return db - da;
  });
  
  return allItems;
}
