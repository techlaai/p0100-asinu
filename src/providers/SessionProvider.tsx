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

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const value = useMemo(() => ({ ready: !loading }), [loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
