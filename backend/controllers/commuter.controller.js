import CommuterPass from '../models/commuterPass.model.js';
import ParkingSpot from '../models/parkingSpot.model.js';
import Booking from '../models/booking.model.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';

/**
 * Create a new recurring weekday commuter pass
 * @route POST /api/commuter
 * @access Private (Drivers)
 */
export const createCommuterPass = async (req, res) => {
  try {
    const { spotId, daysOfWeek = [1, 2, 3, 4, 5], startTime = '09:00', endTime = '17:00', notes } = req.body;

    if (!spotId) {
      return res.status(400).json({ message: 'Parking spot ID is required' });
    }

    // Time validation
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const durationHours = Number(((endMinutes - startMinutes) / 60).toFixed(2));
    if (durationHours < 0.5) {
      return res.status(400).json({ message: 'Minimum commuter duration is 30 minutes' });
    }

    // Spot validation
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }

    if (!spot.isAvailable) {
      return res.status(400).json({ message: 'This parking spot is currently suspended or unavailable' });
    }

    if (spot.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Hosts cannot subscribe to a commuter pass for their own spot' });
    }

    // Calculate rates with 15% commuter discount
    const hourlyRateSnapshot = spot.pricePerHour;
    const discountPercentage = 15;
    const dailyCost = Number(
      (durationHours * hourlyRateSnapshot * (1 - discountPercentage / 100)).toFixed(2)
    );

    const pass = await CommuterPass.create({
      user: req.user._id,
      spot: spot._id,
      host: spot.owner,
      daysOfWeek,
      startTime,
      endTime,
      durationHours,
      hourlyRateSnapshot,
      discountPercentage,
      dailyCost,
      notes: notes || 'Standard weekday commuter pass',
      status: 'active',
    });

    logger.info(`Commuter pass created: ${pass._id} for user ${req.user.email} on spot ${spot.title}`, {
      passId: pass._id,
      userId: req.user._id,
      spotId: spot._id,
      dailyCost,
    });

    // Send confirmation email (async non-blocking)
    sendEmail({
      to: req.user.email,
      subject: `Commuter Pass Activated — ${spot.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #DDE3EA; border-radius: 8px;">
          <h2 style="color: #0F172A; margin-top: 0;">Commuter Pass Activated</h2>
          <p>Your automated weekday recurring parking pass is now active for <strong>${spot.title}</strong>.</p>
          <div style="background-color: #F8FAFC; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Schedule:</strong> Mon–Fri, ${startTime} - ${endTime}</p>
            <p style="margin: 5px 0;"><strong>Discounted Rate:</strong> $${dailyCost}/day (15% commuter discount applied)</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${spot.address}</p>
          </div>
          <p style="color: #475569; font-size: 13px;">Our automated scheduler will reserve and hold your space prior to every scheduled commute day.</p>
        </div>
      `,
    }).catch((err) => logger.warn(`Failed to dispatch commuter confirmation email: ${err.message}`));

    res.status(201).json({
      message: 'Commuter pass successfully activated',
      pass,
    });
  } catch (error) {
    logger.error('Error creating commuter pass', { error: error.message });
    res.status(500).json({ message: 'Error activating commuter pass' });
  }
};

/**
 * Get all commuter passes for authenticated driver
 * @route GET /api/commuter/my
 * @access Private
 */
export const getMyCommuterPasses = async (req, res) => {
  try {
    const passes = await CommuterPass.find({
      user: req.user._id,
      status: { $ne: 'cancelled' },
    })
      .populate('spot', 'title address pricePerHour images isAvailable')
      .populate('host', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ passes });
  } catch (error) {
    logger.error('Error fetching commuter passes', { error: error.message });
    res.status(500).json({ message: 'Error retrieving commuter passes' });
  }
};

/**
 * Toggle commuter pass status (active <-> paused)
 * @route PUT /api/commuter/:id/toggle
 * @access Private
 */
export const toggleCommuterPassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const pass = await CommuterPass.findById(id);

    if (!pass) {
      return res.status(404).json({ message: 'Commuter pass not found' });
    }

    if (pass.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this commuter pass' });
    }

    if (pass.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reactivate a cancelled pass. Please create a new one.' });
    }

    pass.status = pass.status === 'active' ? 'paused' : 'active';
    await pass.save();

    logger.info(`Commuter pass ${pass._id} status toggled to ${pass.status}`);

    res.status(200).json({
      message: `Commuter pass has been ${pass.status}`,
      pass,
    });
  } catch (error) {
    logger.error('Error toggling commuter pass status', { error: error.message });
    res.status(500).json({ message: 'Error modifying commuter pass status' });
  }
};

/**
 * Cancel a commuter pass subscription
 * @route DELETE /api/commuter/:id
 * @access Private
 */
