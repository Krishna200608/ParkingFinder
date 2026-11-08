export * from './user';
export * from './spot';
export * from './booking';
export * from './commuter';
export * from './admin';
export * from './realtime';

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
  success?: boolean;
}
