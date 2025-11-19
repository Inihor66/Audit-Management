// config.ts
import { Role } from "./types";

// --- Role Configuration ---
export const ROLE_CONFIG = {
  [Role.FIRM]: {
    name: "Firm",
    hex: "#3B82F6",   // Optional: UI color
    freeEntries: 5,
  },
  [Role.STUDENT]: {
    name: "Student",
    hex: "#F97316",
    freeEntries: 10,
  },
  [Role.ADMIN]: {
    name: "Admin",
    hex: "#16A34A",
    freeEntries: 9999,
  },
};

// --- Contact Information ---
export const CONTACT_INFO = {
  email: "support@example.com",
  phone: "+91 9999999999",
  whatsapp: "https://wa.me/919999999999",  // Optional
  upi: "9999999999@ibl",                   // Optional
};

// --- Subscription Plans ---
export const SUBSCRIPTION_PLANS = {
  free: {
    key: "free",
    name: "Free",
    entries: 5,
    price: 0,
    duration_months: 1,
  },
  basic: {
    key: "basic",
    name: "Basic",
    entries: 50,
    price: 400,
    duration_months: 1,
  },
  premium: {
    key: "premium",
    name: "Premium",
    entries: 200,
    price: 4500,
    duration_months: 12,
  },
};

// --- API Base URL ---
export const API_BASE_URL = process.env.REACT_APP_API_URL || "";
