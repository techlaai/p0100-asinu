import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { ListItem } from '../../src/components/ListItem';
import { spacing } from '../../src/styles';

export default function LogsIndexScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Ghi log" subtitle="Chọn loại" />
      <ListItem title="Đường huyết" onPress={() => router.push('/logs/glucose')} />
      <ListItem title="Huyết áp" onPress={() => router.push('/logs/blood-pressure')} style={{ marginTop: spacing.md }} />
      <ListItem title="Thuốc/Insulin" onPress={() => router.push('/logs/medication')} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md
  }
});
