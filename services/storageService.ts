// storageService.ts
import { User, Role } from './types';
import { API_BASE_URL } from './config';

const USERS_KEY = 'audit_flow_users';

// --- Local Storage Helpers ---
function getItem(key: string, defaultValue: any) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading from localStorage key "${key}"`, err);
    return defaultValue;
  }
}

function setItem(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing to localStorage key "${key}"`, err);
  }
}

// --- Users ---
export const getUsers = () => getItem(USERS_KEY, []);
export const saveUsers = (users: User[]) => setItem(USERS_KEY, users);

export const addUser = (newUser: any) => {
  const users = getUsers();

  if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase() && u.role === newUser.role)) {
    throw new Error('Account with this email already exists for this role.');
  }

  const user: User = {
    ...newUser,
    id: crypto.randomUUID(),
    emailVerified: newUser.role === Role.STUDENT ? true : false,
    emailVerification: null,
  };

  users.push(user);
  saveUsers(users);
  return user;
};

// --- Backend Email API Call ---
export const sendVerificationEmail = async (to: string, code: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        code,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${code}`,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send email');
    return true;
  } catch (err) {
    console.error('Error sending verification email:', err);
    return false;
  }
};

// --- Generate Email Verification Code ---
export const generateEmailVerificationCode = async (userId: string) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Save code in local storage
  users[idx].emailVerification = { code, expiresAt };
  users[idx].emailVerified = false;
  saveUsers(users);

  // ✅ Send code via backend
  const success = await sendVerificationEmail(users[idx].email, code);
  if (!success) throw new Error('Failed to send verification email');

  return code;
};

// --- Verify Email Code ---
export const verifyEmailCode = (userId: string, code: string) => {
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
