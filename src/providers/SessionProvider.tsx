import { ReactNode, createContext, useContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '../features/auth/auth.store';

const SessionContext = createContext<{ ready: boolean }>({ ready: false });

export const useSession = () => useContext(SessionContext);

type Props = {
  children: ReactNode;
};

export const SessionProvider = ({ children }: Props) => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    console.log('[SessionProvider] useEffect triggered - hydrated:', hydrated, 'loading:', loading);
    // Only bootstrap after store is hydrated
    if (hydrated) {
      console.log('[SessionProvider] Calling bootstrap()');
      bootstrap();
    }
  }, [bootstrap, hydrated]);

  const value = useMemo(() => ({ ready: !loading && hydrated }), [loading, hydrated]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
