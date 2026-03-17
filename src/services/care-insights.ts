// Care Intelligence Convergence Rules
// Detects when multiple signal categories converge to create actionable intelligence

export interface ConvergenceRule {
  name: string;
  description: string;
  triggers: string[];
  minSignals: number;
  action: string;
}

export const CARE_CONVERGENCE_RULES: ConvergenceRule[] = [
  {
    name: 'procurement_opportunity',
    description: '공공조달 기회 탐지',
    triggers: ['publicProcurement', 'careTech'],
    minSignals: 2,
    action: 'B2G 입찰 제안서/기술 준비 권고',
  },
  {
    name: 'investment_trend',
    description: '벤처 투자 및 임팩트 펀딩 급증',
    triggers: ['impactFunding', 'careTech'],
    minSignals: 2,
    action: 'IR 자료 업데이트 및 투자자 미팅 준비',
  },
  {
    name: 'competitive_threat',
    description: '경쟁사 동향 발현 (채용/확장/재무분석)',
    triggers: ['competitorIntelligence'],
    minSignals: 2,
    action: '경쟁 분석 및 프라이싱 벤치마크 검토',
  },
  {
    name: 'market_expansion',
    description: '시장 확장 기회 (자금 지원 + 조달)',
    triggers: ['impactFunding', 'publicProcurement'],
    minSignals: 2,
    action: '신규 사업 모델 및 컨소시엄 구성 논의',
  },
  {
    name: 'super_convergence',
    description: '강력한 사업 기회 (모든 지표 상승)',
    triggers: ['careTech', 'impactFunding', 'publicProcurement', 'competitorIntelligence'],
    minSignals: 3,
    action: '전사적 전략회의 소집 (기회 점수 폭등)',
  },
];

export interface SignalCount {
  category: string;
  count: number;
  recentHeadlines: string[];
}

export interface ConvergenceAlert {
  rule: ConvergenceRule;
  matchedCategories: string[];
  totalSignals: number;
  timestamp: Date;
}

/**
 * Detect convergence patterns from signal counts.
 * Returns alerts when multiple categories converge per defined rules.
 */
export function detectConvergence(signals: SignalCount[]): ConvergenceAlert[] {
  const alerts: ConvergenceAlert[] = [];
  const signalMap = new Map(signals.map(s => [s.category, s]));

  for (const rule of CARE_CONVERGENCE_RULES) {
    const matchedCategories: string[] = [];
    let totalSignals = 0;

    for (const trigger of rule.triggers) {
      const signal = signalMap.get(trigger);
      if (signal && signal.count > 0) {
        matchedCategories.push(trigger);
        totalSignals += signal.count;
      }
    }

    if (matchedCategories.length >= rule.minSignals) {
      alerts.push({
        rule,
        matchedCategories,
        totalSignals,
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}
