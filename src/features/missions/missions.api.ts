import { apiClient } from '../../lib/apiClient';
import { MissionRecord } from './missions.store';

type MissionsResponse = {
  ok: boolean;
  missions: MissionRecord[];
};

export const missionsApi = {
  async fetchMissions(options?: { signal?: AbortSignal }) {
    const response = await apiClient<MissionsResponse>('/api/mobile/missions', {
      retry: { attempts: 2, initialDelayMs: 500 },
      signal: options?.signal
    });
    if (!response.ok) {
      throw new Error('Failed to fetch missions');
    }
    return response.missions || [];
  }
};
