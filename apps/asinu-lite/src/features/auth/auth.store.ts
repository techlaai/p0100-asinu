import { create } from 'zustand';
import { authApi, LoginPayload } from './auth.api';
import { storage } from '../../lib/storage';
import { env } from '../../lib/env';
import { buildBypassProfile } from './auth.dev-bypass';

export type Profile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
  avatarUrl?: string;
};

type AuthState = {
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  error?: string;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'asinu-lite:token';

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  token: null,
  loading: false,
  async bootstrap() {
    set({ loading: true, error: undefined });
    if (env.devBypassAuth) {
      set({ profile: buildBypassProfile(), loading: false });
      return;
    }

    const token = await storage.get<string>(TOKEN_KEY);
    if (token) {
      try {
        const profile = await authApi.fetchProfile();
        set({ profile, token, loading: false });
        return;
      } catch (error) {
        console.warn('Profile fetch failed', error);
      }
    }
    set({ loading: false, profile: null, token: null });
  },
  async login(payload) {
    set({ loading: true, error: undefined });
    try {
      const response = await authApi.login(payload);
      const token = response.token || null;
      const profile = response.profile || (await authApi.fetchProfile());
      if (token) {
        await storage.set(TOKEN_KEY, token);
      }
      set({ profile, token, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  async logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('logout failed but continuing', error);
    }
    await storage.remove(TOKEN_KEY);
    set({ profile: null, token: null });
  }
}));
