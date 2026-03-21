/**
 * Source Tiering System — 소스 신뢰도 기반 우선순위
 *
 * Tier 1: 직접 RSS (원본 소스에서 직접 제공하는 피드)
 * Tier 2: 전문 매체 (도메인 전문성 높은 매체)
 * Tier 3: Google News 등 애그리게이터
 * Tier 4: 기타/미분류
 */

export type SourceTier = 1 | 2 | 3 | 4;

export const CARE_SOURCE_TIERS: Record<string, SourceTier> = {
  // Tier 1 — Direct RSS from authoritative sources
  'Fierce Healthcare': 1,
  'MobiHealthNews': 1,
  'Healthcare IT News': 1,
  'STAT News': 1,
  'Nature Digital Medicine': 1,
  'Rock Health': 1,
  'CB Insights': 1,
  'Crunchbase News': 1,
  'ImpactAlpha': 1,
  'PitchBook News': 3, // Google News fallback (direct RSS blocked by Cloudflare)
  'GIIN': 3, // Google News fallback (403 security challenge)
  '고용노동부': 3, // Google News site: search (direct RSS blocked by firewall)
  '보건복지부': 3, // Google News site: search
  '과기정통부': 3, // Google News site: search

  // Tier 2 — Domain-specialized media
  'Digital Health Today': 2,
  'IEEE Spectrum Health': 2,
  'TechCrunch Health': 2,
  'TechCrunch Startups': 2,
  '메디게이트뉴스': 3, // Google News fallback (direct RSS requires login)
  '메디게이트 기업': 3, // Google News fallback
  '복지타임즈': 2,
  '복지타임즈 정책': 2,
  '에이블뉴스': 2,
  '에이블뉴스 정책': 2,
  '로봇신문': 2,
  '로봇신문 기업': 2,
  '인공지능신문': 2,
  '인공지능신문 기업': 2,
  '바이오스펙테이터': 3, // Google News fallback (direct RSS 404)
  '벤처스퀘어': 2,
  '플래텀': 2,
  '더브이씨': 3, // Google News fallback (direct RSS 404)
  '스타트업엔': 2,

  // Tier 3 — Aggregators (Google News based)
  '돌봄AI 뉴스': 3,
  '임팩트 투자': 3,
  'Digital Health VC': 3,
  '나라장터 AI/돌봄': 3,
  '디지털치료제 정책': 3,
  '장애인 복지 정책': 3,
  '네오펙트': 3,
  '뷰노': 3,
  '루닛': 3,
  '플라이투': 3,
  'Woebot Health': 3,
  'Ambient.ai': 3,
  '소풍벤처스': 3,
  'MYSC': 3,
  'D3쥬빌리': 3,
  'Cogito': 3,
  'Nourish Care': 3,
  'SimCare AI': 3,
  'Psych Central': 2,
  'Mental Health AI': 3,
  '멘탈케어 AI': 3,
  '디지털치료제': 3,
  'Ginger/Headspace': 3,
  'Talkiatry': 3,
  '마인드AI': 3,
};

export function getSourceTier(sourceName: string): SourceTier {
  return CARE_SOURCE_TIERS[sourceName] ?? 4;
}

export function getTierLabel(tier: SourceTier): string {
  switch (tier) {
    case 1: return '직접 소스';
    case 2: return '전문 매체';
    case 3: return '애그리게이터';
    case 4: return '기타';
  }
}

export function getTierEmoji(tier: SourceTier): string {
  switch (tier) {
    case 1: return '🔵';
    case 2: return '🟢';
    case 3: return '🟡';
    case 4: return '⚪';
  }
}
