
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
  isVerified: boolean; // Email verification status
  verificationCode?: string; // 6-digit code for verification
  location?: string;
  phone?: string;
  aadhar?: string;
  adminCode?: string; // Unique code for admins to link with firms
  subscription: Subscription;
  pendingPaymentSS: string | null; // Data URL of the screenshot
  // New fields for Auto-Unlock feature
  paymentRequestDate?: string; // ISO Date string when they clicked "Notify Admin"
  pendingPlanKey?: 'monthly' | 'six_month' | 'yearly'; // The plan they are trying to buy
  notifications: Notification[];
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
  phone?: string;
  aadhar?: string;
  remarks: string;
  submittedAt: string;
}

export interface FormData {
  id: string;
  createdByUserId: string;
  firmName: string;
  location: string;
  expectedDate: string;
  adminCode: string;
  feesRange: string; // Pre-edit payment
  postEditFees: string | null; // Post-edit payment, set by admin
  paymentTerm: '15_days' | '30_days' | '45_days' | 'advance';
  preEditTerms: string; // Pre-edit Terms & Conditions, set by firm
  postEditTerms: string | null; // Post-edit T&C, set by admin
  paymentReminder: boolean;
  reminderNotified: boolean; // Tracks if a payment reminder has been issued
  isApproved: boolean;
  finalFees: number | null;
  studentSubmission: StudentSubmission | null;
  createdAt: string;
  deleted: boolean;
  entryCounted: boolean; // Replaces deletedCounted
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
