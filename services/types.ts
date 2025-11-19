// ------------------------------------
// USER ROLES
// ------------------------------------
export enum Role {
  FIRM = "firm",
  STUDENT = "student",
  ADMIN = "admin",
}

// Optional string type of Role (if needed anywhere)
export type RoleType = `${Role}`;

// ------------------------------------
// USER MODEL
// ------------------------------------
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  adminCode?: string;
  emailVerified: boolean;
  emailVerification: { code: string; expiresAt: string } | null;
  subscription: Subscription | null;
  notifications: any[];
  pendingPaymentSS: string | null;
}

// ------------------------------------
// FIRM FORM MODEL
// ------------------------------------
export interface FormData {
  id: string;
  firmName: string;
  location: string;
  auditType: string;
  expectedDate: string;
  createdAt: string;
  updatedAt: string;
  adminFeesRange?: string | null;
}

// ------------------------------------
// ADMIN NOTIFICATION MODEL
// ------------------------------------
export interface AdminNotification {
  id: string;
  firmId: string;
  firmName: string;
  type: string;
  ssDataUrl: string;
  createdAt: string;
  handled: boolean;
}

// ------------------------------------
// SUBSCRIPTION MODEL
// ------------------------------------
export interface Subscription {
  status: string;
  plan: string;
  startDate: string | null;
  expiryDate: string | null;
  entriesUsed: number;
  allowedEntries: number;
}
