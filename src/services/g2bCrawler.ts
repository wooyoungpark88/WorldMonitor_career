/**
 * 나라장터 공공조달 트래커 — PRD Section 5.2.2, Appendix A.1
 * Google News RSS 기반 조달 관련 뉴스 수집 + 적합도 태깅
 * (나라장터 API 연동 시 VITE_G2B_API_KEY로 확장 가능)
 */

import { fetchAllNews } from './rssFeed';
import { filterByKeywords, type FilteredRssItem } from './keywordFilter';

export interface ProcurementListing {
  id: string;
  title: string;
  agency: string;
  budget: number;
  deadline: string;
  bid_type: string;
  source_url: string;
  fitness_score: 'high' | 'medium' | 'low';
  fitness_reason: string;
  matched_keywords: string[];
  fetched_at: string;
}

const FITNESS_RULES = {
  high: [
    'AI 돌봄',
    'Vision AI',
    '영상 분석 돌봄',
    '발달장애 AI',
    '정신건강 AI',
    '행동분석',
    '발달장애',
    'ABA',
    '특수교육',
    '장애인 돌봄',
    '행동치료',
    '디지털치료제',
  ],
  medium: [
    'CCTV 지능형',
    'AI 모니터링',
    '돌봄 로봇',
    '원격 돌봄',
    '돌봄',
    '장애인',
    '케어테크',
    '정신건강',
    '멘탈케어',
    '돌봄 플랫폼',
  ],
  low: ['AI', 'CCTV', '영상분석', '입찰', '조달'],
};

const EXCLUSION_KEYWORDS = [
  '군사',
  '방산',
  '군수',
  '국방',
  '무기',
  '감시',
  '보안',
  '출입통제',
];

function hasExclusion(text: string): boolean {
  const lower = text.toLowerCase();
  return EXCLUSION_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function computeFitness(text: string): { score: 'high' | 'medium' | 'low'; reason: string; matched: string[] } | null {
  if (hasExclusion(text)) return null;

  const lower = text.toLowerCase();
  const highMatched: string[] = [];
  const mediumMatched: string[] = [];
  const lowMatched: string[] = [];

  for (const kw of FITNESS_RULES.high) {
    if (lower.includes(kw.toLowerCase())) highMatched.push(kw);
  }
  for (const kw of FITNESS_RULES.medium) {
    if (lower.includes(kw.toLowerCase())) mediumMatched.push(kw);
  }
  for (const kw of FITNESS_RULES.low) {
    if (lower.includes(kw.toLowerCase())) lowMatched.push(kw);
  }

  const hasBid = lower.includes('입찰') || lower.includes('조달');

  if (highMatched.length > 0) {
    return {
      score: 'high',
      reason: `핵심 키워드: ${highMatched.join(', ')}`,
      matched: highMatched,
    };
  }

  if (mediumMatched.length > 0) {
    const bonus = hasBid ? ' (입찰/조달 관련)' : '';
    return {
      score: 'medium',
      reason: `관련 키워드: ${mediumMatched.join(', ')}${bonus}`,
      matched: mediumMatched,
    };
  }

  if (lowMatched.length > 0 && hasBid) {
    return {
      score: 'low',
      reason: `일반 키워드: ${lowMatched.join(', ')}`,
      matched: lowMatched,
    };
  }

  return {
    score: 'low',
    reason: lowMatched.length > 0 ? `일반 키워드: ${lowMatched.join(', ')}` : '키워드 미매칭',
    matched: lowMatched,
  };
}

function extractAgencyFromTitle(title: string): string {
  const patterns = [
    /(보건복지부|과기정통부|고용노동부|복지부|과기부|노동부)/,
    /(○○시|△△도|서울|부산|대구|인천|광주|대전|울산|세종)/,
    /(국립\w+병원|대학병원|의료원)/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m && m[1]) return m[1];
  }
  return '미상';
}

/**
 * policy 트랙 뉴스에서 조달 관련 항목 추출 및 적합도 태깅
 * high/medium만 노출 (low 제외), exclusion 키워드 매칭 시 제외
 */
export async function fetchProcurementListings(): Promise<ProcurementListing[]> {
  const items = await fetchAllNews();
  const filtered = filterByKeywords(items);
  const policyItems = filtered.filter((i) => i.track === 'policy') as FilteredRssItem[];

  const listings: ProcurementListing[] = [];
  let idx = 0;

  for (const item of policyItems) {
    const text = `${item.title} ${item.description}`;
    const result = computeFitness(text);
    if (!result) continue;

    const { score, reason, matched } = result;
    if (score === 'low') continue;

    const agency = extractAgencyFromTitle(item.title);
    listings.push({
      id: `proc-${item.id}-${idx}`,
      title: item.title,
      agency,
      budget: 0,
      deadline: '',
      bid_type: 'news',
      source_url: item.link,
      fitness_score: score,
      fitness_reason: reason,
      matched_keywords: [...matched, ...(item.keywords_matched ?? [])].filter(
        (k, i, arr) => arr.indexOf(k) === i
      ),
      fetched_at: new Date().toISOString(),
    });
    idx++;
    if (listings.length >= 15) break;
  }

  return listings;
}
