import Stripe from 'stripe';
import { z } from 'zod';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';

// Lazy-initialize Stripe client if secret key is present
const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.startsWith('mock_') || secretKey === 'your_stripe_secret_key_here') {
    return null;
  }
  return new Stripe(secretKey);
};

const createSessionSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

/**
 * Creates a Stripe Checkout Session or returns a sandbox simulation session URL.
 * POST /api/payments/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid payment request',
        errors: parsed.error.issues?.map((e) => e.message) || [],
      });
    }

    const { bookingId } = parsed.data;
    const booking = await Booking.findById(bookingId).populate('spot');

    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this reservation' });
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return res.status(400).json({ message: `Cannot pay for a ${booking.status} reservation` });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This reservation is already paid' });
    }

    const totalAmount = Number(booking.totalCost || booking.totalAmount || 0);
    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Total amount must be greater than zero' });
    }

    // Determine client origin
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const stripe = getStripeClient();

    if (stripe) {
      // Real Stripe Checkout Session (Test Mode or Live)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: req.user.email,
        client_reference_id: booking._id.toString(),
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Parking Reservation: ${booking.spot?.title || booking.spot?.address || 'Parking Bay'}`,
                description: `${new Date(booking.startTime).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })} to ${new Date(booking.endTime).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`,
              },
              unit_amount: Math.round(totalAmount * 100), // amount in cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user._id.toString(),
        },
        success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${origin}/dashboard?payment_cancelled=true&booking_id=${booking._id}`,
      });

      booking.stripeSessionId = session.id;
      booking.paymentStatus = 'pending';
      await booking.save();

      return res.status(200).json({
        url: session.url,
        sessionId: session.id,
        mode: 'stripe',
      });
    }

    // Resilient Sandbox Simulator Mode (When Stripe key is not configured)
    const simulatedSessionId = `sim_cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    booking.stripeSessionId = simulatedSessionId;
    booking.paymentStatus = 'pending';
    await booking.save();

    return res.status(200).json({
      url: `${origin}/checkout-simulator?session_id=${simulatedSessionId}&booking_id=${booking._id}`,
      sessionId: simulatedSessionId,
      mode: 'simulation',
      message: 'Running in sandbox simulation mode. Directing to interactive test checkout.',
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ message: error.message || 'Failed to initiate checkout session' });
  }
};

/**
 * Verifies and finalizes a checkout session.
 * Used upon redirection back to the frontend to confirm paid status.
 * GET /api/payments/verify-session
 */
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId, bookingId } = req.query;
    if (!sessionId || !bookingId) {
      return res.status(400).json({ message: 'Both sessionId and bookingId are required' });
    }

    const booking = await Booking.findById(bookingId).populate('spot');
    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to reservation' });
    }

    // Already paid
    if (booking.paymentStatus === 'paid') {
      const existingPayment = await Payment.findOne({ booking: booking._id });
      return res.status(200).json({
        status: 'paid',
        booking,
        payment: existingPayment,
      });
    }

    const stripe = getStripeClient();

    if (stripe && !sessionId.startsWith('sim_cs_')) {
      // Check session status with Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        booking.paymentStatus = 'paid';
        booking.stripeSessionId = session.id;
        booking.stripePaymentIntentId = session.payment_intent;
        booking.paidAt = new Date();
        await booking.save();

        const payment = await Payment.findOneAndUpdate(
          { booking: booking._id },
          {
            booking: booking._id,
            user: booking.user,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            status: 'succeeded',
            paymentMethod: 'stripe_card',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent,
            mode: 'test',
          },
          { upsert: true, new: true }
        );

        return res.status(200).json({ status: 'paid', booking, payment });
      }

      return res.status(400).json({
        status: session.payment_status,
        message: 'Payment has not been completed',
      });
    }

    // If in simulation mode or fallback
    if (sessionId.startsWith('sim_cs_') || sessionId === booking.stripeSessionId) {
      booking.paymentStatus = 'paid';
      booking.stripePaymentIntentId = `sim_pi_${Date.now()}`;
      booking.paidAt = new Date();
      await booking.save();

      const payment = await Payment.findOneAndUpdate(
        { booking: booking._id },
        {
          booking: booking._id,
          user: booking.user,
          amount: Number(booking.totalCost || booking.totalAmount || 0),
          currency: 'usd',
          status: 'succeeded',
          paymentMethod: 'sandbox_simulation_card',
          stripeSessionId: sessionId,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          mode: 'simulation',
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ status: 'paid', booking, payment });
    }

    return res.status(400).json({ message: 'Invalid session ID' });
  } catch (error) {
    console.error('Verify checkout session error:', error);
    return res.status(500).json({ message: error.message || 'Failed to verify payment session' });
  }
};

/**
 * Completes a simulated payment directly from the sandbox checkout simulator UI.
 * POST /api/payments/simulate-success
 */
export const simulatePaymentSuccess = async (req, res) => {
  try {
    const { sessionId, bookingId, cardNumber, cardExpiry } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('spot');
    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this reservation' });
    }

    const totalAmount = Number(booking.totalCost || booking.totalAmount || 0);

    booking.paymentStatus = 'paid';
    booking.stripeSessionId = sessionId || `sim_cs_${Date.now()}`;
    booking.stripePaymentIntentId = `sim_pi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    booking.paidAt = new Date();
    await booking.save();

    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        booking: booking._id,
        user: booking.user,
        amount: totalAmount,
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: cardNumber ? `test_card_ending_${cardNumber.slice(-4)}` : 'sandbox_test_card',
        stripeSessionId: booking.stripeSessionId,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        receiptUrl: `https://parkingfinder-three.vercel.app/receipts/${booking._id}`,
        mode: 'simulation',
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: 'Simulated payment authorized successfully!',
      status: 'paid',
      booking,
      payment,
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    return res.status(500).json({ message: error.message || 'Failed to simulate payment' });
  }
};

/**
 * Stripe Webhook Handler with cryptographic signature verification.
 * Listens for `checkout.session.completed` and `payment_intent.succeeded`.
 * POST /api/payments/webhook
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = getStripeClient();
  let event;

  if (stripe && webhookSecret) {
    try {
      if (!req.rawBody) {
        return res.status(400).send('Webhook Error: Missing raw body buffer');
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // In local testing/mock environments without webhook secrets, parse body directly
    event = req.body;
  }

  try {
    if (event?.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId || session.client_reference_id;

      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'paid';
          booking.stripeSessionId = session.id;
          booking.stripePaymentIntentId = session.payment_intent;
          booking.paidAt = new Date();
          await booking.save();

          await Payment.findOneAndUpdate(
            { booking: booking._id },
            {
              booking: booking._id,
              user: booking.user,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'usd',
              status: 'succeeded',
              paymentMethod: 'stripe_card',
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              mode: 'test',
            },
            { upsert: true, new: true }
          );

          console.log(`[Webhook] Reservation ${bookingId} marked as paid via Stripe session ${session.id}`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ message: 'Webhook handler error' });
  }
};

/**
 * Returns payment transactions for the authenticated driver.
 * GET /api/payments/my-transactions
 */
export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find({ user: req.user._id })
      .populate({
        path: 'booking',
        populate: { path: 'spot', select: 'title address location pricePerHour' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ message: 'Failed to retrieve transactions' });
  }
};
