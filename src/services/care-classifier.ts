// Care Intelligence Classification
// Domain-specific keyword patterns and relevance scoring for the care variant

export const CARE_KEYWORD_PATTERNS = {
  // Core monitoring group (high weight)
  core: [
    /developmental.?disabilit/i,
    /behavioral.?analysis.?AI/i,
    /care.?AI.?(korea|KR)/i,
    /vision.?AI.?(surveillance|monitoring)/i,
    /ABA.?technolog/i,
    /발달장애.*AI/i,
    /AI.*돌봄/i,
    /행동분석.*인공지능/i,
    /CareVia/i,
  ],

  // Market expansion group (medium weight)
  market: [
    /care.?robot/i,
    /assistive.?technolog/i,
    /digital.?therapeut/i,
    /공공조달.*AI/i,
    /복지.*AI.*플랫폼/i,
    /AAC.?(card|device|system)/i,
    /augmentative.*communication/i,
    /rehabilitation.?AI/i,
    /elderly.?care.?AI/i,
    /disability.?tech/i,
  ],

  // Competitive/threat detection group (lower weight)
  competitive: [
    /Xiaomi.*care.*robot/i,
    /Samsung.*Care.*AI/i,
    /Kakao.*Health/i,
    /Naver.*AI.*health/i,
    /disability.*AI.*startup/i,
    /카카오.*헬스/i,
    /네이버.*AI.*건강/i,
    /SKT.*로봇/i,
    /LG.*케어/i,
  ],
} as const;

export interface CareRelevanceResult {
  score: number;
  category: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedPatterns: string[];
}

/**
 * Classify care relevance of a news item.
 * Returns a score 0-100 with category.
 */
export function classifyCareRelevance(title: string, body = ''): CareRelevanceResult {
  let score = 0;
  const text = `${title} ${body}`;
  const matchedPatterns: string[] = [];

  // Core keywords: +30 each
  for (const pattern of CARE_KEYWORD_PATTERNS.core) {
    if (pattern.test(text)) {
      score += 30;
      matchedPatterns.push(pattern.source);
    }
  }

  // Market keywords: +15 each
  for (const pattern of CARE_KEYWORD_PATTERNS.market) {
    if (pattern.test(text)) {
      score += 15;
      matchedPatterns.push(pattern.source);
    }
  }

  // Competitive keywords: +10 each
  for (const pattern of CARE_KEYWORD_PATTERNS.competitive) {
    if (pattern.test(text)) {
      score += 10;
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    score: Math.min(score, 100),
    category: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
    matchedPatterns,
  };
}
