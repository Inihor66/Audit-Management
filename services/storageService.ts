import { User, FormData, AdminNotification, Role, Subscription } from './types';
import { ROLE_CONFIG, CONTACT_INFO, SUBSCRIPTION_PLANS } from './constants';

const USERS_KEY = 'audit_flow_users';
const FORMS_KEY = 'audit_flow_forms';
const ADMIN_NOTIFICATIONS_KEY = 'audit_flow_admin_notifications';

// --- Generic Helpers ---
function getItem<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
}

function setItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
}

// --- User Management ---
export const getUsers = (): User[] => getItem<User[]>(USERS_KEY, []);
export const saveUsers = (users: User[]): void => setItem(USERS_KEY, users);

export const addUser = (
    newUser: Omit<User, 'id' | 'subscription' | 'notifications' | 'pendingPaymentSS' | 'emailVerified' | 'emailVerification'>
): User => {
    const users = getUsers();
    const userExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase() && u.role === newUser.role);
    if (userExists) throw new Error('An account with this email already exists for this role.');

    if (newUser.role === Role.ADMIN) {
        if (!newUser.adminCode) throw new Error('Admin code is required.');
        const adminCodeExists = users.some(u => u.role === Role.ADMIN && u.adminCode?.toLowerCase() === newUser.adminCode?.toLowerCase());
        if (adminCodeExists) throw new Error('This Admin Code is already in use.');
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
    console.info(`Admin notified: Payment screenshot from ${firm.name} stored locally.`);
};

export const updateAdminNotification = (updatedNotification: AdminNotification): void => {
    const notifications = getAdminNotifications();
    const index = notifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
        notifications[index] = updatedNotification;
        saveAdminNotifications(notifications);
    }
};

// --- Email Verification Simulation ---
export const generateEmailVerificationCode = (userId: string): string => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString();

    users[idx].emailVerification = { code, expiresAt };
    users[idx].emailVerified = false;
    saveUsers(users);

    console.info(`Simulated send to ${users[idx].email}: Your verification code is ${code}`);
    return code;
};

export const resendEmailVerificationCode = (userId: string): string => {
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

// --- Clear All Data (for testing) ---
export const clearAllData = (): void => {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(FORMS_KEY);
    localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);
    sessionStorage.removeItem('loggedInUserId');
    sessionStorage.removeItem('pendingVerificationUserId');
    sessionStorage.removeItem('pendingVerificationRole');
    console.info('Cleared all app data.');
};
