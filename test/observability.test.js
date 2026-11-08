import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../backend/app.js';
import * as sentryUtils from '../backend/utils/sentry.js';

describe('Stage 9: Production Observability & Sentry Error Tracking Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Sentry Backend Initializer & Exception Capture', () => {
    it('gracefully operates in silent diagnostic mode when SENTRY_DSN is absent', () => {
      delete process.env.SENTRY_DSN;
      const result = sentryUtils.initSentry();
      expect(result).toBe(false);
      expect(sentryUtils.isSentryEnabled()).toBe(false);
    });

    it('safely captures exceptions without throwing even when Sentry is not active', () => {
      const testError = new Error('Database connection pool exhausted');
      expect(() => {
        sentryUtils.captureException(testError, {
          user: { id: 'usr_123', email: 'driver@test.com', role: 'driver' },
          tags: { environment: 'test', action: 'checkout' },
          extra: { spotId: 'spot_456', attempt: 3 },
        });
      }).not.toThrow();
    });

    it('handles null and string errors safely in captureException', () => {
      expect(() => {
        sentryUtils.captureException(null);
        sentryUtils.captureException('Direct string diagnostic message');
      }).not.toThrow();
    });
  });

  describe('Express Centralized Error Handling Integration', () => {
    it('captures unhandled server exceptions through centralized middleware and returns HTTP 500', async () => {
      const captureSpy = vi.spyOn(sentryUtils, 'captureException');

      const res = await request(app).get('/api/test-error');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Simulated unhandled runtime failure');
      expect(captureSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            path: '/api/test-error',
            method: 'GET',
          }),
        })
      );
    });

    it('health check endpoint continues to return HTTP 200 with diagnostics', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });
});
