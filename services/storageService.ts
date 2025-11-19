// ---------- STORAGE KE KEYS ----------
const USERS_KEY = "users";
const FORMS_KEY = "forms";
const ADMIN_NOTIFICATIONS_KEY = "admin_notifications";
const EMAIL_CODES_KEY = "email_codes";

// ---------- Helper Functions ----------
const getData = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setData = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ---------- USERS ----------
export const getUserById = (id: string) => {
  const users = getData(USERS_KEY);
  return users.find((u: any) => u.id === id) || null;
};

export const updateUser = (updatedUser: any) => {
  const users = getData(USERS_KEY);
  const index = users.findIndex((u: any) => u.id === updatedUser.id);

  if (index !== -1) {
    users[index] = updatedUser;
    setData(USERS_KEY, users);
  }
};

// ---------- FORMS ----------
export const getForms = () => {
  return getData(FORMS_KEY);
};

export const addForm = (form: any) => {
  const forms = getData(FORMS_KEY);
  forms.push(form);
  setData(FORMS_KEY, forms);
};

export const updateForm = (updatedForm: any) => {
  const forms = getData(FORMS_KEY);
  const index = forms.findIndex((f: any) => f.id === updatedForm.id);

  if (index !== -1) {
    forms[index] = updatedForm;
    setData(FORMS_KEY, forms);
  }
};

// ---------- ADMIN NOTIFICATIONS ----------
export const getAdminNotifications = () => {
  return getData(ADMIN_NOTIFICATIONS_KEY);
};

export const addAdminNotification = (notification: any) => {
  const list = getData(ADMIN_NOTIFICATIONS_KEY);
  list.push(notification);
  setData(ADMIN_NOTIFICATIONS_KEY, list);
};

export const updateAdminNotification = (updated: any) => {
  const list = getData(ADMIN_NOTIFICATIONS_KEY);
  const index = list.findIndex((n: any) => n.id === updated.id);

  if (index !== -1) {
    list[index] = updated;
    setData(ADMIN_NOTIFICATIONS_KEY, list);
  }
};

// ---------- EMAIL VERIFICATION ----------
export const resendEmailVerificationCode = (userId: string) => {
  const codes = getData(EMAIL_CODES_KEY);

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();

  const index = codes.findIndex((c: any) => c.userId === userId);

  if (index !== -1) {
    codes[index].code = newCode;
  } else {
    codes.push({ userId, code: newCode });
  }

  setData(EMAIL_CODES_KEY, codes);

  console.log("Fake email sent with code:", newCode);
  return newCode;
};

// ---------- CLEAR ----------
export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(FORMS_KEY);
  localStorage.removeItem(ADMIN_NOTIFICATIONS_KEY);
  localStorage.removeItem(EMAIL_CODES_KEY);
};
