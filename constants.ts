
import { Role, SubscriptionPlan } from './types';

export const ROLE_CONFIG = {
  [Role.FIRM]: {
    name: 'Firm',
    freeEntries: 350,
  },
  [Role.STUDENT]: {
    name: 'Student',
    freeEntries: 0, // Students don't create forms
  },
  [Role.ADMIN]: {
    name: 'Admin',
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

// EmailJS Configuration
// 1. Go to emailjs.com, create account, add Gmail service -> Get SERVICE_ID
// 2. Create a Template with {{message}}, {{to_name}}, {{to_email}} -> Get TEMPLATE_ID
// 3. Go to Account > API Keys -> Get PUBLIC_KEY
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_6gexxxx', // <-- PASTE YOUR REAL SERVICE ID HERE
  TEMPLATE_ID: 'template_j1jxxxx', // <-- PASTE YOUR REAL TEMPLATE ID HERE
  PUBLIC_KEY: 'WPvTVBEQwlGTWxxxx', // <-- PASTE YOUR REAL PUBLIC KEY HERE
};
