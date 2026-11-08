export type RealtimeEvent =
  | 'booking:created'
  | 'booking:cancelled'
  | 'spot:updated'
  | 'commuter:renewed';

export interface BookingCreatedPayload {
  spotId: string;
  bookingId: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
}

export interface BookingCancelledPayload {
  spotId: string;
  bookingId: string;
  status: string;
}

export interface SpotUpdatedPayload {
  spotId: string;
  isAvailable?: boolean;
  status?: string;
  moderatedByAdmin?: boolean;
}

export interface GlobalMarketplacePayload {
  spotId: string;
  action: 'reserved' | 'released' | 'status_change';
}

