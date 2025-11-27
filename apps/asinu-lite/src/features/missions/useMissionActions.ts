import { useEffect } from 'react';
import { useMissionsStore } from './missions.store';

export const useMissionActions = () => {
  const missions = useMissionsStore((state) => state.missions);
  const status = useMissionsStore((state) => state.status);
  const fetchMissions = useMissionsStore((state) => state.fetchMissions);
  const toggleComplete = useMissionsStore((state) => state.toggleComplete);

  useEffect(() => {
    if (status === 'idle') {
      fetchMissions();
    }
  }, [status, fetchMissions]);

  return { missions, status, toggleComplete };
};
