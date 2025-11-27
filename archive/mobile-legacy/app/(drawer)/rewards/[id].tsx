import { useLocalSearchParams } from 'expo-router';
import { RewardDetailScreen } from '@/features/rewards/screens/RewardDetailScreen';

export default function RewardDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <RewardDetailScreen rewardId={id} />;
}
