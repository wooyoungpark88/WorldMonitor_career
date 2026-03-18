import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ArticleContext {
  title: string;
  description: string;
  link: string;
  track: string;
  keywords: string[];
}

export interface SessionData {
  myAnswer: string;
  insight: string;
}

export interface StudySession {
  id: string;
  type: string;
  step: number;
  data: SessionData;
  startedAt: string;
  articleContext?: ArticleContext;
}

export interface CompletedSession {
  id: string;
  type: string;
  data: SessionData;
  completedAt: string;
  articleContext?: ArticleContext;
}

interface StudyState {
  currentSession: StudySession | null;
  completedSessions: CompletedSession[];
  setSessionStep: (step: number) => void;
  startSession: (sessionType: string, articleContext?: ArticleContext) => void;
  clearSession: () => void;
  endSession: () => void;
  updateMyAnswer: (answer: string) => void;
  updateInsight: (insight: string) => void;
  loadFromSupabase: () => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentSession: null,
  completedSessions: JSON.parse(localStorage.getItem('careradar_sessions') || '[]'),

  setSessionStep: (step) => set((state) => ({
    currentSession: state.currentSession ? { ...state.currentSession, step } : null
  })),

  startSession: (sessionType, articleContext) => set({
    currentSession: {
      id: crypto.randomUUID(),
      type: sessionType,
      step: 0,
      data: { myAnswer: '', insight: '' },
      startedAt: new Date().toISOString(),
      articleContext,
    }
  }),

  clearSession: () => set({ currentSession: null }),

  endSession: () => {
    const state = get();
    if (!state.currentSession) return;
    
    const completed: CompletedSession = {
      id: state.currentSession.id,
      type: state.currentSession.type,
      data: state.currentSession.data,
      completedAt: new Date().toISOString(),
      articleContext: state.currentSession.articleContext,
    };
    
    const sessions = [...state.completedSessions, completed];
    localStorage.setItem('careradar_sessions', JSON.stringify(sessions));

    supabase.from('insights').insert({
      id: completed.id,
      session_type: completed.type,
      my_answer: completed.data.myAnswer,
      insight_text: completed.data.insight,
      completed_at: completed.completedAt,
    }).then(({ error }) => {
      if (error) console.warn('[Supabase] Insert failed (table may not exist yet):', error.message);
      else console.log('[Supabase] Session saved to cloud');
    });

    set({ currentSession: null, completedSessions: sessions });
  },

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

  loadFromSupabase: async () => {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.warn('[Supabase] Load failed:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const sessions: CompletedSession[] = data.map((row: Record<string, string>) => ({
        id: row.id ?? crypto.randomUUID(),
        type: row.session_type ?? 'unknown',
        data: { myAnswer: row.my_answer ?? '', insight: row.insight_text ?? '' },
        completedAt: row.completed_at ?? new Date().toISOString(),
      }));
      localStorage.setItem('careradar_sessions', JSON.stringify(sessions));
      set({ completedSessions: sessions });
      console.log(`[Supabase] Loaded ${sessions.length} sessions from cloud`);
    }
  },
}));
