// services/storageService.ts

import { v4 as uuidv4 } from "uuid";

// ---------- Local Storage Keys ----------
const USERS_KEY = "audit_users";
const CURRENT_USER_KEY = "current_user";
const EMAIL_OTP_KEY = "email_otp";

// ---------- USER HELPERS ----------

// Get all users
export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

// Save all users
function saveUsers(users: any[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Add new user
export function addUser(user: any) {
  const users = getUsers();
  const newUser = {
    ...user,
    id: uuidv4(),
    emailVerified: false,
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
}

// Get user by ID
export function getUserById(id: string) {
  return getUsers().find((u: any) => u.id === id);
}

// Update user
export function updateUser(updatedUser: any) {
  const users = getUsers().map((u: any) =>
    u.id === updatedUser.id ? updatedUser : u
  );
  saveUsers(users);
}

// Set current logged in user
export function setCurrentUser(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

// Get logged in user
export function getCurrentUser() {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  return id ? getUserById(id) : null;
}

// ---------- OTP GENERATION ----------

export function generateEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error("User Not Found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  // save OTP locally
  localStorage.setItem(
    EMAIL_OTP_KEY,
    JSON.stringify({
      userId,
      code: otp,
      expiresAt,
    })
  );

  return { code: otp, expiresAt };
}

// ---------- OTP VERIFY ----------

export function verifyEmailCode(userId: string, enteredOtp: string) {
  const stored = JSON.parse(localStorage.getItem(EMAIL_OTP_KEY) || "null");
  if (!stored) return false;
  if (stored.userId !== userId) return false;
  if (stored.code !== enteredOtp) return false;
  if (stored.expiresAt < Date.now()) return false;

  // OTP Verified -> Mark user verified
  const user = getUserById(userId);
  if (!user) return false;

  user.emailVerified = true;
  updateUser(user);

  localStorage.removeItem(EMAIL_OTP_KEY);

  return true;
}
