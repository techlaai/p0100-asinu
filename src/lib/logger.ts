type LogContext = Record<string, unknown>;

export const logError = (error: unknown, context: LogContext = {}) => {
  // Ignore AbortError - it's expected when component unmounts or request is cancelled
  if (error instanceof Error && error.name === 'AbortError') {
    return;
  }
  if (__DEV__) {
    console.error('[logger]', context, error);
  }
  // hook for Sentry/Crashlytics in future
};

export const logWarn = (message: string, context: LogContext = {}) => {
  if (__DEV__) {
    console.warn('[logger]', message, context);
  }
};
