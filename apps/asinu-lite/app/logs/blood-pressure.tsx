import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { TextInput } from '../../src/components/TextInput';
import { Button } from '../../src/components/Button';
import { spacing, colors } from '../../src/styles';
import { useLogsStore } from '../../src/features/logs/logs.store';

export default function BloodPressureLogScreen() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [tags, setTags] = useState('Sau tập');
  const createBloodPressure = useLogsStore((state) => state.createBloodPressure);

  const handleSubmit = async () => {
    await createBloodPressure({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      tags: tags.split(',').map((t) => t.trim())
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Huyết áp" subtitle="Ghi nhanh" />
      <TextInput label="Tâm thu" keyboardType="numeric" value={systolic} onChangeText={setSystolic} />
      <TextInput label="Tâm trương" keyboardType="numeric" value={diastolic} onChangeText={setDiastolic} />
      <TextInput label="Tags" value={tags} onChangeText={setTags} placeholder="Sau tập, Sáng" />
      <Button label="Lưu" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  }
});
