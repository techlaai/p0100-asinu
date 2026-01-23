import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { PulsePopup } from '../components/PulsePopup';
import { computeNext } from '../engine/carePulse.machine';
import { shouldShowPopup } from '../engine/carePulse.scheduler';
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

const isSameState = (a: EngineState, b: EngineState) =>
  a.currentStatus === b.currentStatus &&
  a.lastCheckInAt === b.lastCheckInAt &&
  a.cooldownUntil === b.cooldownUntil &&
  a.nextAskAt === b.nextAskAt &&
  a.silenceCount === b.silenceCount &&
  a.emergencyArmed === b.emergencyArmed &&
  a.emergencyLastAskAt === b.emergencyLastAskAt &&
  a.lastTriggerSource === b.lastTriggerSource &&
  a.escalationNeeded === b.escalationNeeded;

export const CarePulseProvider = ({ children }: Props) => {
  const engineState = useCarePulseStore((state) => state.engineState);
  const hydrated = useCarePulseStore((state) => state.hydrated);
  const setEngineState = useCarePulseStore((state) => state.setEngineState);
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
    const now = new Date();
    const nextState = computeNext(engineStateRef.current, { type: 'POPUP_SHOWN' }, now);
    if (!isSameState(engineStateRef.current, nextState)) {
      engineStateRef.current = nextState;
      setEngineState(nextState);
    }
    setPopupVisible(true);
  }, [setEngineState]);

  const runScheduler = useCallback(() => {
    if (!hydrated) return;
    const now = new Date();
    const nextState = computeNext(engineStateRef.current, { type: 'APP_OPENED' }, now);
    if (!isSameState(engineStateRef.current, nextState)) {
      engineStateRef.current = nextState;
      setEngineState(nextState);
    }

    const shouldShow = shouldShowPopup(nextState, now, { isAppForeground: true, routeName: '' });
    if (shouldShow && !popupVisibleRef.current) {
      console.log('[care-pulse] shouldShowPopup true');
      openPulsePopup();
    }
  }, [hydrated, openPulsePopup, setEngineState]);

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
