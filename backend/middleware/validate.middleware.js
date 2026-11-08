import { z } from 'zod';

/**
 * Express middleware factory to validate incoming requests against Zod schemas.
 *
 * @param {z.ZodSchema} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const validatedData = schema.parse(req[source]);
    req[source] = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        message: formattedErrors[0]?.message || 'Validation failed',
        errors: formattedErrors,
      });
    }
    return res.status(400).json({ message: 'Invalid request data' });
  }
};

// Common validation schemas
export const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  role: z
    .enum(['driver', 'host'], {
      errorMap: () => ({ message: "Role must be either 'driver' or 'host'" }),
    })
    .optional()
    .default('driver'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Validates the body of POST /api/auth/switch-role.
 * Strictly restricts the target role to 'driver' or 'host'.
 * Switching to 'admin' via this endpoint is intentionally disallowed.
 */
export const switchRoleSchema = z.object({
  role: z.enum(['driver', 'host'], {
    errorMap: () => ({ message: "Role must be either 'driver' or 'host'" }),
  }),
});
