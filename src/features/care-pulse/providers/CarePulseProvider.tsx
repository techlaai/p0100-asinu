import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { PulsePopup } from '../components/PulsePopup';
import { useCarePulseStore } from '../store/carePulse.store';
import { EngineState } from '../types';

type CarePulseContextValue = {
  openPulsePopup: () => void;
};

const CarePulseContext = createContext<CarePulseContextValue>({ openPulsePopup: () => undefined });

export const useCarePulse = () => useContext(CarePulseContext);

type Props = {
  children: ReactNode;
};

const shouldOpenPopupFromState = (state: EngineState, now: Date) => {
  if (!state.nextAskAt) return false;
  const nextAsk = new Date(state.nextAskAt);
  if (now < nextAsk) return false;
  if (state.cooldownUntil) {
    const cooldown = new Date(state.cooldownUntil);
    if (now < cooldown) return false;
  }
  return true;
};

export const CarePulseProvider = ({ children }: Props) => {
  const engineState = useCarePulseStore((state) => state.engineState);
  const hydrated = useCarePulseStore((state) => state.hydrated);
  const recordPopupShown = useCarePulseStore((state) => state.recordPopupShown);
  const sendAppOpened = useCarePulseStore((state) => state.sendAppOpened);
  const syncState = useCarePulseStore((state) => state.syncState);
  const [popupVisible, setPopupVisible] = useState(false);
  const engineStateRef = useRef(engineState);
  const popupVisibleRef = useRef(popupVisible);

  useEffect(() => {
    engineStateRef.current = engineState;
  }, [engineState]);

  useEffect(() => {
    popupVisibleRef.current = popupVisible;
  }, [popupVisible]);

  const openPulsePopup = useCallback(() => {
    if (popupVisibleRef.current) return;
    recordPopupShown();
    setPopupVisible(true);
  }, [recordPopupShown]);

  const runScheduler = useCallback(async () => {
    if (!hydrated) return;
    try {
      await sendAppOpened();
    } catch {
      // ignore
    }
    try {
      await syncState();
    } catch {
      // ignore
    }

    const now = new Date();
    const latestState = engineStateRef.current;
    const shouldShow = shouldOpenPopupFromState(latestState, now);
    if (shouldShow && !popupVisibleRef.current) {
      openPulsePopup();
    }
  }, [hydrated, openPulsePopup, sendAppOpened, syncState]);

  useEffect(() => {
    runScheduler();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        runScheduler();
      }
    });
    return () => subscription.remove();
  }, [runScheduler]);

  return (
    <CarePulseContext.Provider value={{ openPulsePopup }}>
      {children}
      <PulsePopup visible={popupVisible} onClose={() => setPopupVisible(false)} />
    </CarePulseContext.Provider>
  );
};
