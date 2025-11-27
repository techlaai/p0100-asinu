import { apiClient } from '../../lib/apiClient';
import { LogEntry } from './logs.store';

type BaseLogPayload = {
  tags?: string[];
  notes?: string;
  recordedAt?: string;
};

export type GlucoseLogPayload = BaseLogPayload & {
  value: number;
};

export type BloodPressureLogPayload = BaseLogPayload & {
  systolic: number;
  diastolic: number;
};

export type MedicationLogPayload = BaseLogPayload & {
  medication: string;
  dose: string;
};

export const logsApi = {
  fetchRecent() {
    return apiClient<LogEntry[]>('/api/mobile/logs');
  },
  createGlucose(payload: GlucoseLogPayload) {
    return apiClient<LogEntry>('/api/mobile/logs/glucose', { method: 'POST', body: payload });
  },
  createBloodPressure(payload: BloodPressureLogPayload) {
    return apiClient<LogEntry>('/api/mobile/logs/blood-pressure', { method: 'POST', body: payload });
  },
  createMedication(payload: MedicationLogPayload) {
    return apiClient<LogEntry>('/api/mobile/logs/medication', { method: 'POST', body: payload });
  }
};
