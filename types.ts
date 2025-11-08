export enum Role {
  FIRM = 'FIRM',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export interface Subscription {
  status: 'active' | 'inactive' | 'pending';
  plan: 'monthly' | 'six_month' | 'yearly' | 'free' | null;
  startDate: string | null;
  expiryDate: string | null;
  entriesUsed: number;
  allowedEntries: number | 'infinity';
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  passwordHash: string; // Storing plain password in localStorage is insecure, this is a simulation
  location?: string;
  phone?: string;
  aadhar?: string;
  adminCode?: string; // Unique code for admins
  subscription: Subscription;
  pendingPaymentSS: string | null; // Data URL of the screenshot
  notifications: Notification[];

  // Email verification
  emailVerified?: boolean;
  emailVerification?: {
    code: string;
    expiresAt: string; // ISO string
  } | null;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentAadhar?: string;
  remarks?: string;
  submittedAt: string;
}

export interface FormData {
  id: string;
  createdByUserId: string;
  firmName: string;
  location: string;
  expectedDate: string;
  adminCode: string[]; // Can be sent to multiple admins
  // Fees entered by the firm (pre-edit) and fees edited by admin (post-edit)
  firmFeesRange: string;
  adminFeesRange?: string | null;
  paymentTerm: '15_days' | '30_days' | '45_days' | 'advance';
  paymentReminder: boolean;
  isApproved: boolean;
  finalFees: number | null;
  studentSubmission: StudentSubmission | null;
  createdAt: string;
  updatedAt?: string;
  deleted: boolean;
  deletedCounted: boolean; // To ensure a deleted form is only counted once towards the limit
}

export interface AdminNotification {
  id: string;
  firmId: string;
  firmName: string;
  type: 'payment_ss';
  ssDataUrl: string;
  createdAt: string;
  handled: boolean;
}

export interface SubscriptionPlan {
  key: 'monthly' | 'six_month' | 'yearly';
  name: string;
  price: number;
  duration_months: number;
}