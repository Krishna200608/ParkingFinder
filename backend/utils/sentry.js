import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

let isInitialized = false;

/**
 * Initializes Sentry for backend Node/Express error tracking and performance tracing.
 * Gracefully no-ops in local development or automated testing if SENTRY_DSN is not configured.
 */
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const isTest = process.env.NODE_ENV === 'test';

  if (!dsn || isTest) {
    if (!isTest) {
      logger.info('[Sentry] SENTRY_DSN not configured — operating in silent diagnostic mode.');
    }
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      integrations: [
        // Sentry v8+ automatically instruments HTTP & Express
      ],
    });

    isInitialized = true;
    logger.info('[Sentry] Production error tracking and tracing successfully initialized.');
    return true;
  } catch (error) {
    logger.warn(`[Sentry] Failed to initialize Sentry: ${error.message}`);
    return false;
  }
};

/**
 * Capture an error to Sentry with attached custom metadata.
 * Safe to invoke in any environment without throwing.
 */
export const captureException = (error, context = {}) => {
  if (isInitialized) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser({
          id: context.user._id || context.user.id,
          email: context.user.email,
          role: context.user.role,
        });
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      Sentry.captureException(error);
    });
  } else if (process.env.NODE_ENV !== 'test') {
    logger.debug('[Sentry Simulation] Exception captured:', {
      message: error?.message || error,
      context,
    });
  }
};

/**
 * Helper to determine if Sentry is active.
 */
export const isSentryEnabled = () => isInitialized;

export { Sentry };
