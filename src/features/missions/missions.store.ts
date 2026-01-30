import { create } from 'zustand';
import { CACHE_KEYS } from '../../lib/cacheKeys';
import { featureFlags } from '../../lib/featureFlags';
import { localCache } from '../../lib/localCache';
import { logError } from '../../lib/logger';
import { missionsApi } from './missions.api';

export type Mission = {
  id: string;
  missionKey: string;
  title: string;
  description?: string;
  status: 'active' | 'completed';
  progress: number;
  goal: number;
  updatedAt: string;
};

export type MissionRecord = {
  mission_key: string;
  status: 'active' | 'completed';
  progress: number;
  goal: number;
  updated_at: string;
};

type ErrorState = 'none' | 'remote-failed' | 'no-data';

type MissionsState = {
  missions: Mission[];
  status: 'idle' | 'loading' | 'success' | 'error';
  isStale: boolean;
  errorState: ErrorState;
  fetchMissions: (signal?: AbortSignal) => Promise<void>;
};

const missionMeta: Record<string, { title: string; description?: string }> = {
  DAILY_CHECKIN: {
    title: 'Điểm danh Care Pulse',
    description: 'Check-in sức khỏe mỗi ngày'
  }
};

const mapMission = (mission: MissionRecord): Mission => {
  const meta = missionMeta[mission.mission_key] || { title: mission.mission_key };
  return {
    id: mission.mission_key,
    missionKey: mission.mission_key,
    title: meta.title,
    description: meta.description,
    status: mission.status,
    progress: mission.progress,
    goal: mission.goal,
    updatedAt: mission.updated_at
  };
};

const fallbackMissions: Mission[] = [
  {
    id: 'DAILY_CHECKIN',
    missionKey: 'DAILY_CHECKIN',
    title: 'Điểm danh Care Pulse',
    description: 'Check-in sức khỏe mỗi ngày',
    status: 'active',
    progress: 0,
    goal: 1,
    updatedAt: new Date().toISOString()
  }
];

export const useMissionsStore = create<MissionsState>((set) => ({
  missions: [],
  status: 'idle',
  isStale: false,
  errorState: 'none',
  async fetchMissions(signal) {
    if (featureFlags.devBypassAuth) {
      set({ missions: fallbackMissions, status: 'success', isStale: false, errorState: 'none' });
      return;
    }
    let usedCache = false;
    const cached = await localCache.getCached<Mission[]>(CACHE_KEYS.MISSIONS, '1');
    if (cached) {
      set({ missions: cached, status: 'success', isStale: true, errorState: 'none' });
      usedCache = true;
    } else {
      set({ status: 'loading', errorState: 'none', isStale: false });
    }
    try {
      const missionRecords = await missionsApi.fetchMissions({ signal });
      const missions = missionRecords.map(mapMission);
      set({ missions, status: 'success', isStale: false, errorState: 'none' });
      await localCache.setCached(CACHE_KEYS.MISSIONS, '1', missions);
    } catch (error) {
      // Ignore AbortError - it's expected when component unmounts
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't change state, just return silently
        return;
      }
      
      if (usedCache) {
        set({ status: 'success', isStale: true, errorState: 'remote-failed' });
      } else {
        set({ status: 'error', errorState: 'no-data', isStale: false, missions: [] });
      }
      logError(error, { store: 'missions', action: 'fetchMissions', usedCache });
    }
  }
}));
