import Booking from '../models/booking.model.js';
import ParkingSpot from '../models/parkingSpot.model.js';

// Helper function for handling error responses
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Driver)
export const createBooking = async (req, res) => {
  try {
    const { spotId, startTime, endTime, notes } = req.body;
    const userId = req.user._id;

    // 1. Validate required inputs
    if (!spotId || !startTime || !endTime) {
      return handleError(res, 400, 'Please provide spotId, startTime, and endTime');
    }

    const startTimeObj = new Date(startTime);
    const endTimeObj = new Date(endTime);

    if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
      return handleError(res, 400, 'Invalid date format for startTime or endTime');
    }

    // Reject reservations in the past (allowing 5 minutes clock skew)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (startTimeObj < fiveMinutesAgo) {
      return handleError(res, 400, 'Start time cannot be in the past');
    }

    if (endTimeObj <= startTimeObj) {
      return handleError(res, 400, 'End time must be after start time');
    }

    // 2. Find the parking spot
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    if (!spot.isAvailable) {
      return handleError(res, 400, 'This parking spot is currently not available for bookings');
    }

    // 3. Restriction: Hosts cannot book their own spot
    if (spot.owner.toString() === userId.toString()) {
      return handleError(res, 400, 'You cannot reserve your own parking spot');
    }

    // 4. Check for booking conflicts (half-open interval overlap)
    // Overlap condition: ExistingStart < RequestedEnd && ExistingEnd > RequestedStart
    const overlappingBooking = await Booking.findOne({
      spot: spotId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      startTime: { $lt: endTimeObj },
      endTime: { $gt: startTimeObj },
    });

    if (overlappingBooking) {
      const conflictStart = new Date(overlappingBooking.startTime).toLocaleString();
      const conflictEnd = new Date(overlappingBooking.endTime).toLocaleString();
      return handleError(
        res,
        409,
        `Slot already booked from ${conflictStart} to ${conflictEnd}. Please choose a different time.`
      );
    }

    // 5. Calculate pricing
    const durationMs = endTimeObj.getTime() - startTimeObj.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const totalCost = Math.round(durationHours * spot.pricePerHour * 100) / 100;

    // 6. Create booking with honest demo reservation status
    const booking = new Booking({
      user: userId,
      spot: spotId,
      host: spot.owner,
      startTime: startTimeObj,
      endTime: endTimeObj,
      totalCost,
      notes: notes || '',
      status: 'confirmed',
      paymentStatus: 'unpaid_demo',
    });

    const createdBooking = await booking.save();

    return res.status(201).json({
      message: 'Booking created successfully (Demo Reservation)',
      booking: createdBooking,
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/me
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('spot', 'address pricePerHour location description')
      .populate('host', 'username email')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email')
      .populate('spot', 'address description pricePerHour location')
      .populate('host', 'username email');

    if (!booking) {
      return handleError(res, 404, 'Booking not found');
    }

    // Authorization: Requester must be driver, host, or admin
    const requesterId = req.user._id.toString();
    const driverId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const hostId = booking.host._id ? booking.host._id.toString() : booking.host.toString();

    if (driverId !== requesterId && hostId !== requesterId && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to view this booking');
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking by id:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return handleError(res, 404, 'Booking not found');
    }

    // Authorization: Requester must be the booking driver or admin
    const requesterId = req.user._id.toString();
    const driverId = booking.user.toString();

    if (driverId !== requesterId && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to cancel this booking');
    }

    // Status check
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return handleError(res, 400, `Cannot cancel a booking that is already ${booking.status}`);
    }

    booking.status = 'cancelled';
    const updatedBooking = await booking.save();

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get booked slots for a specific parking spot
// @route   GET /api/bookings/spot/:spotId
// @access  Public
export const getBookedSlotsForSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const now = new Date();

    const bookings = await Booking.find({
      spot: spotId,
      endTime: { $gte: now },
      status: { $in: ['pending', 'confirmed', 'active'] },
    })
      .sort('startTime')
      .select('startTime endTime -_id');

    // Generate suggested 1-hour slots for today without in-place mutation
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const allSlots = [];
    for (let i = 0; i < 24; i++) {
      const slotStart = new Date(startOfDay.getTime() + i * 3600000);
      const slotEnd = new Date(slotStart.getTime() + 3600000);
      if (slotStart >= now && slotEnd <= endOfDay) {
        allSlots.push({ start: slotStart, end: slotEnd });
      }
    }

    // Filter out slots overlapping with existing bookings
    const availableSlots = allSlots.filter(
      (slot) =>
        !bookings.some(
          (b) => new Date(b.startTime) < slot.end && new Date(b.endTime) > slot.start
        )
    );

    return res.status(200).json({
      bookedSlots: bookings,
      suggestedSlots: availableSlots.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};
