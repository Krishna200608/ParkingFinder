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
      const token = generateToken(res, user._id);

      // 5. Send clean response with bearer token fallback
      return res.status(201).json({
        message: 'Account created successfully',
        token,
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
      const token = generateToken(res, user._id);

      return res.status(200).json({
        message: 'Logged in successfully',
        token,
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
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      vehicleInfo: user.vehicleInfo || { make: '', model: '', licensePlate: '' },
      favorites: user.favorites || [],
    });
  }

  return res.status(404).json({ message: 'User not found' });
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, phone, avatarUrl, vehicleInfo } = req.body;

    if (username && username.trim() !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.trim();
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (vehicleInfo) {
      user.vehicleInfo = {
        make: (vehicleInfo.make ?? user.vehicleInfo?.make ?? '').trim(),
        model: (vehicleInfo.model ?? user.vehicleInfo?.model ?? '').trim(),
        licensePlate: (vehicleInfo.licensePlate ?? user.vehicleInfo?.licensePlate ?? '').trim(),
      };
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        vehicleInfo: updatedUser.vehicleInfo,
        favorites: updatedUser.favorites,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
};

// @desc    Get user favorite parking spots
// @route   GET /api/auth/favorites
// @access  Private
export const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    return res.status(200).json(user?.favorites || []);
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ message: 'Failed to retrieve favorites' });
  }
};

// @desc    Add a spot to user favorites
// @route   POST /api/auth/favorites/:spotId
// @access  Private
export const addFavoriteSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: spotId } },
      { new: true }
    ).select('favorites');

    return res.status(200).json({
      message: 'Spot added to favorites',
      favorites: user?.favorites || [],
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ message: 'Failed to add favorite' });
  }
};

// @desc    Remove a spot from user favorites
// @route   DELETE /api/auth/favorites/:spotId
// @access  Private
export const removeFavoriteSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: spotId } },
      { new: true }
    ).select('favorites');

    return res.status(200).json({
      message: 'Spot removed from favorites',
      favorites: user?.favorites || [],
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ message: 'Failed to remove favorite' });
  }
};

// @desc    Switch user role between driver and host
// @route   POST /api/auth/switch-role
// @access  Private (requires valid session cookie or Bearer token)
export const switchUserRole = async (req, res) => {
  try {
    // req.user is guaranteed by the allowSessionOrUser middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role is validated upstream by switchRoleSchema — only 'driver' | 'host' allowed
    const { role } = req.body;

    user.role = role;
    await user.save();

    // Re-issue fresh JWT cookie with updated role claim
    const token = generateToken(res, user._id);

    return res.status(200).json({
      message: `Account role updated to ${role === 'host' ? 'Host' : 'Driver'} successfully.`,
      token,
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
