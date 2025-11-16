export type Role = 'student' | 'firm' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
    adminCode?: string;
    emailVerified: boolean;
    emailVerification: { code: string; expiresAt: string } | null;
    subscription: any;
    notifications: any[];
    pendingPaymentSS: string | null;
}

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

export interface AdminNotification {
    id: string;
    firmId: string;
    firmName: string;
    type: string;
    ssDataUrl: string;
    createdAt: string;
    handled: boolean;
}

export interface Subscription {
    status: string;
    plan: string;
    startDate: string | null;
    expiryDate: string | null;
    entriesUsed: number;
    allowedEntries: number;
}
