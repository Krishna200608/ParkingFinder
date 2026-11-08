import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import ParkingSpot from '../models/parkingSpot.model.js';
import {
  sendBookingConfirmationEmail,
  sendHostBookingNotificationEmail,
  sendCancellationEmail,
} from '../utils/email.js';
import { triggerLiveEvent, CHANNELS, EVENTS } from '../utils/pusher.js';

// Helper function for consistent error responses
const handleError = (res, statusCode, message, errors = null) => {
  return res.status(statusCode).json({
    message,
    ...(errors && { errors }),
  });
};

/**
 * Executes an operation within a MongoDB transaction with bounded retries
 * on transient transaction conflicts. Gracefully falls back if running on a standalone instance.
 */
const executeWithRetry = async (operation, maxRetries = 3) => {
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    // Test if replica set / transactions are active
    session.startTransaction();
    useTransaction = true;
  } catch (err) {
    if (session) {
      await session.endSession().catch(() => {});
      session = null;
    }
    useTransaction = false;
  }

  if (!useTransaction) {
    // Non-transactional execution fallback (e.g. mock/standalone environment)
    return await operation(null);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!session.inTransaction()) {
        session.startTransaction();
      }

      const result = await operation(session);
      await session.commitTransaction();
      await session.endSession();
      return result;
    } catch (error) {
      if (session && session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }

      // Standalone MongoDB fallback (e.g. CI or local test instance without replica set)
      if (
        error.message &&
        (error.message.includes('Transaction numbers are only allowed on a replica set') ||
         error.message.includes('replica set member'))
      ) {
        if (session) {
          await session.endSession().catch(() => {});
        }
        return await operation(null);
      }

      const isTransient =
        error.errorLabels && error.errorLabels.includes('TransientTransactionError');
      const isWriteConflict =
        error.code === 112 || (error.message && error.message.includes('WriteConflict'));

      if ((isTransient || isWriteConflict) && attempt < maxRetries) {
        // Exponential backoff jitter before retrying
        const delay = Math.pow(2, attempt) * 50 + Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (session) {
        await session.endSession().catch(() => {});
      }
      throw error;
    }
  }
};

