import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. Check if user already exists by email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} is already in use` });
    }

    // 2. Enforce strict role whitelisting (prevent unauthorized admin escalation)
    const allowedRoles = ['driver', 'host'];
    const assignedRole = allowedRoles.includes(role) ? role : 'driver';

    // 3. Create new user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
    });

    if (user) {
      // 4. Set secure HTTP-only session cookie
      generateToken(res, user._id);

      // 5. Send clean response
      return res.status(201).json({
        message: 'Account created successfully',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }

    return res.status(400).json({ message: 'Invalid user registration data' });
  } catch (error) {
    console.error('Registration controller error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// @desc    Authenticate user (login) & set session cookie
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // 2. Validate password
    if (user && (await user.matchPassword(password))) {
      // 3. Set secure HTTP-only session cookie
      generateToken(res, user._id);

      return res.status(200).json({
        message: 'Logged in successfully',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

// @desc    Logout user / clear session cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return res.status(200).json({ message: 'User logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = req.user;

  if (user) {
    return res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  }

  return res.status(404).json({ message: 'User not found' });
};

// @desc    Switch user role between driver and host
// @route   POST /api/auth/switch-role
// @access  Private
export const switchUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role } = req.body;
    const targetRole = role === 'driver' ? 'driver' : 'host';

    user.role = targetRole;
    await user.save();

    return res.status(200).json({
      message: `Account role updated to ${targetRole === 'host' ? 'Host' : 'Driver'} successfully.`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Switch role error:', error);
    return res.status(500).json({ message: 'Failed to switch user role' });
  }
};
