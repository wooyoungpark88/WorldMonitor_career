import { create } from 'zustand';

export interface OpportunityScoreState {
  total: number;
  s1: number;
  s2: number;
  s3: number;
  shouldAlert: boolean;
}

export interface ScoreHistoryEntry {
  timestamp: string;
  total: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface ContributingNewsItem {
  id: string;
  title: string;
  link: string;
}

export interface TopContributingNews {
  policy: ContributingNewsItem[];
  investment: ContributingNewsItem[];
  competitor: ContributingNewsItem[];
}

interface TrackingState {
  opportunityScore: number;
  opportunityScores: OpportunityScoreState;
  scoreHistory: ScoreHistoryEntry[];
  topContributingNews: TopContributingNews;
  setOpportunityScore: (score: number) => void;
  setOpportunityScores: (scores: OpportunityScoreState) => void;
  addScoreHistory: (entry: ScoreHistoryEntry) => void;
  setTopContributingNews: (news: TopContributingNews) => void;
}

const HISTORY_KEY = 'careradar_score_history';
const MAX_HISTORY = 20;

function loadHistory(): ScoreHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

const defaultScores: OpportunityScoreState = {
  total: 50,
  s1: 50,
  s2: 50,
  s3: 50,
  shouldAlert: false,
};

export const useTrackingStore = create<TrackingState>((set, get) => ({
  opportunityScore: 50,
  opportunityScores: defaultScores,
  scoreHistory: loadHistory(),
  topContributingNews: { policy: [], investment: [], competitor: [] },

  setOpportunityScore: (score) => set({ opportunityScore: score }),

  setOpportunityScores: (scores) =>
    set({ opportunityScore: scores.total, opportunityScores: scores }),

  addScoreHistory: (entry) => {
    const prev = get().scoreHistory;
    const last = prev[prev.length - 1];
    if (last && last.total === entry.total && last.s1 === entry.s1 && last.s2 === entry.s2 && last.s3 === entry.s3) return;
    const next = [...prev, entry].slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    set({ scoreHistory: next });
  },

  setTopContributingNews: (news) => set({ topContributingNews: news }),
}));
