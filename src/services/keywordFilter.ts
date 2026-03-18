/**
 * 키워드 필터링 엔진 — PRD Section 5.1.2
 * 시장/BM/정책/투자 4개 카테고리 키워드 매칭
 */

import type { RssItem } from './rssFeed';

export type KeywordCategory = 'market' | 'bm' | 'policy' | 'investment';

export const CARE_KEYWORDS: Record<KeywordCategory, string[]> = {
  market: [
    'behavioral AI',
    'computer vision care',
    'remote patient monitoring',
    'digital therapeutics',
    'AI mental health',
    'EAP market',
    'care robotics',
    'developmental disability tech',
    'forensic psychiatry AI',
    '케어테크',
    '돌봄 AI',
    '행동분석',
    '멘탈케어',
    '원격 모니터링',
    '디지털 치료',
  ],
  bm: [
    'care SaaS pricing',
    'per-camera licensing',
    'B2G healthcare contract',
    'SROI healthcare',
    'value-based care',
    'outcome-based payment',
    '가치 기반',
    '수가',
    '과금 모델',
    '구독',
  ],
  policy: [
    '디지털치료기기 수가',
    '장애인복지법',
    '정신건강복지법',
    'CSAP',
    '소프트웨어진흥법',
    '수의계약 기준',
    '보건복지부',
    '과기정통부',
    '고용노동부',
    '입찰',
    '조달',
    '예산',
    'AI 돌봄',
    '정신건강',
    '장애인',
  ],
  investment: [
    'digital health funding',
    'behavioral health venture',
    'impact investing healthcare',
    'Series A care tech',
    '소셜벤처 투자',
    '임팩트 펀드 출자',
    '펀딩',
    '투자 유치',
    '시리즈',
    '벤처캐피탈',
    '임팩트 투자',
  ],
};

const ALL_KEYWORDS = Object.values(CARE_KEYWORDS).flat();

function matchKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const kw of ALL_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }

  return [...new Set(matched)];
}

export interface FilteredRssItem extends RssItem {
  keywords_matched: string[];
  relevance_score: number;
}

/**
 * RssItem에 키워드 매칭 및 관련성 점수 적용
 * relevance_score: 0-100 (매칭 키워드 수 + 카테고리 다양성 기반)
 */
export function filterByKeywords(items: RssItem[]): FilteredRssItem[] {
  return items.map((item) => {
    const searchText = `${item.title} ${item.description}`;
    const keywords_matched = matchKeywords(searchText);

    let relevance_score = 50;
    if (keywords_matched.length > 0) {
      relevance_score = Math.min(100, 50 + keywords_matched.length * 10);
    }

    return {
      ...item,
      keywords_matched,
      relevance_score,
    };
  });
}

/**
 * 트랙별로 필터링 (선택적)
 */
export function filterByTrack(
  items: FilteredRssItem[],
  track?: 'caretech' | 'investment' | 'competitor' | 'policy'
): FilteredRssItem[] {
  if (!track) return items;
  return items.filter((i) => i.track === track);
}

/**
 * 관련성 점수로 정렬
 */
export function sortByRelevance(items: FilteredRssItem[]): FilteredRssItem[] {
  return [...items].sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
}
