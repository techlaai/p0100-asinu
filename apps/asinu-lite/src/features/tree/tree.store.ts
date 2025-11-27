import { create } from 'zustand';
import { treeApi } from './tree.api';

export type TreeSummary = {
  score: number;
  streakDays: number;
  completedThisWeek: number;
  totalMissions?: number;
};

export type TreeHistoryPoint = {
  label: string;
  value: number;
};

type TreeState = {
  summary: TreeSummary | null;
  history: TreeHistoryPoint[];
  status: 'idle' | 'loading' | 'success' | 'error';
  fetchTree: () => Promise<void>;
};

const fallbackSummary: TreeSummary = {
  score: 0.68,
  streakDays: 6,
  completedThisWeek: 9,
  totalMissions: 12
};

const fallbackHistory: TreeHistoryPoint[] = [
  { label: 'T2', value: 62 },
  { label: 'T3', value: 68 },
  { label: 'T4', value: 70 },
  { label: 'T5', value: 66 },
  { label: 'T6', value: 74 },
  { label: 'T7', value: 72 },
  { label: 'CN', value: 75 }
];

export const useTreeStore = create<TreeState>((set) => ({
  summary: null,
  history: [],
  status: 'idle',
  async fetchTree() {
    set({ status: 'loading' });
    try {
      const [summary, history] = await Promise.all([treeApi.fetchSummary(), treeApi.fetchHistory()]);
      set({ summary, history, status: 'success' });
    } catch (error) {
      console.warn('Using fallback tree data', error);
      set({ summary: fallbackSummary, history: fallbackHistory, status: 'error' });
    }
  }
}));
