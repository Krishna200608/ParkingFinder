import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';

// --- Helper function for handling errors ---
const handleError = (res, statusCode, message) => {
  res.status(statusCode).json({ message });
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
      return handleError(res, 400, 'User already exists');
    }

    // 2. Create new user
    // Password hashing is handled by the middleware in user.model.js
    const user = await User.create({
      username,
      email,
      password,
      role, // 'driver' or 'host'
    });

    if (user) {
      // 3. Generate token and send cookie
      generateToken(res, user._id);

      // 4. Send response
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
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

    // 2. Check if user exists and password matches
    // We created the 'matchPassword' method in user.model.js
    if (user && (await user.matchPassword(password))) {
      // 3. Generate token and send cookie
      generateToken(res, user._id);

      // 4. Send response
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
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
// @access  Private (must be logged in)
export const logoutUser = (req, res) => {
  // We clear the cookie by setting it to an empty string and expiring it
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
  // The 'protect' middleware (which we will add to the route)
  // will add the user object to req.user
  
  // req.user is available because of the 'protect' middleware
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
