import { create } from 'zustand';
import { missionsApi } from './missions.api';

export type Mission = {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  completed: boolean;
  points?: number;
  category?: string;
};

type MissionsState = {
  missions: Mission[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  fetchMissions: () => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
};

const fallbackMissions: Mission[] = [
  {
    id: 'mission-1',
    title: 'Nhắc bố đo đường huyết sáng nay',
    description: 'Trước ăn sáng, ghi log glucose',
    scheduledAt: new Date().toISOString(),
    completed: false,
    points: 10,
    category: 'glucose'
  },
  {
    id: 'mission-2',
    title: 'Đi bộ 15 phút',
    description: 'Cùng bố đi bộ nhẹ',
    scheduledAt: new Date().toISOString(),
    completed: false,
    points: 8,
    category: 'activity'
  },
  {
    id: 'mission-3',
    title: 'Uống thuốc huyết áp',
    description: 'Nhắc bố uống đúng giờ',
    scheduledAt: new Date().toISOString(),
    completed: true,
    points: 5,
    category: 'medication'
  }
];

export const useMissionsStore = create<MissionsState>((set, get) => ({
  missions: [],
  status: 'idle',
  async fetchMissions() {
    set({ status: 'loading', error: undefined });
    try {
      const missions = await missionsApi.fetchMissions();
      set({ missions, status: 'success' });
    } catch (error) {
      console.warn('Using fallback missions', error);
      set({ missions: fallbackMissions, status: 'error', error: (error as Error).message });
    }
  },
  async toggleComplete(id) {
    const previous = get().missions;
    const updated = previous.map((mission) => (mission.id === id ? { ...mission, completed: !mission.completed } : mission));
    set({ missions: updated });
    try {
      await missionsApi.completeMission(id);
    } catch (error) {
      console.warn('Mission complete failed, rolling back', error);
      set({ missions: previous });
      throw error;
    }
  }
}));
