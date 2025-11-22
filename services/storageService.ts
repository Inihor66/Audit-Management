// services/storageService.ts
// Updated: OTP via backend + Local Storage user management

import { API_BASE_URL } from "./config";

// ---------- STORAGE KEYS ----------
const USERS_KEY = "users";
const FORMS_KEY = "forms";
const ADMIN_NOTIFICATIONS_KEY = "admin_notifications";
const EMAIL_OTP_KEY = "email_otp";

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

  const id = `u_${Date.now()}_${Math.floor(Math.random() * 9000)}`;

  const newUser = {
    id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "firm",
    adminCode: user.adminCode || null,
    emailVerified: false,
    subscription: null,
    notifications: [],
    pendingPaymentSS: null,
    createdAt: new Date().toISOString(),
    ...user,
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

// ------------------------------------
// OTP EMAIL via BACKEND (SendGrid)
// ------------------------------------

export async function generateEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  localStorage.setItem(
    EMAIL_OTP_KEY,
    JSON.stringify({ userId, otp, expiresAt })
  );

  try {
    const resp = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, otp }),
    });

    if (!resp.ok) {
      console.error("OTP backend error");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to send OTP:", err);
    return false;
  }
}

export function verifyEmailCode(userId: string, enteredOtp: string) {
  const stored = JSON.parse(localStorage.getItem(EMAIL_OTP_KEY) || "null");

  if (!stored) return false;
  if (stored.userId !== userId) return false;
  if (stored.otp !== enteredOtp) return false;
  if (stored.expiresAt < Date.now()) return false;

  localStorage.removeItem(EMAIL_OTP_KEY);

  const user = getUserById(userId);
  if (!user) return false;

  user.emailVerified = true;
  updateUser(user);

  return true;
}

// ---------- CLEAR ----------
export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(FORMS_KEY);
  localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);
  localStorage.removeItem(EMAIL_OTP_KEY);
};
