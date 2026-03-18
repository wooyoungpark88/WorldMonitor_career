import { create } from 'zustand';

export interface ArticleAnnotation {
  articleId: string;
  memo: string;
  isBookmarked: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticleState {
  annotations: Record<string, ArticleAnnotation>;
  setMemo: (articleId: string, memo: string) => void;
  toggleBookmark: (articleId: string) => void;
  setRating: (articleId: string, rating: number) => void;
  getAnnotation: (articleId: string) => ArticleAnnotation | undefined;
}

const STORAGE_KEY = 'careradar_annotations';

function loadAnnotations(): Record<string, ArticleAnnotation> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function persist(annotations: Record<string, ArticleAnnotation>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

function ensureAnnotation(
  annotations: Record<string, ArticleAnnotation>,
  articleId: string,
): ArticleAnnotation {
  if (annotations[articleId]) return annotations[articleId];
  return {
    articleId,
    memo: '',
    isBookmarked: false,
    rating: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  annotations: loadAnnotations(),

  setMemo: (articleId, memo) => {
    const prev = get().annotations;
    const ann = { ...ensureAnnotation(prev, articleId), memo, updatedAt: new Date().toISOString() };
    const next = { ...prev, [articleId]: ann };
    persist(next);
    set({ annotations: next });
  },

  toggleBookmark: (articleId) => {
    const prev = get().annotations;
    const existing = ensureAnnotation(prev, articleId);
    const ann = { ...existing, isBookmarked: !existing.isBookmarked, updatedAt: new Date().toISOString() };
    const next = { ...prev, [articleId]: ann };
    persist(next);
    set({ annotations: next });
  },

  setRating: (articleId, rating) => {
    const prev = get().annotations;
    const ann = { ...ensureAnnotation(prev, articleId), rating, updatedAt: new Date().toISOString() };
    const next = { ...prev, [articleId]: ann };
    persist(next);
    set({ annotations: next });
  },

  getAnnotation: (articleId) => get().annotations[articleId],
}));
