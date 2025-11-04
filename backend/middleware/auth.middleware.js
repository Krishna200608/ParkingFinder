import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// This middleware function protects routes
export const protect = async (req, res, next) => {
  let token;

  // 1. Read the JWT from the http-only cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user by ID from the token's payload
      // We attach the user object to the request (req.user)
      // We exclude the password field ('-password')
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // 4. Call the next middleware
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

// Middleware to check for 'host' or 'admin' role
export const isHostOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'host' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized. Host or Admin role required.');
  }
};
