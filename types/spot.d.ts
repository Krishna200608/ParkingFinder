import { UserProfile } from './user';

export type VehicleSizeCompatibility = 'compact' | 'standard' | 'large' | 'oversized';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface SpotReview {
  _id: string;
  user: string | UserProfile;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface ParkingSpot {
  _id: string;
  title: string;
  description: string;
  address: string;
  location: GeoLocation;
  pricePerHour: number;
  totalSpots: number;
  availableSpots?: number;
  isAvailable: boolean;
  owner: string | UserProfile;
  amenities?: string[];
  vehicleSize?: VehicleSizeCompatibility;
  images?: string[];
  reviews?: SpotReview[];
  averageRating?: number;
  ratingCount?: number;
  distanceKm?: number;
  bookingSequence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpotPaginationEnvelope {
  spots: ParkingSpot[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}
