// services/storageService.ts
// Updated: real email sending via backend + local storage user management + verify logic

import { API_BASE_URL } from './config';

// ---------- STORAGE KEYS ----------
const USERS_KEY = "users";
const FORMS_KEY = "forms";
const ADMIN_NOTIFICATIONS_KEY = "admin_notifications";
const EMAIL_CODES_KEY = "email_codes";

// ---------- Helper Functions ----------
const getData = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setData = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ---------- USERS ----------
export const getUserById = (id: string) => {
  const users = getData(USERS_KEY);
  return users.find((u: any) => u.id === id) || null;
};

export const addUser = (user: any) => {
  const users = getData(USERS_KEY);
  // create id + default fields
  const id = `u_${Date.now()}_${Math.floor(Math.random()*9000)}`;
  const newUser = {
    id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'firm',
    adminCode: user.adminCode || null,
    emailVerified: false,
    emailVerification: null,
    subscription: null,
    notifications: [],
    pendingPaymentSS: null,
    createdAt: new Date().toISOString(),
    ...user
  };
  users.push(newUser);
  setData(USERS_KEY, users);
  return newUser;
};

export const updateUser = (updatedUser: any) => {
  const users = getData(USERS_KEY);
  const index = users.findIndex((u: any) => u.id === updatedUser.id);

  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
    setData(USERS_KEY, users);
    return users[index];
  }
  return null;
};

// ---------- FORMS ----------
export const getForms = () => getData(FORMS_KEY);
export const addForm = (form: any) => {
  const forms = getData(FORMS_KEY);
  forms.push(form);
  setData(FORMS_KEY, forms);
};
export const updateForm = (updatedForm: any) => {
  const forms = getData(FORMS_KEY);
  const index = forms.findIndex((f: any) => f.id === updatedForm.id);
  if (index !== -1) {
    forms[index] = updatedForm;
    setData(FORMS_KEY, forms);
  }
};

// ---------- ADMIN NOTIFICATIONS ----------
export const getAdminNotifications = () => getData(ADMIN_NOTIFICATIONS_KEY);
export const addAdminNotification = (notification: any) => {
  const list = getData(ADMIN_NOTIFICATIONS_KEY);
  list.push(notification);
  setData(ADMIN_NOTIFICATIONS_KEY, list);
};
export const updateAdminNotification = (updated: any) => {
  const list = getData(ADMIN_NOTIFICATIONS_KEY);
  const index = list.findIndex((n: any) => n.id === updated.id);
  if (index !== -1) {
    list[index] = updated;
    setData(ADMIN_NOTIFICATIONS_KEY, list);
  }
};

// ---------- EMAIL VERIFICATION (REAL BACKEND) ----------

/**
 * generateEmailVerificationCode
 * - creates a 6-digit code, stores locally (so Verify page can validate)
 * - calls backend endpoint to send the email
 * - returns boolean success
 */
export async function generateEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const codes = getData(EMAIL_CODES_KEY) as any[];
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // store local copy
  const index = codes.findIndex(c => c.userId === userId);
  if (index !== -1) {
    codes[index] = { userId, code, expiresAt };
  } else {
    codes.push({ userId, code, expiresAt });
  }
  setData(EMAIL_CODES_KEY, codes);

  // call backend to send actual email
  try {
    const resp = await fetch(`${API_BASE_URL}/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: user.email,
        code,
        expiresAt
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Backend email API returned error:', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to call backend email API:', err);
    return false;
  }
}

/**
 * resendEmailVerificationCode
 * - generates a fresh code, stores locally, calls backend
 */
export async function resendEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const codes = getData(EMAIL_CODES_KEY) as any[];
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const index = codes.findIndex((c: any) => c.userId === userId);
  if (index !== -1) {
    codes[index].code = newCode;
    codes[index].expiresAt = expiresAt;
  } else {
    codes.push({ userId, code: newCode, expiresAt });
  }
  setData(EMAIL_CODES_KEY, codes);

  // call backend
  try {
    const resp = await fetch(`${API_BASE_URL}/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: user.email,
        code: newCode,
        expiresAt
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Backend email API returned error (resend):', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to call backend email API (resend):', err);
    return false;
  }
}

/**
 * verifyEmailCode
 * - checks local stored code + expiry
 * - marks user.emailVerified = true and removes the code
 */
export function verifyEmailCode(userId: string, code: string) {
  const codes = getData(EMAIL_CODES_KEY) as any[];
  const entry = codes.find((c: any) => c.userId === userId);
  if (!entry) return false;
  if (entry.code !== code) return false;
  if (entry.expiresAt < Date.now()) return false;

  // remove the code
  const newCodes = codes.filter((c: any) => c.userId !== userId);
  setData(EMAIL_CODES_KEY, newCodes);

  // mark user verified
  const user = getUserById(userId);
  if (!user) return false;
  user.emailVerified = true;
  user.emailVerification = null;
  updateUser(user);
  return true;
}

// ---------- CLEAR ----------
export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(FORMS_KEY);
  localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);
  localStorage.removeItem(EMAIL_CODES_KEY);
};
