import { Role } from "../types";

export const ROLE_CONFIG = {
  [Role.FIRM]: {
    name: "Firm",
    freeEntries: 0,
    hex: "#1E90FF",
  },
  [Role.STUDENT]: {
    name: "Student",
    freeEntries: 0,
    hex: "#32CD32",
  },
  [Role.ADMIN]: {
    name: "Admin",
    freeEntries: 0,
    hex: "#FF4500",
  },
};
