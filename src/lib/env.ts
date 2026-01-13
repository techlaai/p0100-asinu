export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://asinu.top',
  devBypassAuthRaw: process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1',
  disableChartsRaw: process.env.EXPO_PUBLIC_DISABLE_CHARTS === '1'
};
