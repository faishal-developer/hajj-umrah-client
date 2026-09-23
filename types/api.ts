// TypeScript definitions for Hajj & Umrah Platform API
// Aligned with NestJS backend OpenAPI schema

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
}

export type Role = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export type PackageType = 'HAJJ' | 'RAMADAN_UMRAH' | 'OFF_SEASON_UMRAH' | 'ZIYARAH';
export type PackageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface PackageTier {
  id: string;
  packageId?: string;
  name: string;
  price: number;
  quota: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats?: number;
  version?: number;
}

export interface Package {
  id: string;
  name: string;
  type: PackageType;
  description: string;
  departureDate: string;
  bookingStartDate: string;
  bookingEndDate: string;
  status: PackageStatus;
  version?: number;
  tiers: PackageTier[];
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus =
  | 'HELD'
  | 'PENDING_PAYMENT'
  | 'PARTIALLY_PAID'
  | 'CONFIRMED'
  | 'DEFAULTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export type PaymentMode = 'FULL' | 'INSTALLMENT';

export interface Pilgrim {
  id: string;
  bookingId?: string;
  fullName: string;
  passportNumber: string;
  nationality?: string;
  dateOfBirth?: string;
  passportExpiry?: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface Booking {
  id: string;
  userId: string;
  packageId: string;
  tierId: string;
  status: BookingStatus;
  paymentMode: PaymentMode;
  tierNameSnapshot: string;
  unitPriceSnapshot: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  expiresAt: string;
  version?: number;
  package?: Package;
  tier?: PackageTier;
  pilgrims: Pilgrim[];
  installments?: Installment[];
  createdAt: string;
  updatedAt?: string;
}

export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface Installment {
  id: string;
  bookingId: string;
  sequence: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  graceEndDate?: string;
  status: InstallmentStatus;
}

export type PaymentProvider = 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'STRIPE' | 'MANUAL';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentInitiateResponse {
  paymentId: string;
  gatewayTransactionId: string;
  redirectUrl: string;
  amount: number;
  currency: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  method?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  createdAt: string;
}

export type CancellationStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Cancellation {
  id: string;
  bookingId: string;
  pilgrimId?: string;
  reason: string;
  cancellationFee?: number;
  status: CancellationStatus;
  createdAt: string;
}
