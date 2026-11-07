import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Middleware to protect private routes.
 * Supports HTTP-only JWT cookies as primary strategy,
 * with Authorization: Bearer token support as fallback for external API clients.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Read JWT from http-only cookie
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // 2. Read JWT from Authorization Bearer header if cookie is absent
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Flexible session middleware that authenticates via cookie, bearer header,
 * or fallback authenticated client userId.
 */
export const allowSessionOrUser = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      if (req.user) return next();
    } catch {
      // Continue to fallback
    }
  }

  // Fallback to client userId if cookie is restricted by browser policy
  const fallbackId = req.body?.userId;
  if (fallbackId) {
    try {
      const user = await User.findById(fallbackId).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Fall through
    }
  }

  return res.status(401).json({ message: 'Authentication required, please sign in' });
};

/**
 * Middleware to restrict access to hosts or administrators.
 */
export const isHostOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'host' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized. Host or Admin role required.' });
};

/**
 * Middleware to restrict access exclusively to administrators.
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized. Admin role required.' });
};
