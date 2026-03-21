/**
 * Exclusion Knowledge Base — 비관련 기사 학습을 통한 크롤링 정밀도 개선
 *
 * 사용자가 "관련 없음"으로 표시한 기사를 저장하고,
 * 이후 크롤링에서 유사한 기사를 자동으로 필터링합니다.
 */
import { create } from 'zustand';

export interface ExcludedArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  track: string;
  reason: string;         // 사용자가 입력한 제외 사유 (optional)
  excludedAt: string;
  // Learning data - extracted from title for similarity matching
  titleWords: string[];   // normalized words for matching
}

interface ExclusionState {
  excluded: ExcludedArticle[];

  // Add article to exclusion list
  addExclusion: (article: {
    title: string;
    link: string;
    source: string;
    track: string;
    reason?: string;
  }) => void;

  // Remove from exclusion list (if user changes mind)
  removeExclusion: (id: string) => void;

  // Check if an article is similar to any excluded article
  isSimilarToExcluded: (title: string) => boolean;

  // Get the similarity score against excluded articles (0-1)
  getExclusionScore: (title: string) => number;

  // Get all excluded articles
  getAll: () => ExcludedArticle[];

  // Clear all
  clearAll: () => void;

  // Export as text for review
  exportSummary: () => string;
}

const STORAGE_KEY = 'careradar_exclusions';
const SIMILARITY_THRESHOLD = 0.4; // 40% word overlap = similar to excluded

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function wordOverlap(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const setB = new Set(wordsB);
  let intersection = 0;
  for (const w of wordsA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

function load(): ExcludedArticle[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(items: ExcludedArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded — ignore */ }
}

export const useExclusionStore = create<ExclusionState>((set, get) => ({
  excluded: load(),

  addExclusion: (article) => {
    const titleWords = normalize(article.title);
    const item: ExcludedArticle = {
      id: crypto.randomUUID(),
      title: article.title,
      link: article.link,
      source: article.source,
      track: article.track,
      reason: article.reason || '',
      excludedAt: new Date().toISOString(),
      titleWords,
    };

    // Avoid exact duplicates
    const existing = get().excluded;
    if (existing.some(e => e.link === article.link)) return;

    const next = [...existing, item];
    persist(next);
    set({ excluded: next });
  },

  removeExclusion: (id) => {
    const next = get().excluded.filter(e => e.id !== id);
    persist(next);
    set({ excluded: next });
  },

  isSimilarToExcluded: (title) => {
    return get().getExclusionScore(title) >= SIMILARITY_THRESHOLD;
  },

  getExclusionScore: (title) => {
    const words = normalize(title);
    const excluded = get().excluded;
    if (excluded.length === 0 || words.length === 0) return 0;

    let maxSim = 0;
    for (const ex of excluded) {
      const sim = wordOverlap(words, ex.titleWords);
      if (sim > maxSim) maxSim = sim;
    }
    return maxSim;
  },

  getAll: () => get().excluded,

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ excluded: [] });
  },

  exportSummary: () => {
    const items = get().excluded;
    if (items.length === 0) return '제외된 기사가 없습니다.';

    return items.map((e, i) =>
      `${i + 1}. [${e.track}] ${e.title}\n   사유: ${e.reason || '(미입력)'}\n   출처: ${e.source}`
    ).join('\n\n');
  },
}));

/**
 * Standalone function for use outside React (e.g., in keywordFilter)
 * Reads directly from localStorage without Zustand
 */
export function isExcludedByKB(title: string): boolean {
  try {
    const stored: ExcludedArticle[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (stored.length === 0) return false;

    const words = normalize(title);
    if (words.length === 0) return false;

    for (const ex of stored) {
      const sim = wordOverlap(words, ex.titleWords || normalize(ex.title));
      if (sim >= SIMILARITY_THRESHOLD) return true;
    }
    return false;
  } catch {
    return false;
  }
}
