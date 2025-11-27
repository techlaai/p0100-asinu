import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { TextInput } from '../../src/components/TextInput';
import { Button } from '../../src/components/Button';
import { spacing, colors } from '../../src/styles';
import { useLogsStore } from '../../src/features/logs/logs.store';

export default function MedicationLogScreen() {
  const [medication, setMedication] = useState('Insulin');
  const [dose, setDose] = useState('5u');
  const [notes, setNotes] = useState('');
  const createMedication = useLogsStore((state) => state.createMedication);

  const handleSubmit = async () => {
    await createMedication({ medication, dose, notes });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Thuốc / Insulin" subtitle="Ghi nhanh" />
      <TextInput label="Thuốc" value={medication} onChangeText={setMedication} />
      <TextInput label="Liều" value={dose} onChangeText={setDose} />
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
