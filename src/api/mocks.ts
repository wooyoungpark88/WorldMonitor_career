/**
 * CareRadar Unified Mock APIs
 * Intended to be replaced by actual Supabase edge functions routing to Claude & DART
 */

export const mockDartApi = {
  getCompanyFinancialSummary: async (_companyName: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          revenue: '15.2M',
          rd_expense: '4.1M',
          rd_ratio: '27%',
          trend: 'Aggressive R&D upscaling detected'
        });
      }, 500);
    });
  }
};

export const mockClaudeApi = {
  getExpertFeedback: async (_context: string, _userInsight: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          reference: "Based on CareVia's strategy, you should emphasize value-add logic rather than pure price cuts.",
          gapAnalysis: [
            { type: 'miss', label: 'Strategy Shift', feedback: 'You competed purely on price.' }
          ]
        });
      }, 800);
    });
  }
};
