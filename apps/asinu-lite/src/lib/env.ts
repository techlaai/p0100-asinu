export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  devBypassAuth: process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1'
};
