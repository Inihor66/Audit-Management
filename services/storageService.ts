// services/storageService.ts (only the OTP parts shown)
// make sure API_BASE_URL in config.ts points to your backend base, e.g. "http://localhost:4000/api" or "" for Vercel origin

import { API_BASE_URL } from "./config";

const EMAIL_OTP_KEY = "email_otp";

// call this after creating new user
export async function generateEmailVerificationCode(userId: string) {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // save locally for verify page
  localStorage.setItem(EMAIL_OTP_KEY, JSON.stringify({ userId, otp, expiresAt }));

  try {
    // NOTE: API_BASE_URL should include '/api' if backend expects it, e.g. "http://localhost:4000/api"
    const resp = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, code: otp }),
    });

    if (!resp.ok) {
      console.error("OTP backend responded with error", await resp.text());
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
