// Care Readiness Index (CRI)
// Measures country-level care technology readiness,
// analogous to Country Instability Index (CII) for the full variant.

export interface CareReadinessScore {
  country: string;
  overall: number; // 0-100
  components: {
    policyMaturity: number;   // Welfare policy maturity (0-100)
    techAdoption: number;     // AI care technology adoption (0-100)
    roboticsEco: number;      // Care robotics ecosystem (0-100)
    fundingActivity: number;  // Investment/procurement activity (0-100)
  };
  trend: 'improving' | 'stable' | 'declining';
}

// Component weights
const CRI_WEIGHTS = {
  policyMaturity: 0.35,  // Policy drives markets
  techAdoption: 0.30,
  roboticsEco: 0.20,
  fundingActivity: 0.15,
};

// Baseline scores for monitored countries (manually curated, updated periodically)
const BASELINE_SCORES: Record<string, CareReadinessScore> = {
  KR: {
    country: 'KR',
    overall: 72,
    components: {
      policyMaturity: 75,
      techAdoption: 70,
      roboticsEco: 65,
      fundingActivity: 80,
    },
    trend: 'improving',
  },
  JP: {
    country: 'JP',
    overall: 85,
    components: {
      policyMaturity: 90,
      techAdoption: 80,
      roboticsEco: 95,
      fundingActivity: 70,
    },
    trend: 'stable',
  },
  DE: {
    country: 'DE',
    overall: 68,
    components: {
      policyMaturity: 80,
      techAdoption: 60,
      roboticsEco: 70,
      fundingActivity: 55,
    },
    trend: 'improving',
  },
  US: {
    country: 'US',
    overall: 78,
    components: {
      policyMaturity: 65,
      techAdoption: 90,
      roboticsEco: 80,
      fundingActivity: 85,
    },
    trend: 'stable',
  },
  CN: {
    country: 'CN',
    overall: 70,
    components: {
      policyMaturity: 60,
      techAdoption: 75,
      roboticsEco: 80,
      fundingActivity: 70,
    },
    trend: 'improving',
  },
  IL: {
    country: 'IL',
    overall: 65,
    components: {
      policyMaturity: 55,
      techAdoption: 80,
      roboticsEco: 60,
      fundingActivity: 75,
    },
    trend: 'stable',
  },
  NL: {
    country: 'NL',
    overall: 62,
    components: {
      policyMaturity: 75,
      techAdoption: 55,
      roboticsEco: 50,
      fundingActivity: 60,
    },
    trend: 'stable',
  },
  GB: {
    country: 'GB',
    overall: 60,
    components: {
      policyMaturity: 70,
      techAdoption: 55,
      roboticsEco: 45,
      fundingActivity: 65,
    },
    trend: 'stable',
  },
};

/**
 * Calculate the weighted CRI score from components.
 */
function calculateOverall(components: CareReadinessScore['components']): number {
  return Math.round(
    components.policyMaturity * CRI_WEIGHTS.policyMaturity +
    components.techAdoption * CRI_WEIGHTS.techAdoption +
    components.roboticsEco * CRI_WEIGHTS.roboticsEco +
    components.fundingActivity * CRI_WEIGHTS.fundingActivity,
  );
}

/**
 * Get the CRI score for a country.
 * Returns baseline score or null if not monitored.
 */
export function getCareReadinessScore(countryCode: string): CareReadinessScore | null {
  return BASELINE_SCORES[countryCode] ?? null;
}

/**
 * Get all monitored countries with CRI scores.
 */
export function getAllCareReadinessScores(): CareReadinessScore[] {
  return Object.values(BASELINE_SCORES);
}

/**
 * Get countries ranked by CRI score (descending).
 */
export function getCareReadinessRanking(): CareReadinessScore[] {
  return Object.values(BASELINE_SCORES)
    .sort((a, b) => b.overall - a.overall);
}

/**
 * Apply a signal-based adjustment to a country's CRI.
 * Positive signals (new policy, funding) increase; negative signals (competitor entry) may decrease.
 */
export function adjustCareReadiness(
  countryCode: string,
  adjustments: Partial<CareReadinessScore['components']>,
): CareReadinessScore | null {
  const baseline = BASELINE_SCORES[countryCode];
  if (!baseline) return null;

  const components = { ...baseline.components };
  for (const [key, value] of Object.entries(adjustments)) {
    if (key in components && typeof value === 'number') {
      (components as Record<string, number>)[key] = Math.max(0, Math.min(100, (components as Record<string, number>)[key] + value));
    }
  }

  return {
    ...baseline,
    components,
    overall: calculateOverall(components),
  };
}
