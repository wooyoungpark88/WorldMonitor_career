import { create } from 'zustand';

export interface KnowledgeItem {
  id: string;
  type: 'study_insight' | 'article_memo' | 'manual_note' | 'exclusion_note';
  title: string;
  content: string;
  tags: string[];
  sourceArticle?: { title: string; link: string; track: string };
  sourceSession?: { id: string; type: string };
  createdAt: string;
}

interface KnowledgeState {
  items: KnowledgeItem[];
  addItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'careradar_knowledge';

function load(): KnowledgeItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(items: KnowledgeItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  items: load(),

  addItem: (partial) => {
    const item: KnowledgeItem = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().items, item];
    persist(next);
    set({ items: next });
  },

  removeItem: (id) => {
    const next = get().items.filter((i) => i.id !== id);
    persist(next);
    set({ items: next });
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },
}));
