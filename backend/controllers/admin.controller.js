import User from '../models/user.model.js';
import ParkingSpot from '../models/parkingSpot.model.js';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import { logger } from '../utils/logger.js';

/**
 * Platform Analytics & Executive Metrics Aggregation
 * Computes high-level platform health, financial volume, and inventory utilization.
 * @route GET /api/admin/metrics
 * @access Private/Admin
 */
export const getPlatformMetrics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallelized MongoDB Aggregations
    const [
      userStats,
      spotStats,
      bookingStats,
      paymentStats,
      recentPayments,
      recentBookings,
    ] = await Promise.all([
      // 1. User Metrics
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Parking Spot Inventory Metrics
      ParkingSpot.aggregate([
        {
          $group: {
            _id: null,
            totalSpots: { $sum: 1 },
            activeSpots: {
              $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] },
            },
            inactiveSpots: {
              $sum: { $cond: [{ $eq: ['$isAvailable', false] }, 1, 0] },
            },
            avgPricePerHour: { $avg: '$pricePerHour' },
            p2pSpots: {
              $sum: { $cond: [{ $eq: ['$spotType', 'p2p'] }, 1, 0] },
            },
            operatorSpots: {
              $sum: { $cond: [{ $eq: ['$spotType', 'operator'] }, 1, 0] },
            },
          },
        },
      ]),

      // 3. Booking Volume & Status Breakdown
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalCost' },
            totalHours: { $sum: '$durationHours' },
          },
        },
      ]),

      // 4. Financial & Payment Ledger Metrics
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 5. Recent 10 Transactions
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .populate({
          path: 'booking',
          select: 'startTime endTime totalCost status spot',
          populate: { path: 'spot', select: 'title address' },
        })
        .lean(),

      // 6. Recent 5 Bookings
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username email')
        .populate('host', 'username email')
        .populate('spot', 'title address pricePerHour')
        .lean(),
    ]);

    // Format User Metrics
    let totalUsers = 0;
    const roleBreakdown = { driver: 0, host: 0, admin: 0 };
    userStats.forEach((stat) => {
      totalUsers += stat.count;
      if (roleBreakdown[stat._id] !== undefined) {
        roleBreakdown[stat._id] = stat.count;
      }
    });

    // Format Spot Metrics
    const spotSummary = spotStats[0] || {
      totalSpots: 0,
      activeSpots: 0,
      inactiveSpots: 0,
      avgPricePerHour: 0,
      p2pSpots: 0,
      operatorSpots: 0,
    };

    // Format Booking Metrics
    let totalBookings = 0;
    let totalGrossVolume = 0;
    let totalBookedHours = 0;
    const bookingStatusMap = {
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      rejected: 0,
      expired: 0,
    };

    bookingStats.forEach((stat) => {
      totalBookings += stat.count;
      totalBookedHours += stat.totalHours || 0;
      if (bookingStatusMap[stat._id] !== undefined) {
        bookingStatusMap[stat._id] = stat.count;
      }
      if (stat._id === 'confirmed' || stat._id === 'completed' || stat._id === 'active') {
        totalGrossVolume += stat.totalRevenue || 0;
      }
    });

    // Format Payment Metrics
    let successfulPaymentVolume = 0;
    let successfulPaymentCount = 0;
    paymentStats.forEach((stat) => {
      if (stat._id === 'succeeded') {
        successfulPaymentVolume = stat.totalAmount;
        successfulPaymentCount = stat.count;
      }
    });

    // Calculate Platform Marketplace Economics (Take rate: 5%)
    const grossMerchandiseValue = Number(Math.max(totalGrossVolume, successfulPaymentVolume).toFixed(2));
    const platformTakeRate = 0.05; // 5% marketplace commission
    const platformRevenue = Number((grossMerchandiseValue * platformTakeRate).toFixed(2));
    const hostLiabilities = Number((grossMerchandiseValue * (1 - platformTakeRate)).toFixed(2));

    res.status(200).json({
      metrics: {
        users: {
          total: totalUsers,
          drivers: roleBreakdown.driver,
          hosts: roleBreakdown.host,
          admins: roleBreakdown.admin,
        },
        inventory: {
          totalSpots: spotSummary.totalSpots,
          activeSpots: spotSummary.activeSpots,
          inactiveSpots: spotSummary.inactiveSpots,
          avgPricePerHour: Number((spotSummary.avgPricePerHour || 0).toFixed(2)),
          p2pRatio: spotSummary.totalSpots > 0
            ? Number(((spotSummary.p2pSpots / spotSummary.totalSpots) * 100).toFixed(1))
            : 0,
        },
        bookings: {
          total: totalBookings,
          hoursBooked: Number(totalBookedHours.toFixed(1)),
          status: bookingStatusMap,
        },
        financials: {
          grossMerchandiseValue,
          platformRevenue,
          hostLiabilities,
          successfulTransactions: successfulPaymentCount,
          currency: 'usd',
        },
      },
      recentActivity: {
        payments: recentPayments,
        bookings: recentBookings,
      },
    });
  } catch (error) {
    logger.error('Failed to aggregate platform metrics', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error retrieving platform metrics' });
  }
};

