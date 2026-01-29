import { create } from 'zustand';
import { featureFlags } from '../../lib/featureFlags';
import { tokenStore } from '../../lib/tokenStore';
import { authApi, LoginPayload, UpdateProfilePayload } from './auth.api';
import { buildBypassProfile } from './auth.dev-bypass';
import { authService, SocialProvider } from './auth.service';

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
  loginWithPhone: (phone: string) => Promise<void>;
  loginWithSocial: (provider: SocialProvider) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  token: null,
  loading: false,
  async bootstrap() {
    set({ loading: true, error: undefined });
    if (featureFlags.devBypassAuth) {
      // In DEV mode, load token from storage or use dev-bypass
      await tokenStore.loadToken();
      let token = tokenStore.getToken();
      if (!token) {
        // If no token in storage, set dev-bypass token
        await tokenStore.setToken('dev-bypass');
        token = 'dev-bypass';
      }
      set({ profile: buildBypassProfile(), token, loading: false });
      return;
    }

    await tokenStore.loadToken();
    const token = tokenStore.getToken();
    if (token) {
      try {
        const verified = await authApi.verify();
        const nextToken = verified.token || token;
        if (verified.token) {
          await tokenStore.setToken(nextToken);
        }
        const profile = verified.profile || (await authApi.fetchProfile());
        set({ profile, token: nextToken, loading: false });
        return;
      } catch (error) {
        console.warn('Verify failed, falling back to profile fetch', error);
      }

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
    if (__DEV__) {
      const fakeProfile = {
        id: 'dev-user',
        email: payload?.email ?? 'dev@demo.local',
        name: 'Developer Mode User'
      };

      await tokenStore.setToken('dev-bypass');

      set({
        profile: fakeProfile,
        token: 'dev-bypass',
        loading: false,
        error: undefined
      });

      try {
        const { router } = require('expo-router');
        router.replace('/(tabs)/home');
      } catch (err) {
        // Ignore navigation errors in DEV
      }

      return;
    }
    if (featureFlags.devBypassAuth) {
      const fakeProfile = buildBypassProfile();
      await tokenStore.setToken('dev-bypass');
      set({ profile: fakeProfile, token: 'dev-bypass', loading: false });
      return;
    }
    console.log('[auth.store] login payload:', payload);
    try {
      const response = await authApi.login(payload);
      const token = response.token || null;
      // Handle both profile and user response formats from backend
      let profile = response.profile;
      if (!profile && response.user) {
        profile = {
          id: String(response.user.id),
          name: response.user.email?.split('@')[0] || 'User',
          email: response.user.email
        };
      }
      if (!profile) {
        profile = await authApi.fetchProfile();
      }
      if (token) {
        await tokenStore.setToken(token);
      }
      set({ profile, token, loading: false });
    } catch (error) {
      console.log('[auth.store] login failed:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  async loginWithPhone(phone) {
    set({ loading: true, error: undefined });
    try {
      const response = await authService.submitPhoneAuth({ phone });
      const token = response.token || null;
      const profile = response.profile || null;
      if (token) {
        await tokenStore.setToken(token);
      }
      set({ profile, token, loading: false });
    } catch (error) {
      console.log('[auth.store] phone login failed:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  async loginWithSocial(provider) {
    set({ loading: true, error: undefined });
    try {
      const response = await authService.submitSocialAuth({
        provider,
        token: '',
        rawProfile: {}
      });
      const token = response.token || null;
      const profile = response.profile || null;
      if (token) {
        await tokenStore.setToken(token);
      }
      set({ profile, token, loading: false });
    } catch (error) {
      console.log('[auth.store] social login failed:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  async deleteAccount() {
    set({ loading: true, error: undefined });
    try {
      await authApi.deleteAccount();
      await tokenStore.clearToken();
      set({ profile: null, token: null, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  async updateProfile(payload) {
    set({ loading: true, error: undefined });
    try {
      const updatedProfile = await authApi.updateProfile(payload);
      set({ profile: updatedProfile, loading: false });
    } catch (error) {
      // Update locally if API fails (for demo mode)
      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: {
            ...currentProfile,
            name: payload.name ?? currentProfile.name,
            phone: payload.phone ?? currentProfile.phone
          },
          loading: false
        });
      } else {
        set({ loading: false, error: (error as Error).message });
        throw error;
      }
    }
  },
  async logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('logout failed but continuing', error);
    }
    await tokenStore.clearToken();
    set({ profile: null, token: null });
  }
}));
