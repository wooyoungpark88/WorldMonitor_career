import { create } from 'zustand';

interface TrackingState {
  opportunityScore: number;
  setOpportunityScore: (score: number) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  opportunityScore: 50,
  setOpportunityScore: (score) => set({ opportunityScore: score }),
}));
