import { UserProfile } from './user';
import { ParkingSpot } from './spot';

export type CommuterPassStatus = 'active' | 'paused' | 'cancelled';

export interface CommuterPass {
  _id: string;
  user: string | UserProfile;
  spot: string | ParkingSpot;
  host: string | UserProfile;
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  durationHours: number;
  hourlyRateSnapshot: number;
  discountPercentage: number; // e.g. 15%
  dailyCost: number;
  status: CommuterPassStatus;
  lastProcessedDate?: string | Date;
  conflictCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronExecutionResult {
  passId: string;
  userEmail: string;
  spotTitle: string;
  status: 'booked' | 'skipped' | 'conflict' | 'error';
  reason?: string;
  bookingId?: string;
}

export interface CommuterCronSummary {
  success: boolean;
  targetDate: string;
  processed: number;
  summary: {
    booked: number;
    skipped: number;
    conflicts: number;
    errors: number;
  };
  results: CronExecutionResult[];
}

