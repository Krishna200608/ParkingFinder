import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT and attaches it to the response as an HTTP-only cookie.
 * Also returns the token string for API clients / testing.
 *
 * @param {import('express').Response} res
 * @param {string} userId
 * @returns {string} token
 */
const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Consistent 7-day session
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Compatible with standard browser navigation and same-site API calls
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });

  return token;
};

export default generateToken;
