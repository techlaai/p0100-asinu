import { apiClient } from '../../lib/apiClient';
import { Profile } from './auth.store';

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
};

export type LoginResponse = {
  ok: boolean;
  token?: string;
  user?: { id: number; email: string };
  profile?: Profile;
};

export type VerifyResponse = {
  ok: boolean;
  token?: string;
  profile?: Profile;
};

export type ProfileResponse = {
  ok: boolean;
  profile: Profile;
};

export const authApi = {
  login(payload: LoginPayload) {
    return apiClient<LoginResponse>('/api/auth/email/login', { method: 'POST', body: payload });
  },
  register(payload: LoginPayload) {
    return apiClient<LoginResponse>('/api/auth/email/register', { method: 'POST', body: payload });
  },
  verify() {
    return apiClient<VerifyResponse>('/api/auth/verify', {
      method: 'POST',
      body: {}
    });
  },
  fetchProfile() {
    console.log('[authApi] fetchProfile - calling /api/mobile/profile');
    return apiClient<ProfileResponse>('/api/mobile/profile').then(res => {
      console.log('[authApi] fetchProfile response:', res);
      console.log('[authApi] fetchProfile profile object:', res.profile);
      console.log('[authApi] fetchProfile profile.name:', res.profile?.name);
      return res.profile;
    });
  },
  updateProfile(payload: UpdateProfilePayload) {
    return apiClient<ProfileResponse>('/api/mobile/profile', { method: 'PUT', body: payload }).then(res => res.profile);
  },
  logout() {
    return apiClient<{ ok: boolean; message: string }>('/api/mobile/auth/logout', { method: 'POST' });
  },
  deleteAccount() {
    return apiClient<{ ok: boolean; message: string }>('/api/auth/me', { method: 'DELETE' });
  }
};
