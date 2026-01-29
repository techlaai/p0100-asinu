/**
 * OAuth Service
 * Handles real OAuth authentication flows for Google, Apple, and Zalo
 */

import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple' | 'zalo';

export type OAuthResult = {
  type: 'success' | 'cancel' | 'error';
  token?: string;
  idToken?: string;
  profile?: {
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  };
  error?: string;
};

/**
 * Google OAuth Configuration
 */
const GOOGLE_CONFIG = {
  clientId: {
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
  },
  scopes: ['openid', 'profile', 'email'],
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

/**
 * Apple OAuth Configuration (iOS only)
 */
const APPLE_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.asinu.app',
  scopes: ['email', 'name'],
  // Apple uses Sign In with Apple native module on iOS
};

/**
 * Zalo OAuth Configuration
 */
const ZALO_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ZALO_APP_ID || '',
  scopes: ['id', 'name', 'picture'],
  authorizationEndpoint: 'https://oauth.zaloapp.com/v4/permission',
  tokenEndpoint: 'https://oauth.zaloapp.com/v4/access_token',
  userInfoEndpoint: 'https://graph.zalo.me/v2.0/me'
};

/**
 * Get platform-specific Google Client ID
 */
function getGoogleClientId(): string {
  if (Platform.OS === 'ios') {
    return GOOGLE_CONFIG.clientId.ios;
  } else if (Platform.OS === 'android') {
    return GOOGLE_CONFIG.clientId.android;
  }
  return GOOGLE_CONFIG.clientId.web;
}

/**
 * Authenticate with Google
 */
export async function authenticateWithGoogle(): Promise<OAuthResult> {
  try {
    // Check if running in development mode with mock
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_OAUTH === 'true') {
      console.log('[oauth] Using mock Google authentication');
      return {
        type: 'success',
        token: 'mock-google-token',
        idToken: 'mock-google-id-token',
        profile: {
          email: `dev-${Date.now()}@gmail.com`,
          name: 'Dev User (Google)',
          sub: `google_dev_${Date.now()}`
        }
      };
    }

    const clientId = getGoogleClientId();
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Use expo-auth-session for cross-platform OAuth
    const { AuthSession } = require('expo-auth-session');
    const redirectUri = makeRedirectUri({
      scheme: 'asinu',
      path: 'auth/google'
    });

    const discovery = {
      authorizationEndpoint: GOOGLE_CONFIG.authorizationEndpoint,
      tokenEndpoint: GOOGLE_CONFIG.tokenEndpoint,
      revocationEndpoint: GOOGLE_CONFIG.revocationEndpoint
    };

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
      {
        clientId,
        scopes: GOOGLE_CONFIG.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false
      },
      discovery
    );

    if (!request) {
      throw new Error('Failed to create Google auth request');
    }

    const result = await promptAsync();

    if (result.type === 'success') {
      const { access_token, id_token } = result.params;

      // Fetch user profile
      const profileResponse = await fetch(GOOGLE_CONFIG.userInfoEndpoint, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const profile = await profileResponse.json();

      return {
        type: 'success',
        token: access_token,
        idToken: id_token,
        profile: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          sub: profile.id
        }
      };
    }

    if (result.type === 'cancel') {
      return { type: 'cancel' };
    }

    return { type: 'error', error: 'Authentication failed' };
  } catch (error) {
    console.error('[oauth] Google authentication error:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Authenticate with Apple (iOS only)
 */
export async function authenticateWithApple(): Promise<OAuthResult> {
  try {
    // Check platform
    if (Platform.OS !== 'ios') {
      return {
        type: 'error',
        error: 'Apple Sign In is only available on iOS'
      };
    }

    // Check if running in development mode with mock
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_OAUTH === 'true') {
      console.log('[oauth] Using mock Apple authentication');
      return {
        type: 'success',
        token: 'mock-apple-token',
        idToken: 'mock-apple-id-token',
        profile: {
          email: `dev-${Date.now()}@privaterelay.appleid.com`,
          name: 'Dev User (Apple)',
          sub: `apple_dev_${Date.now()}`
        }
      };
    }

    // Use native Apple Sign In
    const AppleAuthentication = require('expo-apple-authentication');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    });

    return {
      type: 'success',
      token: credential.identityToken || 'apple-auth-token',
      idToken: credential.identityToken,
      profile: {
        email: credential.email || undefined,
        name: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : undefined,
        sub: credential.user
      }
    };
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      return { type: 'cancel' };
    }

    console.error('[oauth] Apple authentication error:', error);
    return {
      type: 'error',
      error: error.message || 'Apple authentication failed'
    };
  }
}

/**
 * Authenticate with Zalo
 */
export async function authenticateWithZalo(): Promise<OAuthResult> {
  try {
    // Check if running in development mode with mock
    if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_OAUTH === 'true') {
      console.log('[oauth] Using mock Zalo authentication');
      return {
        type: 'success',
        token: 'mock-zalo-token',
        profile: {
          email: `dev-${Date.now()}@zalo.me`,
          name: 'Dev User (Zalo)',
          sub: `zalo_dev_${Date.now()}`
        }
      };
    }

    const appId = ZALO_CONFIG.appId;
    if (!appId) {
      throw new Error('Zalo App ID not configured');
    }

    // Use expo-auth-session for Zalo OAuth
    const { AuthSession } = require('expo-auth-session');
    const redirectUri = makeRedirectUri({
      scheme: 'asinu',
      path: 'auth/zalo'
    });

    const discovery = {
      authorizationEndpoint: ZALO_CONFIG.authorizationEndpoint,
      tokenEndpoint: ZALO_CONFIG.tokenEndpoint
    };

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
      {
        clientId: appId,
        scopes: ZALO_CONFIG.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          app_id: appId,
          state: 'zalo_auth_state'
        }
      },
      discovery
    );

    if (!request) {
      throw new Error('Failed to create Zalo auth request');
    }

    const result = await promptAsync();

    if (result.type === 'success') {
      const { code } = result.params;

      // Exchange code for access token
      const tokenResponse = await fetch(ZALO_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          app_id: appId,
          code,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile
      const profileResponse = await fetch(
        `${ZALO_CONFIG.userInfoEndpoint}?access_token=${accessToken}&fields=id,name,picture`
      );
      const profile = await profileResponse.json();

      return {
        type: 'success',
        token: accessToken,
        profile: {
          email: undefined, // Zalo doesn't always provide email
          name: profile.name,
          picture: profile.picture?.data?.url,
          sub: profile.id
        }
      };
    }

    if (result.type === 'cancel') {
      return { type: 'cancel' };
    }

    return { type: 'error', error: 'Zalo authentication failed' };
  } catch (error) {
    console.error('[oauth] Zalo authentication error:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Main OAuth authentication function
 */
export async function authenticateWithProvider(provider: OAuthProvider): Promise<OAuthResult> {
  console.log(`[oauth] Starting authentication with ${provider}`);

  switch (provider) {
    case 'google':
      return authenticateWithGoogle();
    case 'apple':
      return authenticateWithApple();
    case 'zalo':
      return authenticateWithZalo();
    default:
      return {
        type: 'error',
        error: `Unsupported provider: ${provider}`
      };
  }
}
