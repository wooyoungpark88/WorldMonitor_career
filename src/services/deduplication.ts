/**
 * 고도화된 중복 제거 — 유사도 기반 (title 앞 30자 비교보다 정교)
 *
 * 1. 정규화: 특수문자/공백 제거, 소문자 변환
 * 2. N-gram 기반 유사도 (bigram)
 * 3. 7일 이상 된 기사 자동 제외
 */

import type { RssItem } from './rssFeed';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBigrams(text: string): Set<string> {
  const normalized = normalize(text);
  const bigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.slice(i, i + 2));
  }
  return bigrams;
}

function bigramSimilarity(a: string, b: string): number {
  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);

  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

const DEDUP_THRESHOLD = 0.6; // 60% bigram overlap = duplicate

/**
 * Remove duplicate articles and filter old ones
 */
export function deduplicateNews(items: RssItem[]): RssItem[] {
  const now = Date.now();

  // 1. Filter out articles older than 7 days
  const recent = items.filter(item => {
    if (!item.pubDate) return true; // keep if no date
    const pubTime = new Date(item.pubDate).getTime();
    if (isNaN(pubTime)) return true; // keep if invalid date
    return (now - pubTime) < MAX_AGE_MS;
  });

  // 2. Deduplicate by title similarity
  const kept: RssItem[] = [];

  for (const item of recent) {
    let isDuplicate = false;

    for (const existing of kept) {
      const sim = bigramSimilarity(item.title, existing.title);
      if (sim >= DEDUP_THRESHOLD) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(item);
    }
  }

  return kept;
}
