import { apiClient } from '../../lib/apiClient';
import { LogEntry } from './logs.store';

// Frontend payload types (giữ nguyên format cũ)
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

export type WeightLogPayload = BaseLogPayload & {
  weight_kg: number;
  bodyfat_pct?: number;
};

export type WaterLogPayload = BaseLogPayload & {
  volume_ml: number;
};

export type MealLogPayload = BaseLogPayload & {
  title: string;
  macros?: string;
  kcal?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  photo_key?: string;
  meal_id?: string;
};

export type InsulinLogPayload = BaseLogPayload & {
  insulin_type: string;
  dose_units: number;
  timing?: string;
  meal_id?: string;
};

// Map Vietnamese tags to backend context
const tagToContext: Record<string, string> = {
  'Trước ăn': 'pre_meal',
  'Sau ăn': 'post_meal',
  'Đói': 'fasting',
  'Trước ngủ': 'before_sleep',
  'Ngẫu nhiên': 'random',
  'Buổi sáng': 'fasting',
  'Buổi tối': 'before_sleep'
};

type LogsResponse = {
  ok: boolean;
  logs: LogEntry[];
};

type CreateLogResponse = {
  ok: boolean;
  log_id: string;
  log_type: string;
};

// Transform frontend payload to backend format
const transformToBackendPayload = (logType: string, frontendPayload: BaseLogPayload & Record<string, any>) => {
  const now = new Date().toISOString();
  const context = frontendPayload.tags?.[0] ? tagToContext[frontendPayload.tags[0]] : undefined;
  
  let data: Record<string, any> = {};
  
  switch (logType) {
    case 'glucose':
      data = {
        value: frontendPayload.value,
        unit: 'mg/dL',
        context,
        meal_tag: frontendPayload.tags?.join(', ')
      };
      break;
    case 'bp':
      data = {
        systolic: frontendPayload.systolic,
        diastolic: frontendPayload.diastolic,
        unit: 'mmHg'
      };
      break;
    case 'weight':
      data = {
        weight_kg: frontendPayload.weight_kg,
        body_fat_percent: frontendPayload.bodyfat_pct
      };
      break;
    case 'water':
      data = {
        volume_ml: frontendPayload.volume_ml
      };
      break;
    case 'meal':
      data = {
        calories_kcal: frontendPayload.kcal,
        carbs_g: frontendPayload.carbs_g,
        protein_g: frontendPayload.protein_g,
        fat_g: frontendPayload.fat_g,
        meal_text: frontendPayload.title,
        photo_url: frontendPayload.photo_key
      };
      break;
    case 'insulin':
      data = {
        insulin_type: frontendPayload.insulin_type,
        dose_units: frontendPayload.dose_units,
        timing: frontendPayload.timing || context
      };
      break;
    case 'medication':
      data = {
        med_name: frontendPayload.medication,
        dose_text: frontendPayload.dose
      };
      break;
  }

  return {
    log_type: logType,
    occurred_at: frontendPayload.recordedAt || now,
    source: 'manual',
    note: frontendPayload.notes || null,
    metadata: {},
    data
  };
};

// Transform backend response to frontend format
const transformToFrontendLogs = (backendLogs: any[]): LogEntry[] => {
  return backendLogs.map(log => {
    const detail = log.detail || {};
    const baseEntry: LogEntry = {
      id: log.id,
      type: log.log_type === 'bp' ? 'blood-pressure' : log.log_type,
      recordedAt: log.occurred_at,
      notes: log.note,
      tags: log.metadata?.tags || []
    };

    switch (log.log_type) {
      case 'glucose':
        return { ...baseEntry, value: detail.value };
      case 'bp':
        return { ...baseEntry, systolic: detail.systolic, diastolic: detail.diastolic };
      case 'weight':
        return { ...baseEntry, weight_kg: detail.weight_kg, bodyfat_pct: detail.body_fat_percent };
      case 'water':
        return { ...baseEntry, volume_ml: detail.volume_ml };
      case 'meal':
        return { 
          ...baseEntry, 
          title: detail.meal_text, 
          kcal: detail.calories_kcal,
          carbs_g: detail.carbs_g,
          protein_g: detail.protein_g,
          fat_g: detail.fat_g,
          photo_key: detail.photo_url 
        };
      case 'insulin':
        return { 
          ...baseEntry, 
          insulin_type: detail.insulin_type, 
          dose_units: detail.dose_units,
          timing: detail.timing 
        };
      case 'medication':
        return { ...baseEntry, medication: detail.med_name, dose: detail.dose_text };
      default:
        return baseEntry;
    }
  });
};

export const logsApi = {
  async fetchRecent(options?: { signal?: AbortSignal }) {
    const response = await apiClient<LogsResponse>('/api/mobile/logs', {
      retry: { attempts: 2, initialDelayMs: 500 },
      signal: options?.signal
    });
    // Transform backend format to frontend format
    return transformToFrontendLogs(response.logs || []);
  },
  createGlucose(payload: GlucoseLogPayload) {
    const backendPayload = transformToBackendPayload('glucose', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createBloodPressure(payload: BloodPressureLogPayload) {
    const backendPayload = transformToBackendPayload('bp', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createMedication(payload: MedicationLogPayload) {
    const backendPayload = transformToBackendPayload('medication', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createWeight(payload: WeightLogPayload) {
    const backendPayload = transformToBackendPayload('weight', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createWater(payload: WaterLogPayload) {
    const backendPayload = transformToBackendPayload('water', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createMeal(payload: MealLogPayload) {
    const backendPayload = transformToBackendPayload('meal', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  },
  createInsulin(payload: InsulinLogPayload) {
    const backendPayload = transformToBackendPayload('insulin', payload);
    return apiClient<CreateLogResponse>('/api/mobile/logs', {
      method: 'POST',
      body: backendPayload
    });
  }
};
