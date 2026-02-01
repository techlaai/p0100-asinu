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
  title?: string;        // Backend now provides title
  description?: string;  // Backend now provides description
  status: 'active' | 'completed';
  progress: number;
  goal: number;
  updated_at: string;
  id?: string;          // Backend now provides unique id
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
    title: 'Điểm danh hàng ngày',
    description: 'Mở app và kiểm tra sức khỏe hàng ngày'
  },
  log_glucose: {
    title: 'Đo đường huyết',
    description: 'Đo và ghi lại chỉ số đường huyết 2 lần/ngày'
  },
  log_bp: {
    title: 'Đo huyết áp',
    description: 'Theo dõi huyết áp định kỳ 2 lần/ngày'
  },
  log_weight: {
    title: 'Cân nặng',
    description: 'Cân nặng và ghi lại 1 lần/ngày'
  },
  log_water: {
    title: 'Uống nước',
    description: 'Uống đủ nước, mục tiêu 4 ly/ngày'
  },
  log_meal: {
    title: 'Ghi chép bữa ăn',
    description: 'Ghi chép bữa ăn, mục tiêu 3 bữa/ngày'
  },
  log_insulin: {
    title: 'Ghi chép Insulin',
    description: 'Ghi chép liều insulin đã tiêm'
  },
  log_medication: {
    title: 'Ghi chép thuốc',
    description: 'Ghi chép thuốc đã uống'
  },
  connect_caregiver: {
    title: 'Kết nối người thân',
    description: 'Mời người thân vào Vòng kết nối'
  }
};

const mapMission = (mission: MissionRecord): Mission => {
  // Use backend-provided title/description, or fallback to local meta
  const meta = missionMeta[mission.mission_key] || { title: mission.mission_key };
  return {
    id: mission.id || mission.mission_key,  // Use backend id if available
    missionKey: mission.mission_key,
    title: mission.title || meta.title,     // Prefer backend title
    description: mission.description || meta.description,
    status: mission.status,
    progress: mission.progress,
    goal: mission.goal,
    updatedAt: mission.updated_at
  };
};

const fallbackMissions: Mission[] = [
  {
    id: 'log_glucose',
    missionKey: 'log_glucose',
    title: 'Đo đường huyết',
    description: 'Đo và ghi lại chỉ số đường huyết 2 lần/ngày',
    status: 'active',
    progress: 0,
    goal: 2,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'log_bp',
    missionKey: 'log_bp',
    title: 'Đo huyết áp',
    description: 'Theo dõi huyết áp định kỳ 2 lần/ngày',
    status: 'active',
    progress: 0,
    goal: 2,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'log_water',
    missionKey: 'log_water',
    title: 'Uống nước',
    description: 'Uống đủ nước, mục tiêu 4 ly/ngày',
    status: 'active',
    progress: 0,
    goal: 4,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'log_meal',
    missionKey: 'log_meal',
    title: 'Ghi chép bữa ăn',
    description: 'Ghi chép bữa ăn, mục tiêu 3 bữa/ngày',
    status: 'active',
    progress: 0,
    goal: 3,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'daily_checkin',
    missionKey: 'daily_checkin',
    title: 'Điểm danh hàng ngày',
    description: 'Mở app và kiểm tra sức khỏe hàng ngày',
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
      console.log('[missions] Raw backend response:', missionRecords);
      const missions = missionRecords.map(mapMission);
      console.log('[missions] Mapped missions:', missions);
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
