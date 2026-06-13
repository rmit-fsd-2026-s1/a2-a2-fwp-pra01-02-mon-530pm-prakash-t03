/**
 * VENUE VENDORS CLIENT APP - INDEX.TS
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

export type UserRole = 'hirer' | 'vendor' | 'admin';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type SortMode = 'date' | 'reputation';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Venue {
  id: string;
  vendorId: string;
  name: string;
  location: string;
  capacity: number;
  suitability: string[];
  description: string;
  imageUrl: string;
  pricePerHour: number;
  isBlocked: boolean;
  isFeatured?: boolean;
  blockedFrom?: string;
  blockedUntil?: string;
  blockReason?: string;
}

export interface Application {
  id: string;
  hirerId: string;
  hirerName: string;
  hirerEmail: string;
  venueId: string;
  venueName: string;
  venueLocation: string;
  eventName: string;
  guestCount: number;
  eventDate: string;
  eventTime: string;
  durationHours: number;
  status: ApplicationStatus;
  vendorComment: string;
  submittedAt: string;
  approvedAt?: string;
}

export interface VenueRanking {
  hirerId: string;
  rankings: Array<{ venueId: string; rank: number; venueName: string }>;
}

export interface HireHistory {
  id: string;
  hirerId: string;
  hirerName: string;
  vendorId: string;
  venueId: string;
  venueName: string;
  venueLocation: string;
  eventName: string;
  dateOfHire: string;
  rating: number; // 0–5 stars given by vendor
}

export interface HirerDocuments {
  hirerId: string;
  driverLicenseName?: string;
  driverLicenseData?: string; // base64
  publicLiabilityName?: string;
  publicLiabilityData?: string; // base64
  isBusinessApplicant: boolean;
  abn?: string;
  businessCertName?: string;
  businessCertData?: string; // base64
  credibilityScore: number; // 0–5 auto-calculated
}

export interface VendorComment {
  id: string;
  vendorId: string;
  hirerId: string;
  applicationId: string;
  comment: string;
  createdAt: string;
}

export interface StorageKeys {
  USERS: 'vv_users';
  VENUES: 'vv_venues';
  APPLICATIONS: 'vv_applications';
  RANKINGS: 'vv_rankings';
  HIRE_HISTORY: 'vv_hire_history';
  DOCUMENTS: 'vv_documents';
  CURRENT_USER: 'vv_current_user';
  VENDOR_COMMENTS: 'vv_vendor_comments';
  SEEDED: 'vv_seeded';
}
