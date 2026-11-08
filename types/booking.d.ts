import { UserProfile } from './user';
import { ParkingSpot } from './spot';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid_demo' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface BookingCancellationAudit {
  cancelledAt: string;
  cancelledBy: string | UserProfile;
  reason?: string;
}

export interface Booking {
  _id: string;
  user: string | UserProfile;
  spot: string | ParkingSpot;
  host: string | UserProfile;
  startTime: string | Date;
  endTime: string | Date;
  durationHours: number;
  pricePerHourSnapshot: number;
  totalCost: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  notes?: string;
  cancellation?: BookingCancellationAudit;
  createdAt: string;
  updatedAt: string;
}

export interface BookedInterval {
  start: string;
  end: string;
  bookingId?: string;
}