// @desc    Create a new booking with concurrency protection
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

    if (!mongoose.Types.ObjectId.isValid(spotId)) {
      return handleError(res, 400, 'Invalid parking spot ID format');
    }

    const startTimeObj = new Date(startTime);
    const endTimeObj = new Date(endTime);

    if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
      return handleError(res, 400, 'Invalid date format for startTime or endTime');
    }

    // Reject bookings in the past (allowing 5 minutes clock skew)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (startTimeObj < fiveMinutesAgo) {
      return handleError(res, 400, 'Start time cannot be in the past');
    }

    if (endTimeObj <= startTimeObj) {
      return handleError(res, 400, 'End time must be after start time');
    }

    // Duration validation (minimum 15 mins, maximum 30 days)
    const durationMs = endTimeObj.getTime() - startTimeObj.getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;

    if (durationHours < 0.25) {
      return handleError(res, 400, 'Booking duration must be at least 15 minutes');
    }
    if (durationHours > 720) {
      return handleError(res, 400, 'Booking duration cannot exceed 30 days');
    }

    // 2. Find the parking spot
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    if (!spot.isAvailable) {
      return handleError(res, 400, 'This parking spot is currently marked unavailable by the host');
    }

    // 3. Prevent host from booking their own spot
    if (spot.owner.toString() === userId.toString()) {
      return handleError(res, 400, 'You cannot reserve your own parking spot');
    }

    // Calculate price snapshot
    const pricePerHour = spot.pricePerHour;
    const totalCost = Math.round(durationHours * pricePerHour * 100) / 100;

    // 4. Concurrency-Safe Transactional Reservation Execution
    const result = await executeWithRetry(async (session) => {
      const opts = session ? { session } : {};

      // Atomically acquire lock / increment sequence on parking spot document
      const lockedSpot = await ParkingSpot.findOneAndUpdate(
        { _id: spotId },
        { $inc: { bookingSequence: 1 } },
        { ...opts, new: true }
      );

      if (!lockedSpot || !lockedSpot.isAvailable) {
        throw { statusCode: 400, message: 'Parking spot is not currently available' };
      }

      // Check for half-open interval overlap with existing active reservations
      // Condition: existing.startTime < requested.endTime && existing.endTime > requested.startTime
      const overlappingBooking = await Booking.findOne({
        spot: spotId,
        status: { $in: ['pending', 'confirmed', 'active'] },
        startTime: { $lt: endTimeObj },
        endTime: { $gt: startTimeObj },
      }, null, opts);

      if (overlappingBooking) {
        const conflictStart = new Date(overlappingBooking.startTime).toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
        const conflictEnd = new Date(overlappingBooking.endTime).toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
        });

        throw {
          statusCode: 409,
          message: `Slot already booked from ${conflictStart} to ${conflictEnd}. Please select a non-overlapping time.`,
        };
      }

      // Create new booking record with full snapshots
      const booking = new Booking({
        user: userId,
        spot: spotId,
        host: spot.owner,
        startTime: startTimeObj,
        endTime: endTimeObj,
        durationHours,
        pricePerHourSnapshot: pricePerHour,
        totalCost,
        notes: notes || '',
        status: 'confirmed',
        paymentStatus: 'unpaid_demo',
      });

      const savedBooking = await booking.save(opts);
      return savedBooking;
    });

    // Send asynchronous confirmation and notification emails (non-blocking)
    (async () => {
      try {
        const spot = await ParkingSpot.findById(result.spot).populate('owner', 'username email');
        if (req.user?.email) {
          sendBookingConfirmationEmail({
            to: req.user.email,
            driverName: req.user.username,
            spotTitle: spot?.title || 'Reserved Parking Bay',
            address: spot?.address || '',
            startTime: result.startTime,
            endTime: result.endTime,
            totalCost: result.totalCost || result.totalAmount,
            bookingId: result._id.toString(),
          }).catch(() => {});
        }
        if (spot?.owner?.email) {
          sendHostBookingNotificationEmail({
            to: spot.owner.email,
            hostName: spot.owner.username,
            spotTitle: spot.title,
            driverName: req.user.username,
            startTime: result.startTime,
            endTime: result.endTime,
            totalEarnings: result.totalCost || result.totalAmount,
          }).catch(() => {});
        }
      } catch {
        // Never interrupt client response on email notification failure
      }
    })();

    // Broadcast real-time availability update across Pusher Channels
    triggerLiveEvent(CHANNELS.spotChannel(result.spot), EVENTS.BOOKING_CREATED, {
      spotId: result.spot.toString(),
      bookingId: result._id.toString(),
      startTime: result.startTime,
      endTime: result.endTime,
      status: 'confirmed',
    });
    triggerLiveEvent(CHANNELS.GLOBAL_MARKETPLACE, EVENTS.BOOKING_CREATED, {
      spotId: result.spot.toString(),
      action: 'reserved',
    });

    return res.status(201).json({
      message: 'Reservation created successfully (Demo Reservation)',
      booking: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return handleError(res, error.statusCode, error.message);
    }
    console.error('Booking creation error:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Calculate spot availability for any selected date and duration
// @route   GET /api/bookings/spot/:spotId/availability
// @access  Public
export const getSpotAvailability = async (req, res) => {
  try {
    const { spotId } = req.params;
    const { date, duration = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(spotId)) {
      return handleError(res, 400, 'Invalid parking spot ID format');
    }

    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return handleError(res, 404, 'Parking spot not found');
    }

    // Determine query date range [startOfDay, endOfDay]
    let baseDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        baseDate = parsedDate;
      }
    }

    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const now = new Date();

    // Query all bookings for this spot overlapping with the target day
    const bookings = await Booking.find({
      spot: spotId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay },
    })
      .select('startTime endTime status')
      .sort({ startTime: 1 });

    const requestedDurationHours = Math.max(0.25, parseFloat(duration) || 1);
    const stepMs = 3600000; // 1-hour increments
    const slotDurationMs = requestedDurationHours * 3600000;

    const availableSlots = [];
    const bookedIntervals = bookings.map((b) => ({
      start: b.startTime,
      end: b.endTime,
      status: b.status,
    }));

    // Generate candidate intervals throughout the 24-hour day
    for (let time = startOfDay.getTime(); time + slotDurationMs <= endOfDay.getTime(); time += stepMs) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + slotDurationMs);

      // Skip past slots for today
      if (slotStart < now) continue;

      // Half-open interval conflict check: slotStart < existing.end && slotEnd > existing.start
      const hasConflict = bookings.some(
        (b) => new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart
      );

      if (!hasConflict) {
        availableSlots.push({
          start: slotStart,
          end: slotEnd,
          durationHours: requestedDurationHours,
          price: Math.round(requestedDurationHours * spot.pricePerHour * 100) / 100,
        });
      }
    }

    return res.status(200).json({
      spotId,
      address: spot.address,
      pricePerHour: spot.pricePerHour,
      date: startOfDay.toISOString().split('T')[0],
      bookedIntervals,
      availableSlots,
      totalAvailable: availableSlots.length,
      totalBooked: bookedIntervals.length,
    });
  } catch (error) {
    console.error('Availability calculation error:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get booked slots for a specific spot (Backwards-compatible endpoint)
// @route   GET /api/bookings/spot/:spotId
// @access  Public
export const getBookedSlotsForSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(spotId)) {
      return handleError(res, 400, 'Invalid parking spot ID format');
    }

    const now = new Date();
    const bookings = await Booking.find({
      spot: spotId,
      endTime: { $gte: now },
      status: { $in: ['pending', 'confirmed', 'active'] },
    })
      .sort({ startTime: 1 })
      .select('startTime endTime -_id');

    // Generate upcoming 1-hour suggested slots for today
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

    const availableSlots = allSlots.filter(
      (slot) =>
        !bookings.some(
          (b) => new Date(b.startTime) < slot.end && new Date(b.endTime) > slot.start
        )
    );

    return res.status(200).json({
      bookedSlots: bookings,
      suggestedSlots: availableSlots.slice(0, 6),
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/me
// @access  Private (Driver)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('spot', 'address pricePerHour location description spotType')
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
// @access  Private (Driver, Host, or Admin)
export const getBookingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return handleError(res, 400, 'Invalid booking ID format');
    }

    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email')
      .populate('spot', 'address description pricePerHour location spotType')
      .populate('host', 'username email')
      .populate('cancelledBy', 'username');

    if (!booking) {
      return handleError(res, 404, 'Booking not found');
    }

    // Authorization: User must be driver, host, or admin
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

// @desc    Cancel a booking with audit trail
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Driver or Admin)
export const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return handleError(res, 400, 'Invalid booking ID format');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return handleError(res, 404, 'Booking not found');
    }

    const requesterId = req.user._id.toString();
    const driverId = booking.user.toString();

    // Authorization check
    if (driverId !== requesterId && req.user.role !== 'admin') {
      return handleError(res, 403, 'User not authorized to cancel this booking');
    }

    // Lifecycle check
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return handleError(res, 400, `Cannot cancel a booking that is already ${booking.status}`);
    }

    // Cancellation Policy: Driver cannot cancel after booking has already started
    const now = new Date();
    if (booking.startTime < now && req.user.role !== 'admin') {
      return handleError(res, 400, 'Cannot cancel a reservation that has already commenced.');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = now;
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = req.body.reason || 'Cancelled by driver';

    const updatedBooking = await booking.save();

    // Send cancellation notification email asynchronously (non-blocking)
    (async () => {
      try {
        const spot = await ParkingSpot.findById(booking.spot);
        if (req.user?.email) {
          sendCancellationEmail({
            to: req.user.email,
            recipientName: req.user.username,
            spotTitle: spot?.title || 'Parking Space',
            startTime: booking.startTime,
            endTime: booking.endTime,
            reason: booking.cancellationReason,
          }).catch(() => {});
        }
      } catch {
        // Never interrupt client response on email notification failure
      }
    })();

    // Broadcast real-time slot release across Pusher Channels
    triggerLiveEvent(CHANNELS.spotChannel(booking.spot), EVENTS.BOOKING_CANCELLED, {
      spotId: booking.spot,
      bookingId: booking._id,
      status: 'cancelled',
    });
    triggerLiveEvent(CHANNELS.GLOBAL_MARKETPLACE, EVENTS.BOOKING_CANCELLED, {
      spotId: booking.spot,
      action: 'released',
    });

    return res.status(200).json({
      message: 'Reservation cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};

// @desc    Get all bookings on parking spots owned by the logged-in host
// @route   GET /api/bookings/host
// @access  Private (Host or Admin)
export const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user._id })
      .populate('user', 'username email')
      .populate('spot', 'title address pricePerHour location spotType vehicleSize')
      .sort({ startTime: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    return handleError(res, 500, `Server error: ${error.message}`);
  }
};
