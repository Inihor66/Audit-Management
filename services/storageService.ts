import { User, FormData, AdminNotification, Role } from './types';
import { ROLE_CONFIG } from './constants';

const USERS_KEY = 'audit_flow_users';
const FORMS_KEY = 'audit_flow_forms';
const ADMIN_NOTIFICATIONS_KEY = 'audit_flow_admin_notifications';

// --- Generic Helpers ---
function getItem(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
}

function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
}

// --- User Management ---
export const getUsers = () => getItem(USERS_KEY, []);
export const saveUsers = (users) => setItem(USERS_KEY, users);

export const addUser = (newUser) => {
    const users = getUsers();

    // check duplicate email-role
    const userExists = users.some(
        (u) =>
            u.email.toLowerCase() === newUser.email.toLowerCase() &&
            u.role === newUser.role
    );
    if (userExists) throw new Error('An account with this email already exists for this role.');

    // Admin code validation
    if (newUser.role === Role.ADMIN) {
        if (!newUser.adminCode) throw new Error('Admin code is required.');

        const adminCodeExists = users.some(
            (u) =>
                u.role === Role.ADMIN &&
                u.adminCode?.toLowerCase() === newUser.adminCode?.toLowerCase()
        );
        if (adminCodeExists) throw new Error('This Admin Code is already in use.');
    }

    // FINAL FIX — freeEntries added
    const user = {
        ...newUser,
        id: crypto.randomUUID(),

        freeEntries: 0,    // ⭐ FIXED ERROR (Guarantees field exists) ⭐

        pendingPaymentSS: null,
        notifications: [],

        subscription: {
            status: 'inactive',
            plan: 'free',
            startDate: null,
            expiryDate: null,
            entriesUsed: 0,
            allowedEntries: 0,
        },

        emailVerified: newUser.role === Role.STUDENT ? true : false,
        emailVerification: null,
    };

    users.push(user);
    saveUsers(users);
    return user;
};

// get / update user
export const getUserById = (id) => getUsers().find((u) => u.id === id);

export const updateUser = (updatedUser) => {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        saveUsers(users);
    }
};

// --- Form Management ---
export const getForms = () => getItem(FORMS_KEY, []);
export const saveForms = (forms) => setItem(FORMS_KEY, forms);

export const addForm = (newForm) => {
    const forms = getForms();
    const now = new Date().toISOString();

    const form = {
        ...newForm,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        adminFeesRange: newForm.adminFeesRange ?? null,
    };

    forms.push(form);
    saveForms(forms);
    return form;
};

export const updateForm = (updatedForm) => {
    const forms = getForms();
    const index = forms.findIndex((f) => f.id === updatedForm.id);

    if (index !== -1) {
        forms[index] = {
            ...updatedForm,
            updatedAt: new Date().toISOString(),
        };
        saveForms(forms);
    }
};

// --- Admin Notification Management ---
export const getAdminNotifications = () => getItem(ADMIN_NOTIFICATIONS_KEY, []);
export const saveAdminNotifications = (n) => setItem(ADMIN_NOTIFICATIONS_KEY, n);

export const addAdminNotification = (firm, ssDataUrl) => {
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

export const updateAdminNotification = (updatedNotification) => {
    const notifications = getAdminNotifications();
    const index = notifications.findIndex((n) => n.id === updatedNotification.id);

    if (index !== -1) {
        notifications[index] = updatedNotification;
        saveAdminNotifications(notifications);
    }
};

// --- Email Verification Simulation ---
export const generateEmailVerificationCode = (userId) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    users[idx].emailVerification = { code, expiresAt };
    users[idx].emailVerified = false;
    saveUsers(users);

    console.info(`Verification code for ${users[idx].email}: ${code}`);

    return code;
};

export const resendEmailVerificationCode = (userId) =>
    generateEmailVerificationCode(userId);

export const verifyEmailCode = (userId, code) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
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

// --- Utility: Clear all data ---
export const clearAllData = () => {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(FORMS_KEY);
    localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);

    sessionStorage.removeItem('loggedInUserId');
    sessionStorage.removeItem('pendingVerificationUserId');
    sessionStorage.removeItem('pendingVerificationRole');

    console.info('All app data cleared.');
};
