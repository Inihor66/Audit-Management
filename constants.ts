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
    freeEntries: 0, // Students don't create forms
  },
  [Role.ADMIN]: {
    name: 'Admin',
    hex: '#16A34A',
    freeEntries: 550,
  },
};

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

// API base URL: set VITE_API_BASE_URL in your environment (.env) or leave empty to use local simulation.
// Example .env: VITE_API_BASE_URL=https://api.your-domain.com
// Use a safe cast to avoid TypeScript errors when env typing isn't declared in this project.
export const API_BASE_URL: string = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';