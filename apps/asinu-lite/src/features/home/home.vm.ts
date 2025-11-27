import { useEffect, useMemo } from 'react';
import { useLogsStore } from '../logs/logs.store';
import { useMissionsStore } from '../missions/missions.store';
import { useTreeStore } from '../tree/tree.store';

export const useHomeViewModel = () => {
  const logs = useLogsStore((state) => state.recent);
  const fetchLogs = useLogsStore((state) => state.fetchRecent);
  const missions = useMissionsStore((state) => state.missions);
  const fetchMissions = useMissionsStore((state) => state.fetchMissions);
  const treeSummary = useTreeStore((state) => state.summary);
  const fetchTree = useTreeStore((state) => state.fetchTree);

  useEffect(() => {
    fetchLogs();
    fetchMissions();
    fetchTree();
  }, [fetchLogs, fetchMissions, fetchTree]);

  const quickMetrics = useMemo(() => {
    const latestGlucose = logs.find((log) => log.type === 'glucose');
    const latestBloodPressure = logs.find((log) => log.type === 'blood-pressure');
    return {
      glucose: latestGlucose?.value ?? 118,
      bloodPressure: latestBloodPressure
        ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}`
        : '124/78'
    };
  }, [logs]);

  return {
    logs,
    missions: missions.slice(0, 3),
    treeSummary,
    quickMetrics
  };
};
