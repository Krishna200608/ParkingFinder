import ParkingSpot from '../models/parkingSpot.model.js';
import User from '../models/user.model.js'; // We'll need this for reviews

// --- Helper function for handling errors ---
const handleError = (res, statusCode, message) => {
  res.status(statusCode).json({ message });
};

// @desc    Create a new parking spot
// @route   POST /api/spots
// @access  Private (Host or Admin)
export const createParkingSpot = async (req, res) => {
  try {
    const { 
      spotType, 
      address, 
      longitude, 
      latitude, 
      description, 
      pricePerHour 
    } = req.body;

    // 1. Validate required fields
    if (!spotType || !address || !longitude || !latitude || !pricePerHour) {
      return handleError(res, 400, 'Please provide all required fields: spotType, address, longitude, latitude, pricePerHour');
    }

    // 2. Create the GeoJSON location object
    const location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    // 3. Create the new spot
    const spot = new ParkingSpot({
      spotType,
      address,
      location,
      description,
      pricePerHour,
      owner: req.user._id, // From 'protect' middleware
    });

    const createdSpot = await spot.save();
    res.status(201).json(createdSpot);

  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all parking spots (with geospatial query)
// @route   GET /api/spots
// @access  Public
export const getParkingSpots = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; // e.g., ?lat=40.71&lng=-74.00&radius=5000 (in meters)

    let query = {};

    // --- This is the Geospatial "Find Near Me" query ---
    // It's a core feature of your project
    if (lat && lng) {
      const R = radius ? parseInt(radius) : 5000; // Default 5km radius
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: R, // Max distance in meters
        },
      };
    }

    const spots = await ParkingSpot.find(query).populate('owner', 'username role'); // Populate owner info
    res.status(200).json(spots);

  } catch (error) {
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
      .populate('reviews.user', 'username'); // Populate review user info

    if (spot) {
      res.status(200).json(spot);
    } else {
      return handleError(res, 404, 'Parking spot not found');
    }
  } catch (error) {
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

    // 1. Check if the logged-in user is the owner (or an admin)
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to update this spot');
    }

    // 2. Update fields
    spot.spotType = req.body.spotType || spot.spotType;
    spot.address = req.body.address || spot.address;
    spot.description = req.body.description || spot.description;
    spot.pricePerHour = req.body.pricePerHour || spot.pricePerHour;
    spot.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : spot.isAvailable;

    // Update location if provided
    if (req.body.longitude && req.body.latitude) {
      spot.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    const updatedSpot = await spot.save();
    res.status(200).json(updatedSpot);

  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Delete a parking spot
// @route   DELETE /api/spots/:id
// @access  Private (Owner, Host, or Admin)
export const deleteParkingSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    // 1. Check if the logged-in user is the owner (or an admin)
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to delete this spot');
    }

    // 2. Delete the spot
    await spot.deleteOne();
    res.status(200).json({ message: 'Parking spot removed' });

  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Create a new review for a spot
// @route   POST /api/spots/:id/reviews
// @access  Private (any logged-in user, but ideally 'driver')
export const createSpotReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const spot = await ParkingSpot.findById(req.params.id);

    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    // 1. Check if user has already reviewed this spot
    const alreadyReviewed = spot.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return handleError(res, 400, 'You have already reviewed this spot');
    }
    
    // 2. TODO: Add check to ensure user has *booked* this spot before reviewing
    // We'll add this logic after we build the Booking API

    // 3. Create new review
    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
    };

    spot.reviews.push(review);
    
    // 4. Save (the pre-save middleware in the model will auto-update the average rating)
    await spot.save();
    res.status(201).json({ message: 'Review added' });

  } catch (error) {
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};
