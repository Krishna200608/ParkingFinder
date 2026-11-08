export interface PlatformFinancials {
  gmv: number;
  platformTakeRate: number; // 0.05 (5%)
  platformRevenue: number;  // GMV * 0.05
  hostLiabilities: number;  // GMV * 0.95
}

export interface PlatformMetrics {
  totalUsers: number;
  totalSpots: number;
  activeSpots: number;
  suspendedSpots: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  activeCommuterPasses: number;
  financials: PlatformFinancials;
}

export interface UserDirectoryItem {
  _id: string;
  username: string;
  email: string;
  role: 'driver' | 'host' | 'admin';
  phone?: string;
  createdAt: string;
}
