import Booking from "../models/booking.model.js";
import ParkingSpot from "../models/parkingSpot.model.js";

// --- Helper function for handling errors ---
const handleError = (res, statusCode, message) => {
	res.status(statusCode).json({ message });
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Driver)
export const createBooking = async (req, res) => {
	try {
		const { spotId, startTime, endTime, notes } = req.body;
		const userId = req.user._id; // From 'protect' middleware

		// 1️⃣ Validate input
		if (!spotId || !startTime || !endTime) {
			return handleError(
				res,
				400,
				"Please provide spotId, startTime, and endTime"
			);
		}

		const startTimeObj = new Date(startTime);
		const endTimeObj = new Date(endTime);

		if (isNaN(startTimeObj) || isNaN(endTimeObj)) {
			return handleError(
				res,
				400,
				"Invalid date format for startTime or endTime"
			);
		}

		if (endTimeObj <= startTimeObj) {
			return handleError(res, 400, "End time must be after start time");
		}

		// 2️⃣ Find the parking spot
		const spot = await ParkingSpot.findById(spotId);
		if (!spot) {
			return handleError(res, 404, "Parking spot not found");
		}

		if (!spot.isAvailable) {
			return handleError(res, 400, "This spot is currently not available");
		}

		// 3️⃣ --- Check for booking conflicts (time overlap) ---
		// A booking conflicts if its time range overlaps with the requested range.
		// Overlap logic: existing.start < new.end && existing.end > new.start
		const overlappingBooking = await Booking.findOne({
			spot: spotId,
			status: { $in: ["pending", "confirmed", "active"] },
			$or: [
				{
					startTime: { $lt: endTimeObj },
					endTime: { $gt: startTimeObj },
				},
			],
		});

		if (overlappingBooking) {
			const conflictStart = new Date(
				overlappingBooking.startTime
			).toLocaleString();
			const conflictEnd = new Date(overlappingBooking.endTime).toLocaleString();
			return handleError(
				res,
				409,
				`Slot already booked from ${conflictStart} to ${conflictEnd}. Please choose a different time.`
			);
		}

		// 4️⃣ --- Timestamp-based pricing ---
		const durationMs = endTimeObj - startTimeObj;
		const durationHours = durationMs / (1000 * 60 * 60); // convert ms → hours
		const totalCost = Math.round(durationHours * spot.pricePerHour * 100) / 100; // round to 2 decimals

		// 5️⃣ Create new booking
		const booking = new Booking({
			user: userId,
			spot: spotId,
			host: spot.owner, // from spot model
			startTime: startTimeObj,
			endTime: endTimeObj,
			totalCost,
			notes,
			status: "confirmed",
			paymentStatus: "paid",
		});

		const createdBooking = await booking.save();

		// 6️⃣ Respond with success
		res.status(201).json({
			message: "Booking created successfully",
			booking: createdBooking,
		});
	} catch (error) {
		console.error("Booking creation error:", error);
		return handleError(res, 500, `Server error: ${error.message}`);
	}
};

// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/mybookings
// @access  Private
export const getMyBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({ user: req.user._id })
			.populate("spot", "address pricePerHour location") // Populate spot details
			.populate("host", "username"); // Populate host details

		res.status(200).json(bookings);
	} catch (error) {
		return handleError(res, 500, `Server error: ${error.message}`);
	}
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id)
			.populate("user", "username email")
			.populate("spot", "address description")
			.populate("host", "username email");

		if (!booking) {
			return handleError(res, 404, "Booking not found");
		}

		// 1. Check if user is authorized to view this booking
		// Authorized if: they are the user, they are the host, or they are an admin
		if (
			booking.user._id.toString() !== req.user._id.toString() &&
			booking.host._id.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return handleError(res, 403, "User not authorized to view this booking");
		}

		res.status(200).json(booking);
	} catch (error) {
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
			return handleError(res, 404, "Booking not found");
		}

		// 1. Check if user is the one who made the booking (or an admin)
		if (
			booking.user.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return handleError(
				res,
				403,
				"User not authorized to cancel this booking"
			);
		}

		// 2. Check if booking is already completed or cancelled
		if (booking.status === "completed" || booking.status === "cancelled") {
			return handleError(
				res,
				400,
				`Cannot cancel a booking that is already ${booking.status}`
			);
		}

		// TODO: Add logic for cancellation policy (e.g., cannot cancel 1 hour before)

		// 3. Update status
		booking.status = "cancelled";
		const updatedBooking = await booking.save();

		res.status(200).json(updatedBooking);
	} catch (error) {
		return handleError(res, 500, `Server error: ${error.message}`);
	}
};

// @desc    Get booked slots for a specific parking spot
// @route   GET /api/bookings/spot/:spotId
// @access  Public (anyone viewing the spot)
export const getBookedSlotsForSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const now = new Date();

    const bookings = await Booking.find({
      spot: spotId,
      endTime: { $gte: now }, // only future or ongoing
      status: { $in: ["pending", "confirmed", "active"] },
    })
      .sort("startTime")
      .select("startTime endTime -_id");

    // Suggest next 5 1-hour available slots (for today only)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const allSlots = [];
    for (let i = 0; i < 24; i++) {
      const slotStart = new Date(startOfDay.getTime() + i * 3600000);
      const slotEnd = new Date(slotStart.getTime() + 3600000);
      if (slotStart >= now && slotEnd <= endOfDay) {
        allSlots.push({ start: slotStart, end: slotEnd });
      }
    }

    // Remove booked overlaps
    const availableSlots = allSlots.filter((slot) =>
      !bookings.some(
        (b) =>
          new Date(b.startTime) < slot.end && new Date(b.endTime) > slot.start
      )
    );

    res.status(200).json({
      bookedSlots: bookings,
      suggestedSlots: availableSlots.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
