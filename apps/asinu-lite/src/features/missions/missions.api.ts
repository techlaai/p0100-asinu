import { apiClient } from '../../lib/apiClient';
import { Mission } from './missions.store';

export const missionsApi = {
  fetchMissions() {
    return apiClient<Mission[]>('/api/mobile/missions');
  },
  completeMission(id: string) {
    return apiClient<Mission>(`/api/mobile/missions/${id}/complete`, { method: 'POST' });
  }
};
