
import { User, FormData, AdminNotification, Role, Subscription, SubscriptionPlan } from '../types';
import { ROLE_CONFIG, SUBSCRIPTION_PLANS } from '../constants';

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

// Safe ID Generator
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- User Management ---
export const getUsers = (): User[] => getItem<User[]>(USERS_KEY, []);
export const saveUsers = (users: User[]): void => setItem(USERS_KEY, users);

export const addUser = (newUser: Omit<User, 'id' | 'subscription' | 'notifications' | 'pendingPaymentSS' | 'isVerified' | 'verificationCode'>): User => {
    const users = getUsers();
    const userExists = users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase() && user.role === newUser.role);
    if (userExists) {
        throw new Error('An account with this email already exists for the selected role.');
    }

    // Validate admin code uniqueness if the role is ADMIN
    if (newUser.role === Role.ADMIN) {
        if (!newUser.adminCode || newUser.adminCode.trim().length === 0) {
            throw new Error('Admin Code is required.');
        }
        const adminCodeExists = users.some(user => 
            user.role === Role.ADMIN && 
            user.adminCode?.trim().toLowerCase() === newUser.adminCode?.trim().toLowerCase()
        );
        if (adminCodeExists) {
            throw new Error('This Admin Code is already in use. Please choose another one.');
        }
    }
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user: User = {
        ...newUser,
        id: generateId(),
        pendingPaymentSS: null,
        notifications: [],
        isVerified: false, // Require email verification
        verificationCode: verificationCode, // Assign verification code
        subscription: {
            status: 'inactive',
            plan: 'free',
            startDate: null,
            expiryDate: null,
            entriesUsed: 0,
            allowedEntries: ROLE_CONFIG[newUser.role].freeEntries,
        },
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

export const markNotificationAsRead = (userId: string, notificationId: string): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].notifications = users[userIndex].notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        );
        saveUsers(users);
    }
};

// --- Subscription Logic (Auto-Unlock & Expiry) ---
export const processSubscriptionRules = (): void => {
    const users = getUsers();
    const now = new Date();
    let changed = false;

    users.forEach(user => {
        // 1. Auto-Unlock Logic (If pending > 2 hours)
        if (user.subscription.status === 'pending' && user.paymentRequestDate && user.pendingPlanKey) {
            const requestTime = new Date(user.paymentRequestDate);
            const diffMs = now.getTime() - requestTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours >= 2) {
                // Determine Plan Details
                const planDetails = SUBSCRIPTION_PLANS.find(p => p.key === user.pendingPlanKey);
                if (planDetails) {
                    const startDate = new Date();
                    const expiryDate = new Date();
                    expiryDate.setMonth(startDate.getMonth() + planDetails.duration_months);

                    user.subscription = {
                        ...user.subscription,
                        status: 'active',
                        plan: user.pendingPlanKey,
                        startDate: startDate.toISOString(),
                        expiryDate: expiryDate.toISOString(),
                        allowedEntries: 'infinity',
                    };
                    user.pendingPaymentSS = null;
                    user.pendingPlanKey = undefined; // Clear pending
                    user.paymentRequestDate = undefined;
                    
                    user.notifications.push({
                        id: generateId(),
                        message: `System Auto-Approval: Your ${planDetails.name} subscription is now active!`,
                        type: 'success',
                        read: false,
                        createdAt: now.toISOString(),
                    });
                    
                    changed = true;
                    console.log(`[System] Auto-approved subscription for user: ${user.email}`);
                }
            }
        }

        // 2. Expiration Logic
        if (user.subscription.status === 'active' && user.subscription.expiryDate) {
            const expiryTime = new Date(user.subscription.expiryDate);
            if (now > expiryTime) {
                // Per user request: "after the expriy the subcription additional feature should be locked"
                
                user.subscription = {
                    status: 'inactive', // Mark as inactive (expired)
                    plan: 'free', 
                    startDate: null,
                    expiryDate: null,
                    entriesUsed: user.subscription.entriesUsed,
                    allowedEntries: ROLE_CONFIG[user.role].freeEntries, // Revert to free limits (Locked)
                };
                
                user.notifications.push({
                    id: generateId(),
                    message: `Your subscription has expired. Premium features are now locked and entry limits apply. Please renew to continue enjoying unlimited access.`,
                    type: 'warning',
                    read: false,
                    createdAt: now.toISOString(),
                });

                changed = true;
                console.log(`[System] Expired subscription and locked features for user: ${user.email}`);
            }
        }
    });

    if (changed) {
        saveUsers(users);
    }
};

// --- Form Management ---
export const getForms = (): FormData[] => getItem<FormData[]>(FORMS_KEY, []);
export const saveForms = (forms: FormData[]): void => setItem(FORMS_KEY, forms);

export const addForm = (newForm: Omit<FormData, 'id' | 'createdAt' | 'postEditFees' | 'postEditTerms' | 'reminderNotified'>): FormData => {
    const forms = getForms();
    const form: FormData = {
        ...newForm,
        id: generateId(),
        createdAt: new Date().toISOString(),
        postEditFees: null,
        postEditTerms: null,
        reminderNotified: false,
    };
    forms.push(form);
    saveForms(forms);
    return form;
};

export const getFormById = (id: string): FormData | undefined => getForms().find(f => f.id === id);

export const updateForm = (updatedForm: FormData): void => {
    const forms = getForms();
    const index = forms.findIndex(f => f.id === updatedForm.id);
    if (index !== -1) {
        forms[index] = updatedForm;
        saveForms(forms);
    }
};


// --- Admin Notification Management ---
export const getAdminNotifications = (): AdminNotification[] => getItem<AdminNotification[]>(ADMIN_NOTIFICATIONS_KEY, []);
export const saveAdminNotifications = (notifications: AdminNotification[]): void => setItem(ADMIN_NOTIFICATIONS_KEY, notifications);

export const addAdminNotification = (firm: User, ssDataUrl: string): void => {
    const notifications = getAdminNotifications();
    notifications.push({
        id: generateId(),
        firmId: firm.id,
        firmName: firm.name,
        type: 'payment_ss',
        ssDataUrl,
        createdAt: new Date().toISOString(),
        handled: false,
    });
    saveAdminNotifications(notifications);
};

export const updateAdminNotification = (updatedNotification: AdminNotification): void => {
    const notifications = getAdminNotifications();
    const index = notifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
        notifications[index] = updatedNotification;
        saveAdminNotifications(notifications);
    }
};
