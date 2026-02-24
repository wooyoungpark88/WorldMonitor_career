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
    description: '조달 기회 탐지',
    triggers: ['welfare-policy', 'procurement'],
    minSignals: 2,
    action: '입찰 준비 시작 권고',
  },
  {
    name: 'robotics_partnership',
    description: '로보틱스 파트너십 기회',
    triggers: ['care-robotics', 'competitor', 'welfare-policy'],
    minSignals: 2,
    action: '하드웨어 통합 전략 검토 권고',
  },
  {
    name: 'competitive_threat',
    description: '경쟁사 위협 탐지',
    triggers: ['competitor'],
    minSignals: 3,
    action: '경쟁 분석 보고서 작성 권고',
  },
  {
    name: 'regulatory_change',
    description: '규제 변화 선제 대응',
    triggers: ['welfare-policy', 'ai-care-research'],
    minSignals: 2,
    action: 'EU AI Act / 국내 규제 변화 대비 권고',
  },
  {
    name: 'aba_methodology_advance',
    description: 'ABA 방법론 발전',
    triggers: ['ai-care-research', 'aba-developmental'],
    minSignals: 2,
    action: 'ABA AI 알고리즘 업데이트 검토 권고',
  },
  {
    name: 'market_expansion',
    description: '시장 확장 기회',
    triggers: ['healthcare-industry', 'welfare-policy', 'procurement'],
    minSignals: 2,
    action: '신규 시장 진입 전략 수립 권고',
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
