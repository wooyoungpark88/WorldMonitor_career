import { create } from 'zustand';

export interface OpportunityScoreState {
  total: number;
  s1: number;
  s2: number;
  s3: number;
  shouldAlert: boolean;
}

interface TrackingState {
  opportunityScore: number;
  opportunityScores: OpportunityScoreState;
  setOpportunityScore: (score: number) => void;
  setOpportunityScores: (scores: OpportunityScoreState) => void;
}

const defaultScores: OpportunityScoreState = {
  total: 50,
  s1: 50,
  s2: 50,
  s3: 50,
  shouldAlert: false,
};

export const useTrackingStore = create<TrackingState>((set) => ({
  opportunityScore: 50,
  opportunityScores: defaultScores,
  setOpportunityScore: (score) => set({ opportunityScore: score }),
  setOpportunityScores: (scores) =>
    set({ opportunityScore: scores.total, opportunityScores: scores }),
}));
