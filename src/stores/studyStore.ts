import { create } from 'zustand';

export interface SessionData {
  myAnswer: string;
  insight: string;
}

export interface StudySession {
  id: string;
  type: string; // financial | pricing | sroi | pitch
  step: number; // 0~4
  data: SessionData;
  startedAt: string;
}

export interface CompletedSession {
  id: string;
  type: string;
  data: SessionData;
  completedAt: string;
}

interface StudyState {
  currentSession: StudySession | null;
  completedSessions: CompletedSession[];
  setSessionStep: (step: number) => void;
  startSession: (sessionType: string) => void;
  endSession: () => void;
  updateMyAnswer: (answer: string) => void;
  updateInsight: (insight: string) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  currentSession: null,
  completedSessions: JSON.parse(localStorage.getItem('careradar_sessions') || '[]'),

  setSessionStep: (step) => set((state) => ({
    currentSession: state.currentSession ? { ...state.currentSession, step } : null
  })),

  startSession: (sessionType) => set({
    currentSession: {
      id: crypto.randomUUID(),
      type: sessionType,
      step: 0,
      data: { myAnswer: '', insight: '' },
      startedAt: new Date().toISOString(),
    }
  }),

  endSession: () => set((state) => {
    if (!state.currentSession) return state;
    const completed: CompletedSession = {
      id: state.currentSession.id,
      type: state.currentSession.type,
      data: state.currentSession.data,
      completedAt: new Date().toISOString(),
    };
    const sessions = [...state.completedSessions, completed];
    localStorage.setItem('careradar_sessions', JSON.stringify(sessions));
    return { currentSession: null, completedSessions: sessions };
  }),

  updateMyAnswer: (answer) => set((state) => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, data: { ...state.currentSession.data, myAnswer: answer } }
      : null
  })),

  updateInsight: (insight) => set((state) => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, data: { ...state.currentSession.data, insight: insight } }
      : null
  })),
}));
