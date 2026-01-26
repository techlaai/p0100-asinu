import { apiClient } from '../../lib/apiClient';
import { Profile } from './auth.store';

export type SocialProvider = 'google' | 'apple' | 'zalo';

export type PhoneAuthPayload = {
  phone: string;
};

export type SocialAuthPayload = {
  provider: SocialProvider;
  token?: string;
  rawProfile?: Record<string, unknown>;
  phone?: string;
};

export type ZeroOtpResponse = {
  token?: string;
  profile?: Profile;
};

const createZeroOtpError = (message: string) =>
  Object.assign(new Error(message), {
    code: 'ZERO_OTP_UNAVAILABLE'
  });

export const authService = {
  async submitPhoneAuth(payload: PhoneAuthPayload): Promise<ZeroOtpResponse> {
    // TODO: Replace with backend endpoint when zero-OTP phone auth is available.
    try {
      return await apiClient<ZeroOtpResponse>('/api/mobile/auth/zero-otp/phone', {
        method: 'POST',
        body: payload
      });
    } catch (error) {
      return Promise.reject(createZeroOtpError('Zero-OTP phone auth endpoint is not available yet.'));
    }
  },
  async submitSocialAuth(payload: SocialAuthPayload): Promise<ZeroOtpResponse> {
    // TODO: Replace with backend endpoint when social zero-OTP auth is available.
    try {
      return await apiClient<ZeroOtpResponse>('/api/mobile/auth/zero-otp/social', {
        method: 'POST',
        body: payload
      });
    } catch (error) {
      return Promise.reject(createZeroOtpError('Zero-OTP social auth endpoint is not available yet.'));
    }
  }
};
