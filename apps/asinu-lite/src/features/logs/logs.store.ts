import { create } from 'zustand';
import { logsApi, GlucoseLogPayload, BloodPressureLogPayload, MedicationLogPayload } from './logs.api';

export type LogEntry = {
  id: string;
  type: 'glucose' | 'blood-pressure' | 'medication';
  value?: number;
  systolic?: number;
  diastolic?: number;
  medication?: string;
  dose?: string;
  tags?: string[];
  notes?: string;
  recordedAt: string;
};

type LogsState = {
  recent: LogEntry[];
  status: 'idle' | 'loading' | 'success' | 'error';
  fetchRecent: () => Promise<void>;
  createGlucose: (payload: GlucoseLogPayload) => Promise<LogEntry>;
  createBloodPressure: (payload: BloodPressureLogPayload) => Promise<LogEntry>;
  createMedication: (payload: MedicationLogPayload) => Promise<LogEntry>;
};

const fallbackRecent: LogEntry[] = [
  {
    id: 'log-1',
    type: 'glucose',
    value: 125,
    tags: ['Trước ăn'],
    recordedAt: new Date().toISOString()
  },
  {
    id: 'log-2',
    type: 'blood-pressure',
    systolic: 125,
    diastolic: 78,
    tags: ['Buổi sáng'],
    recordedAt: new Date().toISOString()
  }
];

export const useLogsStore = create<LogsState>((set, get) => ({
  recent: [],
  status: 'idle',
  async fetchRecent() {
    set({ status: 'loading' });
    try {
      const recent = await logsApi.fetchRecent();
      set({ recent, status: 'success' });
    } catch (error) {
      console.warn('Using fallback logs', error);
      set({ recent: fallbackRecent, status: 'error' });
    }
  },
  async createGlucose(payload) {
    const optimistic: LogEntry = {
      id: `glucose-${Date.now()}`,
      type: 'glucose',
      recordedAt: payload.recordedAt || new Date().toISOString(),
      value: payload.value,
      tags: payload.tags,
      notes: payload.notes
    };
    set({ recent: [optimistic, ...get().recent] });
    try {
      const saved = await logsApi.createGlucose(payload);
      set({ recent: [saved, ...get().recent] });
      return saved;
    } catch (error) {
      set({ recent: get().recent.filter((log) => log.id !== optimistic.id) });
      throw error;
    }
  },
  async createBloodPressure(payload) {
    const optimistic: LogEntry = {
      id: `bp-${Date.now()}`,
      type: 'blood-pressure',
      recordedAt: payload.recordedAt || new Date().toISOString(),
      systolic: payload.systolic,
      diastolic: payload.diastolic,
      tags: payload.tags,
      notes: payload.notes
    };
    set({ recent: [optimistic, ...get().recent] });
    try {
      const saved = await logsApi.createBloodPressure(payload);
      set({ recent: [saved, ...get().recent] });
      return saved;
    } catch (error) {
      set({ recent: get().recent.filter((log) => log.id !== optimistic.id) });
      throw error;
    }
  },
  async createMedication(payload) {
    const optimistic: LogEntry = {
      id: `med-${Date.now()}`,
      type: 'medication',
      recordedAt: payload.recordedAt || new Date().toISOString(),
      medication: payload.medication,
      dose: payload.dose,
      tags: payload.tags,
      notes: payload.notes
    };
    set({ recent: [optimistic, ...get().recent] });
    try {
      const saved = await logsApi.createMedication(payload);
      set({ recent: [saved, ...get().recent] });
      return saved;
    } catch (error) {
      set({ recent: get().recent.filter((log) => log.id !== optimistic.id) });
      throw error;
    }
  }
}));