/**
 * Paginated User Directory with Search & Filtering
 * @route GET /api/admin/users
 * @access Private/Admin
 */
export const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role
    if (req.query.role && ['driver', 'host', 'admin'].includes(req.query.role)) {
      query.role = req.query.role;
    }

    // Search query matching username or email
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ username: searchRegex }, { email: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Failed to list admin users', { error: error.message });
    res.status(500).json({ message: 'Error fetching user directory' });
  }
};

/**
 * Role Governance & User Privilege Update
 * Prevents administrator self-demotion lockout.
 * @route PUT /api/admin/users/:id/role
 * @access Private/Admin
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['driver', 'host', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be one of: driver, host, admin' });
    }

    // Guard against self-demotion
    if (req.user._id.toString() === id && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot revoke your own administrative privileges' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    logger.info(`User role modified by admin: ${user.email} -> ${role}`, {
      adminId: req.user._id,
      targetUserId: user._id,
      newRole: role,
    });

    res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Failed to update user role', { error: error.message });
    res.status(500).json({ message: 'Error updating user role' });
  }
};

/**
 * Parking Spot Moderation Directory
 * List all listings across all hosts with status filters.
 * @route GET /api/admin/spots
 * @access Private/Admin
 */
export const getAdminSpots = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status === 'active') {
      query.isAvailable = true;
    } else if (req.query.status === 'suspended') {
      query.isAvailable = false;
    }

    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { address: searchRegex }];
    }

    const [spots, total] = await Promise.all([
      ParkingSpot.find(query)
        .populate('owner', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ParkingSpot.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      spots,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Failed to list admin spots', { error: error.message });
    res.status(500).json({ message: 'Error fetching spot directory' });
  }
};

/**
 * Spot Availability & Content Moderation Toggle
 * Allows administrators to suspend or re-activate listings.
 * @route PUT /api/admin/spots/:id/status
 * @access Private/Admin
 */
export const updateSpotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'isAvailable must be a boolean value' });
    }

    const spot = await ParkingSpot.findById(id).populate('owner', 'username email');
    if (!spot) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }

    spot.isAvailable = isAvailable;
    await spot.save();

    logger.info(`Admin toggled spot status: ${spot._id} isAvailable=${isAvailable}`, {
      adminId: req.user._id,
      spotId: spot._id,
    });

    res.status(200).json({
      message: `Parking spot listing has been ${isAvailable ? 'activated' : 'suspended'}`,
      spot,
    });
  } catch (error) {
    logger.error('Failed to update spot status', { error: error.message });
    res.status(500).json({ message: 'Error updating spot moderation status' });
  }
};

/**
 * Global Booking Audit Trail
 * @route GET /api/admin/bookings
 * @access Private/Admin
 */
export const getAdminBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'username email phone vehicleInfo')
        .populate('host', 'username email')
        .populate('spot', 'title address pricePerHour')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Failed to list admin bookings', { error: error.message });
    res.status(500).json({ message: 'Error fetching booking audit trail' });
  }
};
