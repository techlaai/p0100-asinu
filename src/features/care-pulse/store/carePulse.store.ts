import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { submitPulse } from '../api/carePulse.api';
import { computeNext } from '../engine/carePulse.machine';
import { EngineEvent, EngineState, PulseStatus, TriggerSource, initialEngineState } from '../types';

type CarePulseStore = {
  engineState: EngineState;
  hydrated: boolean;
  setEngineState: (engineState: EngineState) => void;
  setHydrated: (value: boolean) => void;
  checkIn: (status: PulseStatus, subStatus: string | undefined, triggerSource: TriggerSource) => Promise<void>;
  recordPopupDismiss: () => void;
};

const applyEvent = (state: EngineState, event: EngineEvent) => {
  return computeNext(state, event, new Date());
};

export const useCarePulseStore = create<CarePulseStore>()(
  persist(
    (set, get) => ({
      engineState: initialEngineState,
      hydrated: false,
      setEngineState: (engineState) => set({ engineState }),
      setHydrated: (value) => set({ hydrated: value }),
      checkIn: async (status, subStatus, triggerSource) => {
        const previous = get().engineState;
        const nextState = applyEvent(previous, { type: 'CHECK_IN', status, subStatus, triggerSource });
        set({ engineState: nextState });
        try {
          await submitPulse({
            status,
            subStatus,
            triggerSource,
            escalationSent: false,
            silenceCount: previous.silenceCount
          });
          console.log('[care-pulse] submitPulse success', status);
        } catch (error) {
          console.error('[care-pulse] submitPulse failed', error);
        }
      },
      recordPopupDismiss: () => {
        const nextState = applyEvent(get().engineState, { type: 'POPUP_DISMISSED' });
        set({ engineState: nextState });
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
