/**
 * 멀티소스 크로스 검증 — 동일 이벤트를 2개 이상 소스에서 확인하면 신뢰도 상승
 *
 * 단일 소스 기사 → relevance × 0.8
 * 2개 소스 교차확인 → relevance × 1.0
 * 3개+ 소스 확인 → relevance × 1.2 + "verified" 태그
 */

import type { FilteredRssItem } from './keywordFilter';

export interface VerifiedRssItem extends FilteredRssItem {
  sourceCount: number;       // Number of sources reporting this
  isVerified: boolean;       // true if 3+ sources
  relatedSources: string[];  // Names of corroborating sources
  verifiedScore: number;     // Adjusted relevance score
}

// Jaccard similarity for two strings (word-level)
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\sㄱ-ㅎ가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\sㄱ-ㅎ가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

const SIMILARITY_THRESHOLD = 0.35; // 35% word overlap = same event

/**
 * Group articles by similarity and boost scores
 */
export function crossVerify(items: FilteredRssItem[]): VerifiedRssItem[] {
  if (items.length === 0) return [];

  // Build clusters of similar articles
  const clusters: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = [i];
    assigned.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue;

      // Skip if same source
      if (items[i]!.source === items[j]!.source) continue;

      const sim = jaccardSimilarity(items[i]!.title, items[j]!.title);
      if (sim >= SIMILARITY_THRESHOLD) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Apply score multipliers based on cluster size
  const result: VerifiedRssItem[] = [];

  for (const cluster of clusters) {
    const sources = cluster.map(i => items[i]!.source);
    const uniqueSources = [...new Set(sources)];

    const multiplier = uniqueSources.length >= 3 ? 1.2
      : uniqueSources.length >= 2 ? 1.0
      : 0.8;

    const isVerified = uniqueSources.length >= 3;

    for (const idx of cluster) {
      const item = items[idx]!;
      const verifiedScore = Math.min(100, Math.round(item.relevance_score * multiplier));
      const relatedSources = uniqueSources.filter(s => s !== item.source);

      result.push({
        ...item as FilteredRssItem,
        sourceCount: uniqueSources.length,
        isVerified,
        relatedSources,
        verifiedScore,
        relevance_score: verifiedScore, // override with boosted score
      });
    }
  }

  // Sort by verified score descending
  return result.sort((a, b) => b.verifiedScore - a.verifiedScore);
}

/**
 * Get verification summary stats
 */
export function getVerificationStats(items: VerifiedRssItem[]): {
  total: number;
  verified: number;
  multiSource: number;
  singleSource: number;
} {
  return {
    total: items.length,
    verified: items.filter(i => i.isVerified).length,
    multiSource: items.filter(i => i.sourceCount >= 2).length,
    singleSource: items.filter(i => i.sourceCount === 1).length,
  };
}
