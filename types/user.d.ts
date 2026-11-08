export type UserRole = 'driver' | 'host' | 'admin';

export interface VehicleInfo {
  make?: string;
  model?: string;
  plate?: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  vehicle?: VehicleInfo;
  favorites?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: UserProfile;
  token?: string;
}

