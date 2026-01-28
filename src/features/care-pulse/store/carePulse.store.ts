import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchCarePulseState, sendCarePulseEvent } from '../api/carePulse.api';
import { EngineState, PulseStatus, TriggerSource, initialEngineState } from '../types';

type CarePulseStore = {
  engineState: EngineState;
  hydrated: boolean;
  popupSessionId: string | null;
  setEngineState: (engineState: EngineState) => void;
  setHydrated: (value: boolean) => void;
  syncState: () => Promise<void>;
  sendAppOpened: () => Promise<void>;
  recordPopupShown: () => Promise<void>;
  recordPopupDismiss: () => Promise<void>;
  checkIn: (status: PulseStatus, subStatus: string | undefined, triggerSource: TriggerSource) => Promise<void>;
};

const createSessionId = () => {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const resolveSource = (triggerSource: TriggerSource) => {
  if (triggerSource === 'POPUP') return 'scheduler';
  return 'manual';
};

export const useCarePulseStore = create<CarePulseStore>()(
  persist(
    (set, get) => ({
      engineState: initialEngineState,
      hydrated: false,
      popupSessionId: null,
      setEngineState: (engineState) => set({ engineState }),
      setHydrated: (value) => set({ hydrated: value }),
      syncState: async () => {
        const response = await fetchCarePulseState();
        if (response?.state) {
          set({ engineState: response.state });
        }
      },
      sendAppOpened: async () => {
        const response = await sendCarePulseEvent({
          eventType: 'APP_OPENED',
          source: 'system',
          uiSessionId: createSessionId()
        });
        if (response?.state) {
          set({ engineState: response.state });
        }
      },
      recordPopupShown: async () => {
        const sessionId = createSessionId();
        set({ popupSessionId: sessionId });
        const response = await sendCarePulseEvent({
          eventType: 'POPUP_SHOWN',
          source: 'scheduler',
          uiSessionId: sessionId
        });
        if (response?.state) {
          set({ engineState: response.state });
        }
      },
      recordPopupDismiss: async () => {
        const sessionId = get().popupSessionId || createSessionId();
        const response = await sendCarePulseEvent({
          eventType: 'POPUP_DISMISSED',
          source: 'scheduler',
          uiSessionId: sessionId
        });
        set({ popupSessionId: null });
        if (response?.state) {
          set({ engineState: response.state });
        }
      },
      checkIn: async (status, _subStatus, triggerSource) => {
        const sessionId = triggerSource === 'POPUP' ? get().popupSessionId || createSessionId() : createSessionId();
        const response = await sendCarePulseEvent({
          eventType: 'CHECK_IN',
          source: resolveSource(triggerSource),
          uiSessionId: sessionId,
          selfReport: status
        });
        set({ popupSessionId: null });
        if (response?.state) {
          set({ engineState: response.state });
        }
      }
    }),
    {
      name: 'care_pulse_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ engineState: state.engineState }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
