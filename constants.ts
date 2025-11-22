import { Role, SubscriptionPlan } from './types';

export const ROLE_CONFIG = {
  [Role.FIRM]: {
    name: 'Firm',
    hex: '#3B82F6',
    freeEntries: 350,
  },
  [Role.STUDENT]: {
    name: 'Student',
    hex: '#F97316',
  },
  [Role.ADMIN]: {
    name: 'Admin',
    hex: '#16A34A',
    freeEntries: 550,
  },
};
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://audit-management-2.onrender.com/api";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { key: 'monthly', name: 'Monthly', price: 400, duration_months: 1 },
  { key: 'six_month', name: 'Six Month', price: 2200, duration_months: 6 },
  { key: 'yearly', name: 'Yearly', price: 4500, duration_months: 12 },
];

export const CONTACT_INFO = {
  whatsapp: 'https://wa.me/919422332475',
  whatsapp_number: '+91 9422332475',
  upi: '9422332475@ibl',
  email: 'aarohipurwar06@gmail.com',
};

// Frontend single-page deployment URL used for API base determination
export const API_BASE_URL = "https://audit-management-wgbd.onrender.com";

export const plans = {
  basic: {
    name: "Basic",
    freeEntries: 10,
  },
  standard: {
    name: "Standard",
    freeEntries: 50,
  },
  premium: {
    name: "Premium",
    freeEntries: 200,
  }
};

