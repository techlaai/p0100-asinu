import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { TextInput } from '../../src/components/TextInput';
import { Button } from '../../src/components/Button';
import { spacing, colors } from '../../src/styles';
import { useLogsStore } from '../../src/features/logs/logs.store';

export default function GlucoseLogScreen() {
  const [value, setValue] = useState('');
  const [tags, setTags] = useState('Trước ăn');
  const [notes, setNotes] = useState('');
  const createGlucose = useLogsStore((state) => state.createGlucose);

  const handleSubmit = async () => {
    await createGlucose({ value: Number(value), tags: tags.split(',').map((t) => t.trim()), notes });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Đường huyết" subtitle="Ghi nhanh" />
      <TextInput label="Giá trị (mg/dL)" keyboardType="numeric" value={value} onChangeText={setValue} />
      <TextInput label="Tags" value={tags} onChangeText={setTags} placeholder="Trước ăn, Sau ăn" />
      <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
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
