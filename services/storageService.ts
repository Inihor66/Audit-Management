import { User, FormData, AdminNotification, Role, Subscription } from '../types';
import { ROLE_CONFIG, API_BASE_URL, CONTACT_INFO } from '../constants';

const USERS_KEY = 'audit_flow_users';
const FORMS_KEY = 'audit_flow_forms';
const ADMIN_NOTIFICATIONS_KEY = 'audit_flow_admin_notifications';

// --- Generic Helpers ---
function getItem<T,>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
}

function setItem<T,>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
}

// --- User Management ---
export const getUsers = (): User[] => getItem<User[]>(USERS_KEY, []);
export const saveUsers = (users: User[]): void => setItem(USERS_KEY, users);

export const addUser = (newUser: Omit<User, 'id' | 'subscription' | 'notifications' | 'pendingPaymentSS' | 'emailVerified' | 'emailVerification'>): User => {
    const users = getUsers();
    const userExists = users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase() && user.role === newUser.role);
    if (userExists) {
        throw new Error('An account with this email already exists for the selected role.');
    }
    
    // Ensure admin codes are unique
    if (newUser.role === Role.ADMIN) {
        if (!newUser.adminCode) {
            throw new Error('Admin code is required.');
        }
        const adminCodeExists = users.some(user => user.role === Role.ADMIN && user.adminCode?.toLowerCase() === newUser.adminCode?.toLowerCase());
        if (adminCodeExists) {
            throw new Error('This Admin Code is already in use. Please choose another.');
        }
    }

    const user: User = {
        ...newUser,
        id: crypto.randomUUID(),
        pendingPaymentSS: null,
        notifications: [],
        subscription: {
            status: 'inactive',
            plan: 'free',
            startDate: null,
            expiryDate: null,
            entriesUsed: 0,
            allowedEntries: ROLE_CONFIG[newUser.role].freeEntries,
        },
        // For firms and admins require email verification; students are auto-verified
        emailVerified: newUser.role === Role.STUDENT ? true : false,
        emailVerification: null,
    };

    users.push(user);
    saveUsers(users);
    return user;
};

export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);
export const updateUser = (updatedUser: User): void => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        saveUsers(users);
    }
};


// --- Form Management ---
export const getForms = (): FormData[] => getItem<FormData[]>(FORMS_KEY, []);
export const saveForms = (forms: FormData[]): void => setItem(FORMS_KEY, forms);

export const addForm = (newForm: Omit<FormData, 'id' | 'createdAt' | 'updatedAt'>): FormData => {
    const forms = getForms();
    const now = new Date().toISOString();
    const form: FormData = {
        ...newForm,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        // ensure admin edited fee is explicitly stored (null until admin edits)
        adminFeesRange: (newForm as any).adminFeesRange ?? null,
    };
    forms.push(form);
    saveForms(forms);
    return form;
};

export const updateForm = (updatedForm: FormData): void => {
    const forms = getForms();
    const index = forms.findIndex(f => f.id === updatedForm.id);
    if (index !== -1) {
        forms[index] = {
            ...updatedForm,
            updatedAt: new Date().toISOString()
        };
        saveForms(forms);
    }
};


// --- Admin Notification Management ---
export const getAdminNotifications = (): AdminNotification[] => getItem<AdminNotification[]>(ADMIN_NOTIFICATIONS_KEY, []);
export const saveAdminNotifications = (notifications: AdminNotification[]): void => setItem(ADMIN_NOTIFICATIONS_KEY, notifications);

export const addAdminNotification = (firm: User, ssDataUrl: string): void => {
    const notifications = getAdminNotifications();
    notifications.push({
        id: crypto.randomUUID(),
        firmId: firm.id,
        firmName: firm.name,
        type: 'payment_ss',
        ssDataUrl,
        createdAt: new Date().toISOString(),
        handled: false,
    });
    saveAdminNotifications(notifications);
    // If API is available, notify backend to send an email to admin with the screenshot and a confirmation link
    if (API_BASE_URL) {
        try {
            const notification = notifications[notifications.length - 1];
            const confirmationUrl = (typeof window !== 'undefined' ? window.location.origin : '') + `/confirm-subscription?firmId=${encodeURIComponent(firm.id)}&notificationId=${encodeURIComponent(notification.id)}`;
            // Fire-and-forget POST to backend API
            (async () => {
                try {
                    await fetch(`${API_BASE_URL}/admin/notify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            firmId: firm.id,
                            firmName: firm.name,
                            ssDataUrl,
                            to: CONTACT_INFO.email,
                            confirmationUrl,
                        }),
                    });
                } catch (err) {
                    console.error('Failed to call API admin/notify:', err);
                }
            })();
        } catch (err) {
            console.error('Error preparing admin notify API call:', err);
        }
    }
};

export const updateAdminNotification = (updatedNotification: AdminNotification): void => {
    const notifications = getAdminNotifications();
    const index = notifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
        notifications[index] = updatedNotification;
        saveAdminNotifications(notifications);
    }
};

// --- Email verification helpers (simulation) ---
export const generateEmailVerificationCode = (userId: string): string => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString(); // 15 minutes
    users[idx].emailVerification = { code, expiresAt };
    // Simulate sending email by logging to console (replace with real email service)
    console.info(`Simulated send to ${users[idx].email}: Your verification code is ${code}`);
    saveUsers(users);

    // If API is configured, request backend to send the verification email (fire-and-forget)
    if (API_BASE_URL) {
        (async () => {
            try {
                await fetch(`${API_BASE_URL}/email/send-verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, email: users[idx].email, code, expiresAt }),
                });
            } catch (err) {
                console.error('Failed to call API email/send-verification:', err);
            }
        })();
    }
    return code;
};

export const resendEmailVerificationCode = (userId: string): string => {
    // Simply regenerate and "send" again
    return generateEmailVerificationCode(userId);
};

export const verifyEmailCode = (userId: string, code: string): boolean => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const v = users[idx].emailVerification;
    if (!v) return false;
    if (v.code !== code) return false;
    if (new Date() > new Date(v.expiresAt)) return false;
    users[idx].emailVerified = true;
    users[idx].emailVerification = null;
    saveUsers(users);
    return true;
};

// Clear all stored data (users, forms, admin notifications) and relevant session keys.
// This is a destructive operation intended for development/testing only.
export const clearAllData = (): void => {
    try {
        localStorage.removeItem(USERS_KEY);
        localStorage.removeItem(FORMS_KEY);
        localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);
        // remove any other known keys
        try { localStorage.removeItem('audit_flow_settings'); } catch (e) {}
        // Clear session keys used for authentication/verification
        try { sessionStorage.removeItem('loggedInUserId'); } catch (e) {}
        try { sessionStorage.removeItem('pendingVerificationUserId'); } catch (e) {}
        try { sessionStorage.removeItem('pendingVerificationRole'); } catch (e) {}
        console.info('Cleared app stored data (users, forms, admin notifications).');
    } catch (error) {
        console.error('Error clearing stored data:', error);
    }
};