import { z } from 'zod';

/**
 * Zod schema validating required and optional environment variables at process startup.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required to sign authentication tokens'),
  MONGO_URI: z.string().min(1, 'MONGO_URI connection string is required').optional(),
});

/**
 * Validates process.env against the startup schema.
 * Throws in production if critical variables are missing; warns with details in development.
 */
export const validateEnv = () => {
  // Normalize MONGODB_URI if user configured MONGODB_URI instead of MONGO_URI
  if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
    process.env.MONGO_URI = process.env.MONGODB_URI;
  }

  // In non-production test/dev environments, assign standard development fallback
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
    process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    console.error(`[Environment Error] Startup configuration check failed: ${formatted}`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Fatal startup configuration error: ${formatted}`);
    }
  }
};

