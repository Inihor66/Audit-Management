import { User, FormData, AdminNotification, Role, Subscription } from '../types';
import { ROLE_CONFIG } from '../constants';

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
        id: crypto.randomUUID(),
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


// --- Form Management ---
export const getForms = (): FormData[] => getItem<FormData[]>(FORMS_KEY, []);
export const saveForms = (forms: FormData[]): void => setItem(FORMS_KEY, forms);

export const addForm = (newForm: Omit<FormData, 'id' | 'createdAt' | 'postEditFees' | 'postEditTerms' | 'reminderNotified'>): FormData => {
    const forms = getForms();
    const form: FormData = {
        ...newForm,
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
