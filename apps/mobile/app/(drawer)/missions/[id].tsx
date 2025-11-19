import { useLocalSearchParams } from 'expo-router';
import { MissionDetailScreen } from '@/features/missions/screens/MissionDetailScreen';

export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <MissionDetailScreen missionId={id} />;
}
