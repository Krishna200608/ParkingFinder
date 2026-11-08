import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getPusherClient, CHANNELS, EVENTS } from '../utils/pusherClient';

/**
 * Custom hook to subscribe to live Pusher events for a specific parking spot.
 * Automatically synchronizes calendar occupied intervals and availability status.
 *
 * @param {string} spotId - Parking spot ObjectId
 * @param {object} callbacks - Optional event listeners
 * @param {function} callbacks.onBookingCreated - Fired when another user commits a reservation
 * @param {function} callbacks.onBookingCancelled - Fired when a reservation is released
 * @param {function} callbacks.onSpotUpdated - Fired when spot availability is toggled
 */
export function useRealtimeSpot(spotId, callbacks = {}) {
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!spotId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      // Pusher credentials not configured in local environment; graceful bypass
      setIsLiveConnected(false);
      return;
    }

    const channelName = CHANNELS.spotChannel(spotId);
    const channel = pusher.subscribe(channelName);
    setIsLiveConnected(true);

    // 1. Listen for new reservation commits on this spot
    channel.bind(EVENTS.BOOKING_CREATED, (data) => {
      if (callbacksRef.current.onBookingCreated) {
        callbacksRef.current.onBookingCreated(data);
      }
      toast.success('Live update: A reservation was just booked on this bay.', {
        id: `booking-${data.bookingId}`,
        duration: 3500,
      });
    });

    // 2. Listen for reservation cancellations (released slots)
    channel.bind(EVENTS.BOOKING_CANCELLED, (data) => {
      if (callbacksRef.current.onBookingCancelled) {
        callbacksRef.current.onBookingCancelled(data);
      }
      toast.success('Live update: A previously reserved slot was just released.', {
        id: `cancelled-${data.bookingId}`,
        duration: 3500,
      });
    });

    // 3. Listen for spot availability/moderation updates
    channel.bind(EVENTS.SPOT_UPDATED, (data) => {
      if (callbacksRef.current.onSpotUpdated) {
        callbacksRef.current.onSpotUpdated(data);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsLiveConnected(false);
    };
  }, [spotId]);

  return { isLiveConnected };
}

export default useRealtimeSpot;