export const cancelCommuterPass = async (req, res) => {
  try {
    const { id } = req.params;
    const pass = await CommuterPass.findById(id);

    if (!pass) {
      return res.status(404).json({ message: 'Commuter pass not found' });
    }

    if (pass.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this commuter pass' });
    }

    pass.status = 'cancelled';
    await pass.save();

    logger.info(`Commuter pass ${pass._id} cancelled by user`);

    res.status(200).json({
      message: 'Commuter pass successfully cancelled',
      pass,
    });
  } catch (error) {
    logger.error('Error cancelling commuter pass', { error: error.message });
    res.status(500).json({ message: 'Error cancelling commuter pass' });
  }
};

/**
 * Vercel Cron & Scheduled Recurring Commuter Job Engine
 * Evaluates active commuter subscriptions for the target date and creates confirmed reservations.
 * @route GET /api/cron/commuter-passes
 * @route POST /api/commuter/process-cron
 * @access Public with Vercel Cron header OR Admin Bearer token OR dev mode
 */
export const processCommuterPassCron = async (req, res) => {
  try {
    // Access control: Vercel Cron header, CRON_SECRET authorization, Admin role, or non-production environment
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const cronSecretHeader = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
    const isAdmin = req.user && req.user.role === 'admin';
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    if (!isVercelCron && !cronSecretHeader && !isAdmin && !isDevOrTest) {
      return res.status(401).json({ message: 'Unauthorized cron invocation' });
    }

    // Determine target execution date (defaults to tomorrow)
    let targetDate;
    if (req.query.targetDate) {
      targetDate = new Date(req.query.targetDate);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const targetDay = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    logger.info(`Running Commuter Cron for target date ${targetDate.toISOString().slice(0, 10)} (Day ${targetDay})`);

    // Find all active passes matching tomorrow's day of week
    const activePasses = await CommuterPass.find({
      status: 'active',
      daysOfWeek: targetDay,
    }).populate('spot');

    const results = [];
    let bookedCount = 0;
    let conflictCount = 0;
    let skippedCount = 0;

    for (const pass of activePasses) {
      if (!pass.spot || !pass.spot.isAvailable) {
        results.push({
          passId: pass._id,
          status: 'skipped',
          reason: 'Spot is deleted or unavailable',
        });
        skippedCount++;
        continue;
      }

      // Construct target interval [targetStartTime, targetEndTime)
      const targetStartTime = new Date(targetDate);
      const [sH, sM] = pass.startTime.split(':').map(Number);
      targetStartTime.setHours(sH, sM, 0, 0);

      const targetEndTime = new Date(targetDate);
      const [eH, eM] = pass.endTime.split(':').map(Number);
      targetEndTime.setHours(eH, eM, 0, 0);

      // Check if driver already has a booking for this spot and window
      const existingBooking = await Booking.findOne({
        user: pass.user,
        spot: pass.spot._id,
        startTime: targetStartTime,
        status: { $in: ['confirmed', 'active', 'completed'] },
      });

      if (existingBooking) {
        results.push({
          passId: pass._id,
          status: 'skipped',
          reason: 'Booking already created for this date',
        });
        skippedCount++;
        continue;
      }

      // Concurrency & collision check: ensure no other driver occupies the bay
      const collision = await Booking.findOne({
        spot: pass.spot._id,
        status: { $in: ['confirmed', 'active'] },
        startTime: { $lt: targetEndTime },
        endTime: { $gt: targetStartTime },
      });

      if (collision) {
        pass.conflictCount += 1;
        await pass.save();

        results.push({
          passId: pass._id,
          status: 'conflict',
          reason: 'Parking bay occupied by another reservation',
        });
        conflictCount++;
        continue;
      }

      // Commit reservation automatically
      const newBooking = await Booking.create({
        user: pass.user,
        spot: pass.spot._id,
        host: pass.host,
        startTime: targetStartTime,
        endTime: targetEndTime,
        durationHours: pass.durationHours,
        pricePerHourSnapshot: pass.hourlyRateSnapshot,
        totalCost: pass.dailyCost,
        status: 'confirmed',
        paymentStatus: 'paid', // Billed under recurring commuter subscription
        notes: `Automated Commuter Pass Renewal (Pass ID: ${pass._id})`,
      });

      pass.lastProcessedDate = new Date();
      await pass.save();

      results.push({
        passId: pass._id,
        bookingId: newBooking._id,
        status: 'booked',
        totalCost: pass.dailyCost,
      });
      bookedCount++;
    }

    logger.info(`Commuter Cron completed. Booked: ${bookedCount}, Conflicts: ${conflictCount}, Skipped: ${skippedCount}`);

    res.status(200).json({
      success: true,
      targetDate: targetDate.toISOString().slice(0, 10),
      targetDay,
      summary: {
        totalEvaluated: activePasses.length,
        booked: bookedCount,
        conflicts: conflictCount,
        skipped: skippedCount,
      },
      results,
    });
  } catch (error) {
    logger.error('Error executing commuter cron', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Error processing commuter passes scheduler' });
  }
};
