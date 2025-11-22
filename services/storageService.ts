import { API_BASE_URL } from "../constants";

const USERS_KEY = "audit_users";
const CURRENT_USER_KEY = "current_user";
const EMAIL_OTP_KEY = "email_otp";

// ---------------- USERS ----------------

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function getUserById(id: string) {
  return getUsers().find((u: any) => u.id === id);
}

export function updateUser(updatedUser: any) {
  const users = getUsers().map((u: any) =>
    u.id === updatedUser.id ? updatedUser : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(user: any) {
  if (!user.id) {
    user.id = crypto.randomUUID();
  }

  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return user;
}

export function setCurrentUser(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

export function getCurrentUser() {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  return id ? getUserById(id) : null;
}

// ---------------- OTP GENERATION ----------------

export async function generateEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  // save otp local for verify page
  localStorage.setItem(
    EMAIL_OTP_KEY,
    JSON.stringify({ userId, otp, expiresAt })
  );

  try {
    const resp = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        code: otp,
      }),
    });

    return resp.ok;
  } catch (err) {
    console.error("Send OTP FAILED:", err);
    return false;
  }
}

// ---------------- OTP VERIFY ----------------

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
// ---------------- LOGIN ----------------

// Get user by email
export function getUserByEmail(email: string) {
  return getUsers().find((u: any) => u.email === email);
}

// Login user
export function loginUser(email: string, password: string) {
  const user = getUserByEmail(email);

  if (!user) return null;
  if (user.passwordHash !== password) return null;

  setCurrentUser(user.id);
  return user;
}
