import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initializes Sentry for React error boundary captures and performance tracking.
 * Gracefully no-ops in local development or if VITE_SENTRY_DSN is absent.
 */
export const initFrontendSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    });

    isInitialized = true;
    return true;
  } catch (error) {
    console.warn('[Sentry] Failed to initialize frontend Sentry:', error);
    return false;
  }
};

/**
 * Captures an error to Sentry if initialized.
 */
export const captureFrontendException = (error, errorInfo = {}) => {
  if (isInitialized) {
    Sentry.captureException(error, { extra: errorInfo });
  } else if (import.meta.env.DEV) {
    console.debug('[Sentry Simulation] Frontend error captured:', error, errorInfo);
  }
};

export { Sentry };
