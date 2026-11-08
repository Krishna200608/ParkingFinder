import Pusher from 'pusher-js';

let pusherClient = null;

/**
 * Returns a singleton instance of Pusher Client.
 * Gracefully returns null if VITE_PUSHER_KEY is not defined.
 */
export const getPusherClient = () => {
  if (pusherClient) return pusherClient;

  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

  if (!key) {
    return null;
  }

  pusherClient = new Pusher(key, {
    cluster,
    forceTLS: true,
  });

  return pusherClient;
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

