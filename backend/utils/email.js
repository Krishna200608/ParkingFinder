import { Resend } from 'resend';
import { logger } from './logger.js';

let resendClient = null;

const getResendClient = () => {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey.startsWith('re_')) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'ParkingFinder <notifications@parkingfinder.dev>';

/**
 * Dispatches an email via Resend or logs simulation details in development / test environments.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResendClient();

  if (!client) {
    logger.info(`[Email Simulation] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      logger.warn(`[Resend Error]: ${error.message}`);
      return { success: false, error: error.message };
    }

    logger.info(`[Email Sent] Message ID: ${data?.id} to ${to}`);
    return { success: true, id: data?.id };
  } catch (err) {
    logger.error(`[Email Delivery Failed]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a booking confirmation email to the driver.
 */
export const sendBookingConfirmationEmail = async ({
  to,
  driverName,
  spotTitle,
  address,
  startTime,
  endTime,
  totalCost,
  bookingId,
}) => {
  if (!to) return;

  const startFormatted = new Date(startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const endFormatted = new Date(endTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const subject = `Reservation Confirmed: ${spotTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0F172A; border: 1px solid #E2E8F0; rounded: 8px;">
      <div style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0F172A; font-size: 20px;">ParkingFinder Reservation Confirmed</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.5;">Hello ${driverName || 'Driver'},</p>
      <p style="font-size: 14px; line-height: 1.5;">Your parking bay has been reserved with guaranteed concurrency protection.</p>
      
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Location:</strong> ${spotTitle}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Address:</strong> ${address}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Start:</strong> ${startFormatted}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>End:</strong> ${endFormatted}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Total Paid:</strong> $${Number(totalCost).toFixed(2)}</p>
        <p style="margin: 0; font-size: 12px; color: #64748B;"><strong>Booking Reference:</strong> ${bookingId}</p>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">Thank you for using ParkingFinder. Safe travels!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your reservation at ${spotTitle} is confirmed. Start: ${startFormatted}, End: ${endFormatted}. Total: $${totalCost}`,
  });
};

/**
 * Sends a notification email to the host when a driver books their spot.
 */
export const sendHostBookingNotificationEmail = async ({
  to,
  hostName,
  spotTitle,
  driverName,
  startTime,
  endTime,
  totalEarnings,
}) => {
  if (!to) return;

  const startFormatted = new Date(startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const endFormatted = new Date(endTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const subject = `New Reservation on Your Space: ${spotTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0F172A; border: 1px solid #E2E8F0; rounded: 8px;">
      <div style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0F172A; font-size: 20px;">New Driver Booking Received</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.5;">Hello ${hostName || 'Host'},</p>
      <p style="font-size: 14px; line-height: 1.5;">A driver (${driverName || 'Verified Driver'}) has booked a window at your parking space.</p>
      
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Space:</strong> ${spotTitle}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Arrival Window:</strong> ${startFormatted}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Departure Window:</strong> ${endFormatted}</p>
        <p style="margin: 0; font-size: 13px;"><strong>Gross Payout:</strong> $${Number(totalEarnings).toFixed(2)}</p>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">View and manage your incoming reservations in the Host Dashboard.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `New reservation at ${spotTitle} from ${driverName}. Window: ${startFormatted} to ${endFormatted}.`,
  });
};

/**
 * Sends a cancellation notification email.
 */
export const sendCancellationEmail = async ({
  to,
  recipientName,
  spotTitle,
  startTime,
  endTime,
  reason,
}) => {
  if (!to) return;

  const startFormatted = new Date(startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const endFormatted = new Date(endTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const subject = `Reservation Cancelled: ${spotTitle}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0F172A; border: 1px solid #E2E8F0; rounded: 8px;">
      <div style="border-bottom: 2px solid #EF4444; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0F172A; font-size: 20px;">Reservation Cancelled</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.5;">Hello ${recipientName || 'Member'},</p>
      <p style="font-size: 14px; line-height: 1.5;">The reservation for <strong>${spotTitle}</strong> has been cancelled.</p>
      
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Original Window:</strong> ${startFormatted} – ${endFormatted}</p>
        <p style="margin: 0; font-size: 13px;"><strong>Reason:</strong> ${reason || 'Cancelled by user'}</p>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">ParkingFinder Support</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your reservation for ${spotTitle} has been cancelled.`,
  });
};

