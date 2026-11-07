import ParkingSpot from '../models/parkingSpot.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';

// Helper function for handling errors
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

// @desc    Create a new parking spot
// @route   POST /api/spots
// @access  Private (Host or Admin)
export const createParkingSpot = async (req, res) => {
  try {
    const {
      spotType = 'p2p',
      address,
      longitude,
      latitude,
      description,
      pricePerHour,
    } = req.body;

    // Resolve coordinates from flat inputs or nested GeoJSON
    const rawLng = longitude !== undefined ? longitude : req.body.location?.coordinates?.[0];
    const rawLat = latitude !== undefined ? latitude : req.body.location?.coordinates?.[1];

    if (!address || rawLng === undefined || rawLng === null || rawLat === undefined || rawLat === null || pricePerHour === undefined || pricePerHour === null) {
      return handleError(res, 400, 'Please provide all required fields: address, coordinates, and pricePerHour');
    }

    const lng = parseFloat(rawLng);
    const lat = parseFloat(rawLat);
    const price = parseFloat(pricePerHour);

    if (isNaN(lng) || isNaN(lat)) {
      return handleError(res, 400, 'Invalid coordinate format');
    }

    if (isNaN(price) || price < 0) {
      return handleError(res, 400, 'Price per hour must be a valid non-negative number');
    }

    // Create GeoJSON Point [longitude, latitude]
    const location = {
      type: 'Point',
      coordinates: [lng, lat],
    };

    const spot = new ParkingSpot({
      spotType,
      address,
      location,
      description: description || '',
      pricePerHour: price,
      owner: req.user._id,
    });

    const createdSpot = await spot.save();
    return res.status(201).json(createdSpot);
  } catch (error) {
    console.error('Error creating parking spot:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all parking spots (with optional geospatial query)
// @route   GET /api/spots
// @access  Public
export const getParkingSpots = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    let query = {};

    // Geospatial "Find Near Me" query using $near with 2dsphere index
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        const radiusMeters = radius ? parseInt(radius, 10) : 5000; // default 5km
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat],
            },
            $maxDistance: radiusMeters,
          },
        };
      }
    }

    // Exclude spots owned by the logged-in user if authenticated
    if (req.user?._id) {
      query.owner = { $ne: req.user._id };
    }

    const spots = await ParkingSpot.find(query)
      .populate('owner', 'username role')
      .lean();

    return res.status(200).json(spots);
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get a single parking spot by ID
// @route   GET /api/spots/:id
// @access  Public
export const getParkingSpotById = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id)
      .populate('owner', 'username role')
      .populate('reviews.user', 'username');

    if (spot) {
      return res.status(200).json(spot);
    }
    return handleError(res, 404, 'Parking spot not found');
  } catch (error) {
    console.error('Error fetching parking spot by id:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Update a parking spot
// @route   PUT /api/spots/:id
// @access  Private (Owner, Host, or Admin)
export const updateParkingSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    // Authorization: User must be spot owner or admin
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to update this spot');
    }

    // Update basic fields if provided
    if (req.body.spotType) spot.spotType = req.body.spotType;
    if (req.body.address) spot.address = req.body.address;
    if (req.body.description !== undefined) spot.description = req.body.description;
    if (req.body.pricePerHour !== undefined) {
      const price = parseFloat(req.body.pricePerHour);
      if (!isNaN(price) && price >= 0) spot.pricePerHour = price;
    }
    if (req.body.isAvailable !== undefined) {
      spot.isAvailable = Boolean(req.body.isAvailable);
    }

    // Update location if coordinates provided
    const rawLng = req.body.longitude !== undefined ? req.body.longitude : req.body.location?.coordinates?.[0];
    const rawLat = req.body.latitude !== undefined ? req.body.latitude : req.body.location?.coordinates?.[1];

    if (rawLng !== undefined && rawLat !== undefined) {
      const lng = parseFloat(rawLng);
      const lat = parseFloat(rawLat);
      if (!isNaN(lng) && !isNaN(lat)) {
        spot.location = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    const updatedSpot = await spot.save();
    return res.status(200).json(updatedSpot);
  } catch (error) {
    console.error('Error updating parking spot:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Delete a parking spot (with active reservation guard)
// @route   DELETE /api/spots/:id
// @access  Private (Owner, Host, or Admin)
export const deleteParkingSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    // Authorization: User must be spot owner or admin
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to delete this spot');
    }

    // Safety guard: Check for active or upcoming bookings
    const activeBooking = await Booking.findOne({
      spot: spot._id,
      endTime: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed', 'active'] },
    });

    if (activeBooking) {
      return handleError(
        res,
        400,
        'Cannot delete spot with active or upcoming bookings. Cancel or complete existing reservations first.'
      );
    }

    await spot.deleteOne();
    return res.status(200).json({ message: 'Parking spot removed successfully' });
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Create a new review for a spot
// @route   POST /api/spots/:id/reviews
// @access  Private
export const createSpotReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return handleError(res, 400, 'Rating must be a number between 1 and 5');
    }

    // Check if user has already reviewed this spot
    const alreadyReviewed = spot.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return handleError(res, 400, 'You have already reviewed this parking spot');
    }

    const review = {
      user: req.user._id,
      rating: numRating,
      comment: comment || '',
    };

    spot.reviews.push(review);
    await spot.save();

    return res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all parking spots owned by the logged-in host
// @route   GET /api/spots/my
// @access  Private (Host or Admin)
export const getMyParkingSpots = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 1. Aggregate host’s earnings from bookings
    const earnings = await Booking.aggregate([
      {
        $match: {
          host: req.user._id,
          paymentStatus: { $in: ['paid', 'not_required', 'unpaid_demo'] },
          status: { $in: ['confirmed', 'active', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$spot',
          totalEarnings: { $sum: '$totalCost' },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    // 2. Fetch host’s own spots
    const spots = await ParkingSpot.find({ owner: req.user._id })
      .populate('owner', 'username role')
      .lean();

    // 3. Merge earnings data
    const spotsWithEarnings = spots.map((spot) => {
      const e = earnings.find((x) => x._id.toString() === spot._id.toString());
      return {
        ...spot,
        totalEarnings: e ? e.totalEarnings : 0,
        totalBookings: e ? e.totalBookings : 0,
      };
    });

    return res.status(200).json(spotsWithEarnings);
  } catch (error) {
    console.error('Error fetching host spots:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};
