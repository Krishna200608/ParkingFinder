import ParkingSpot from '../models/parkingSpot.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import { triggerLiveEvent, CHANNELS, EVENTS } from '../utils/pusher.js';

// Helper function for handling errors
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

// Haversine formula to compute great-circle distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Create a new parking spot
// @route   POST /api/spots
// @access  Private (Host or Admin)
export const createParkingSpot = async (req, res) => {
  try {
    const {
      title,
      spotType = 'p2p',
      address,
      longitude,
      latitude,
      description,
      pricePerHour,
      amenities = [],
      vehicleSize = 'any',
      accessInstructions = '',
      images = [],
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
      title: title || address.split(',')[0],
      spotType,
      address,
      location,
      description: description || '',
      pricePerHour: price,
      amenities: Array.isArray(amenities) ? amenities : [],
      vehicleSize,
      accessInstructions,
      images: Array.isArray(images) ? images : [],
      owner: req.user._id,
    });

    const createdSpot = await spot.save();
    return res.status(201).json(createdSpot);
  } catch (error) {
    console.error('Error creating parking spot:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all parking spots (with multi-criteria & geospatial discovery)
// @route   GET /api/spots
// @access  Public
export const getParkingSpots = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius,
      minPrice,
      maxPrice,
      spotType,
      vehicleSize,
      amenities,
      search,
      availableOnly,
      sort,
    } = req.query;

    // Pagination — active when client supplies page or limit query parameters
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip  = (page - 1) * limit;

    let query = {};

    // 1. Geospatial "Find Near Me" query using $near with 2dsphere index
    let parsedLat = null;
    let parsedLng = null;
    if (lat !== undefined && lng !== undefined) {
      const pLat = parseFloat(lat);
      const pLng = parseFloat(lng);

      if (!isNaN(pLat) && !isNaN(pLng)) {
        parsedLat = pLat;
        parsedLng = pLng;
        const radiusMeters = radius ? parseInt(radius, 10) : 50000; // default 50km
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

    // 2. Price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerHour = {};
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        query.pricePerHour.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        query.pricePerHour.$lte = parseFloat(maxPrice);
      }
    }

    // 3. Spot Type (p2p vs operator)
    if (spotType && spotType !== 'all') {
      query.spotType = spotType;
    }

    // 4. Vehicle Size compatibility
    if (vehicleSize && vehicleSize !== 'any') {
      query.$or = [
        { vehicleSize: vehicleSize },
        { vehicleSize: 'any' },
        { vehicleSize: { $exists: false } },
      ];
    }

    // 5. Amenities / Features filter
    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
      if (amenityList.length > 0) {
        query.amenities = { $all: amenityList };
      }
    }

    // 6. Availability filter
    if (availableOnly === 'true' || availableOnly === true) {
      query.isAvailable = true;
    }

    // 7. Text / Keyword Search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { title: searchRegex },
        { address: searchRegex },
        { description: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // 8. Exclude spots owned by the logged-in user if authenticated
    if (req.user?._id) {
      query.owner = { $ne: req.user._id };
    }

    // Build query pipeline
    let spotQuery = ParkingSpot.find(query)
      .populate('owner', 'username role email createdAt')
      .lean();

    // Default sorting when not restricted by $near
    if (!query.location) {
      if (sort === 'price_asc') {
        spotQuery = spotQuery.sort({ pricePerHour: 1 });
      } else if (sort === 'price_desc') {
        spotQuery = spotQuery.sort({ pricePerHour: -1 });
      } else if (sort === 'rating_desc') {
        spotQuery = spotQuery.sort({ rating: -1 });
      } else {
        spotQuery = spotQuery.sort({ createdAt: -1 });
      }
    }

    // Count total matching documents for client-side pagination UI.
    // Note: $near requires sorting and is rejected by countDocuments; convert to $geoWithin for counting.
    let total = 0;
    try {
      let countQuery = { ...query };
      if (countQuery.location && countQuery.location.$near) {
        const coordinates = countQuery.location.$near.$geometry?.coordinates;
        const maxDistance = countQuery.location.$near.$maxDistance || 50000;
        if (coordinates) {
          countQuery.location = {
            $geoWithin: {
              $centerSphere: [coordinates, maxDistance / 6378100],
            },
          };
        } else {
          delete countQuery.location;
        }
      }
      total = await ParkingSpot.countDocuments(countQuery);
    } catch (countErr) {
      console.warn('Count query fallback:', countErr.message);
    }

    // Apply pagination if requested by client
    if (isPaginated) {
      spotQuery = spotQuery.skip(skip).limit(limit);
    }

    let spots = await spotQuery;

    // Attach calculated distance in kilometers if lat/lng provided
    if (parsedLat !== null && parsedLng !== null) {
      spots = spots.map((spot) => {
        const spotLng = spot.location?.coordinates?.[0];
        const spotLat = spot.location?.coordinates?.[1];
        let distanceKm = null;
        if (spotLat !== undefined && spotLng !== undefined) {
          distanceKm = calculateDistanceKm(parsedLat, parsedLng, spotLat, spotLng);
        }
        return {
          ...spot,
          distanceKm,
        };
      });

      // Apply client-requested ordering if $near was active
      if (sort === 'price_asc') {
        spots.sort((a, b) => a.pricePerHour - b.pricePerHour);
      } else if (sort === 'price_desc') {
        spots.sort((a, b) => b.pricePerHour - a.pricePerHour);
      } else if (sort === 'rating_desc') {
        spots.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === 'distance') {
        spots.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    if (isPaginated) {
      return res.status(200).json({
        spots,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      });
    }

    res.set('X-Total-Count', String(total || spots.length));
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
      .populate('owner', 'username role email createdAt')
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
    if (req.body.title !== undefined) spot.title = req.body.title;
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
    if (req.body.amenities !== undefined && Array.isArray(req.body.amenities)) {
      spot.amenities = req.body.amenities;
    }
    if (req.body.vehicleSize !== undefined) {
      spot.vehicleSize = req.body.vehicleSize;
    }
    if (req.body.accessInstructions !== undefined) {
      spot.accessInstructions = req.body.accessInstructions;
    }
    if (req.body.images !== undefined && Array.isArray(req.body.images)) {
      spot.images = req.body.images;
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

    // Broadcast spot availability modification in real time
    triggerLiveEvent(CHANNELS.spotChannel(updatedSpot._id), EVENTS.SPOT_UPDATED, {
      spotId: updatedSpot._id,
      isAvailable: updatedSpot.isAvailable,
      pricePerHour: updatedSpot.pricePerHour,
    });
    triggerLiveEvent(CHANNELS.GLOBAL_MARKETPLACE, EVENTS.SPOT_UPDATED, {
      spotId: updatedSpot._id,
      isAvailable: updatedSpot.isAvailable,
    });

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

    // Verified Driver policy: user must have a confirmed, active, or completed booking on this spot
    const hasBooking = await Booking.findOne({
      user: req.user._id,
      spot: spot._id,
      status: { $in: ['confirmed', 'completed', 'active'] },
    });

    if (!hasBooking && req.user.role !== 'admin') {
      return handleError(
        res,
        403,
        'Only verified drivers with a confirmed or completed reservation on this spot may leave a review.'
      );
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

// @desc    Seed realistic demo spots for discovery and live demonstrations
// @route   POST /api/spots/seed
// @access  Public (Idempotent seed helper)
export const seedDemoSpots = async (req, res) => {
  try {
    const spotCount = await ParkingSpot.countDocuments();
    if (spotCount > 0 && req.query.force !== 'true') {
      return res.status(200).json({
        message: `Database already contains ${spotCount} spots. Pass ?force=true to seed additional spots.`,
        count: spotCount,
      });
    }

    // Find or create demo host user safely without unique email conflicts
    let demoHost = await User.findOne({
      $or: [{ role: 'host' }, { email: 'host@parkingfinder.demo' }],
    });
    if (demoHost) {
      if (demoHost.role !== 'host') {
        demoHost.role = 'host';
        await demoHost.save();
      }
    } else {
      demoHost = await User.create({
        username: 'MetroHost',
        email: 'host@parkingfinder.demo',
        password: 'Password123!',
        role: 'host',
      });
    }

    const demoSpotsData = [
      {
        title: 'Connaught Place Premium Garage',
        address: 'Block B, Inner Circle, Connaught Place, New Delhi, 110001',
        location: { type: 'Point', coordinates: [77.2195, 28.6328] }, // [lng, lat]
        pricePerHour: 15,
        spotType: 'operator',
        vehicleSize: 'any',
        amenities: ['covered', 'ev_charging', 'cctv', 'disabled_access', 'gated'],
        accessInstructions: 'Show QR confirmation at the automated gate barrier.',
        description: 'Multi-level secure commercial parking facility with 24/7 CCTV surveillance, rapid EV chargers, and reserved disabled bays in central Delhi.',
        rating: 4.8,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Cyber City Corporate Parking Bay',
        address: 'DLF Cyber City, Tower 10, Gurugram, Haryana, 122002',
        location: { type: 'Point', coordinates: [77.0888, 28.4950] },
        pricePerHour: 12,
        spotType: 'operator',
        vehicleSize: 'suv',
        amenities: ['covered', 'cctv', 'valet', 'gated'],
        accessInstructions: 'Valet desk on basement level 1.',
        description: 'Convenient business hub parking space suitable for SUVs and executive sedans. Full security and valet service included.',
        rating: 4.7,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Hauz Khas Village Private Driveway',
        address: 'Deer Park Rd, Hauz Khas Village, New Delhi, 110016',
        location: { type: 'Point', coordinates: [77.1942, 28.5494] },
        pricePerHour: 8,
        spotType: 'p2p',
        vehicleSize: 'sedan',
        amenities: ['cctv', 'lit_lot'],
        accessInstructions: 'Gate 2 on Deer Park Rd. Code will be sent on booking.',
        description: 'Private residential driveway in Hauz Khas. Easy 3-minute walking distance to popular cafes, restaurants, and historical monuments.',
        rating: 4.9,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Aerocity Express Transit Parking',
        address: 'Hospitality District, Aerocity, Indira Gandhi International Airport, New Delhi, 110037',
        location: { type: 'Point', coordinates: [77.1215, 28.5501] },
        pricePerHour: 20,
        spotType: 'operator',
        vehicleSize: 'any',
        amenities: ['covered', 'ev_charging', 'cctv', 'disabled_access', 'valet'],
        accessInstructions: 'Follow signs for P3 Underground Terminal Transit.',
        description: 'High-speed airport transit parking with continuous EV supercharging, CCTV, and covered weather protection right next to Delhi Airport.',
        rating: 4.9,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Saket District Centre Covered Bay',
        address: 'Press Enclave Marg, Saket District Centre, Sector 6, New Delhi, 110017',
        location: { type: 'Point', coordinates: [77.2183, 28.5284] },
        pricePerHour: 10,
        spotType: 'p2p',
        vehicleSize: 'compact',
        amenities: ['covered', 'cctv'],
        accessInstructions: 'Park in designated spot #24.',
        description: 'Secure basement slot adjacent to Select Citywalk Mall. Ideal for compact and mid-size city vehicles.',
        rating: 4.5,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Indiranagar 100ft Road Hub',
        address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, 560038',
        location: { type: 'Point', coordinates: [77.6412, 12.9716] },
        pricePerHour: 14,
        spotType: 'operator',
        vehicleSize: 'any',
        amenities: ['covered', 'ev_charging', 'cctv'],
        accessInstructions: 'Automated barrier lifts upon plate recognition or reservation code.',
        description: 'Prime retail district parking space with EV chargers and covered shade in Bengaluru.',
        rating: 4.8,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'BKC Financial Center Executive Spot',
        address: 'G Block, Bandra Kurla Complex, Bandra East, Mumbai, 400051',
        location: { type: 'Point', coordinates: [72.8687, 19.0664] },
        pricePerHour: 22,
        spotType: 'operator',
        vehicleSize: 'any',
        amenities: ['covered', 'cctv', 'valet', 'disabled_access'],
        accessInstructions: 'Executive lane 3 entrance.',
        description: 'State-of-the-art corporate parking facility in the heart of Mumbai financial hub.',
        rating: 4.9,
        isAvailable: true,
        owner: demoHost._id,
      },
      {
        title: 'Manhattan Midtown Secure Garage',
        address: '350 5th Ave, New York, NY 10118',
        location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
        pricePerHour: 35,
        spotType: 'operator',
        vehicleSize: 'any',
        amenities: ['covered', 'cctv', 'valet', 'ev_charging'],
        accessInstructions: 'Entrance on 33rd St between 5th and 6th Ave.',
        description: 'Prime Manhattan parking garage located steps away from Empire State Building and Herald Square.',
        rating: 4.9,
        isAvailable: true,
        owner: demoHost._id,
      },
    ];

    const inserted = await ParkingSpot.insertMany(demoSpotsData);
    return res.status(201).json({
      message: `Successfully seeded ${inserted.length} realistic demo parking spots across key metro locations.`,
      spots: inserted,
    });
  } catch (error) {
    console.error('Error seeding demo spots:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get parking demand heatmap geospatial points
// @route   GET /api/spots/demand-heatmap
// @access  Public
export const getDemandHeatmap = async (req, res) => {
  try {
    const spots = await ParkingSpot.find({ isAvailable: true })
      .select('title address location pricePerHour rating reviews spotType')
      .lean();

    const heatmapPoints = spots.map((s) => {
      const lng = s.location?.coordinates?.[0] || 77.209;
      const lat = s.location?.coordinates?.[1] || 28.6139;
      // Synthesize high-demand density weight based on rating, reviews count and operator status
      const reviewWeight = Math.min(0.4, (s.reviews?.length || 0) * 0.1);
      const ratingWeight = ((s.rating || 4) / 5) * 0.5;
      const typeWeight = s.spotType === 'operator' ? 0.1 : 0.05;
      const intensity = Math.min(1.0, Math.max(0.3, ratingWeight + reviewWeight + typeWeight));

      return {
        _id: s._id,
        lat,
        lng,
        intensity: Math.round(intensity * 100) / 100,
        title: s.title || s.address,
        pricePerHour: s.pricePerHour,
        spotType: s.spotType,
      };
    });

    return res.status(200).json(heatmapPoints);
  } catch (error) {
    console.error('Error calculating demand heatmap:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};
