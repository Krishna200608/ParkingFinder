import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';

// --- Helper function for handling errors ---
const handleError = (res, statusCode, message) => {
  res.status(statusCode).json({ message });
};

// --- Helper to generate a JWT (and still call generateToken to set cookie) ---
const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return handleError(res, 400, 'User already exists, use different email');
    }

    // 2. Create new user
    const user = await User.create({
      username,
      email,
      password,
      role, // 'driver' or 'host'
    });

    if (user) {
      // 3. Generate token (for both cookie and response)
      generateToken(res, user._id);
      const token = createToken(user._id);

      // 4. Send response with token + user info
      res.status(201).json({
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return handleError(res, 400, 'Invalid user data');
    }
  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Auth user (login) & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    // 2. Validate password
    if (user && (await user.matchPassword(password))) {
      // 3. Generate cookie + token
      generateToken(res, user._id);
      const token = createToken(user._id);

      // 4. Send full response
      res.status(200).json({
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return handleError(res, 401, 'Invalid email or password');
    }
  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'User logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = req.user;

  if (user) {
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    return handleError(res, 404, 'User not found');
  }
};
