/**
 * Opportunity Score 산출 — PRD Section 5.2.1
 * Score = S1×0.4 + S2×0.3 + S3×0.3
 * S1: 정책/예산 (policy), S2: 자금유입 (investment), S3: 경쟁사 (competitor)
 */

import type { RssItem } from './rssFeed';
import type { FilteredRssItem } from './keywordFilter';

const WEIGHTS = { S1_policy: 0.4, S2_funding: 0.3, S3_competitor: 0.3 } as const;
const ALERT_THRESHOLD = 70;
const HIGH_PRIORITY_THRESHOLD = 85;

export interface OpportunityScoreResult {
  total: number;
  s1: number;
  s2: number;
  s3: number;
  shouldAlert: boolean;
  isHighPriority: boolean;
}

function computeTrackScore(
  items: RssItem[],
  track: 'policy' | 'investment' | 'competitor',
  maxScore = 100
): number {
  const filtered = items.filter((i) => i.track === track);
  if (filtered.length === 0) return 0;

  const withRelevance = filtered as FilteredRssItem[];
  const avgRelevance =
    withRelevance.reduce((sum, i) => sum + (i.relevance_score ?? 50), 0) / filtered.length;
  const countFactor = Math.min(1, filtered.length / 5);
  const score = Math.round(avgRelevance * 0.6 + countFactor * 40);
  return Math.min(maxScore, Math.max(0, score));
}

/**
 * 뉴스 아이템으로부터 Opportunity Score 산출
 */
export function calculateOpportunityScore(items: RssItem[]): OpportunityScoreResult {
  const s1 = computeTrackScore(items, 'policy');
  const s2 = computeTrackScore(items, 'investment');
  const s3 = computeTrackScore(items, 'competitor');

  const total = Math.round(s1 * WEIGHTS.S1_policy + s2 * WEIGHTS.S2_funding + s3 * WEIGHTS.S3_competitor);
  const clampedTotal = Math.min(100, Math.max(0, total));

  return {
    total: clampedTotal,
    s1,
    s2,
    s3,
    shouldAlert: clampedTotal >= ALERT_THRESHOLD,
    isHighPriority: clampedTotal >= HIGH_PRIORITY_THRESHOLD,
  };
}

export { ALERT_THRESHOLD, HIGH_PRIORITY_THRESHOLD };
