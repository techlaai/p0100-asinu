import { createContext, ReactNode, useContext } from 'react';
import { useMobileEndpoint } from '@/lib/api/mobileClient';

type MobileSessionResponse = {
  user: {
    user_id: string;
    display_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  featureFlags: MobileFeatureFlags;
  env?: Record<string, unknown>;
};

export type MobileFeatureFlags = {
  MISSIONS_ENABLED: boolean;
  TREE_ENABLED: boolean;
  REWARDS_ENABLED: boolean;
  DONATE_ENABLED: boolean;
  FAMILY_ENABLED: boolean;
  AI_CHAT_ENABLED: boolean;
  NOTIFICATIONS_ENABLED: boolean;
};

const DEFAULT_FLAGS: MobileFeatureFlags = {
  MISSIONS_ENABLED: false,
  TREE_ENABLED: false,
  REWARDS_ENABLED: false,
  DONATE_ENABLED: false,
  FAMILY_ENABLED: false,
  AI_CHAT_ENABLED: false,
  NOTIFICATIONS_ENABLED: false
};

type MobileSessionContextValue = {
  session: MobileSessionResponse['user'];
  featureFlags: MobileFeatureFlags;
  env?: Record<string, unknown>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void> | void;
};

const MobileSessionContext = createContext<MobileSessionContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export const MobileSessionProvider = ({ children }: Props) => {
  const { data, loading, error, refresh } = useMobileEndpoint<MobileSessionResponse>('/api/mobile/session');

  return (
    <MobileSessionContext.Provider
      value={{
        session: data?.user ?? null,
        featureFlags: data?.featureFlags ?? DEFAULT_FLAGS,
        env: data?.env ?? undefined,
        loading,
        error,
        refresh
      }}
    >
      {children}
    </MobileSessionContext.Provider>
  );
};

export const useMobileSession = () => {
  const context = useContext(MobileSessionContext);
  if (!context) {
    throw new Error('useMobileSession must be used within MobileSessionProvider');
  }
  return context;
};
