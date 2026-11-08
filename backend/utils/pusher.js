import Pusher from 'pusher';
import { logger } from './logger.js';

let pusherInstance = null;

/**
 * Lazy initializer for Pusher Server instance.
 * Gracefully defaults to simulation mode when environment credentials are not supplied.
 */
const getPusher = () => {
  if (pusherInstance) return pusherInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || 'mt1';

  if (appId && key && secret) {
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
    logger.info(`[Pusher] Connected to cluster: ${cluster}`);
  }

  return pusherInstance;
};

export const CHANNELS = {
  GLOBAL_MARKETPLACE: 'marketplace-spots',
  spotChannel: (spotId) => `spot-${spotId}`,
};

export const EVENTS = {
  BOOKING_CREATED: 'booking:created',
  BOOKING_CANCELLED: 'booking:cancelled',
  SPOT_UPDATED: 'spot:updated',
};

/**
 * Broadcast an event across Pusher Channels.
 * Guarantees zero unhandled exceptions: failures are safely logged and simulated.
 * @param {string} channel - Target channel name
 * @param {string} event - Event name identifier
 * @param {object} payload - Event payload data
 */
export const triggerLiveEvent = async (channel, event, payload) => {
  const pusher = getPusher();

  if (!pusher) {
    if (process.env.NODE_ENV !== 'test') {
      logger.info(`[Pusher Simulation] Channel: ${channel} | Event: ${event}`, {
        payloadKeys: Object.keys(payload || {}),
      });
    }
    return { success: true, simulated: true };
  }

  try {
    await pusher.trigger(channel, event, payload);
    logger.info(`[Pusher Broadcast] Sent ${event} to ${channel}`);
    return { success: true, simulated: false };
  } catch (error) {
    logger.warn(`[Pusher Broadcast Warning]: ${error.message}`);
    return { success: false, error: error.message };
  }
};

