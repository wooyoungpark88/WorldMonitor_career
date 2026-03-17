import { create } from 'zustand';

interface StudySession {
  id: string;
  step: number; // 0: Question, 1: My Answer, 2: AI Reference, 3: Gap Check, 4: Insight
  // other fields will be added later
}

interface StudyState {
  currentSession: StudySession | null;
  setSessionStep: (step: number) => void;
  startSession: (_sessionType: string) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  currentSession: null,
  setSessionStep: (step) => set((state) => ({ 
    currentSession: state.currentSession ? { ...state.currentSession, step } : null 
  })),
  startSession: (_sessionType) => set({ 
    currentSession: { id: crypto.randomUUID(), step: 0 } 
  }),
}));
