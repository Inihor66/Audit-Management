import { Role } from "./types";

export const ROLE_CONFIG = {
  [Role.FIRM]: {
    freeEntries: 5,
  },
  [Role.STUDENT]: {
    freeEntries: 10,
  },
  [Role.ADMIN]: {
    freeEntries: 9999,
  }
};

export const CONTACT_INFO = {
  email: "support@example.com",
  phone: "+91 9999999999",
};

export const SUBSCRIPTION_PLANS = {
  free: {
    entries: 5,
  },
  basic: {
    entries: 50,
  },
  premium: {
    entries: 200,
  }
};
