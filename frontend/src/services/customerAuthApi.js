import { APP_STORAGE_PREFIX } from '../constants/branding';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const LOCAL_CUSTOMER_ACCOUNTS_KEY = `${APP_STORAGE_PREFIX}CustomerAccounts`;

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildError = (data, fallbackMessage) => {
  const error = new Error(data?.message || fallbackMessage);
  error.isApiError = true;
  if (data?.code) {
    error.code = data.code;
  }
  return error;
};

const readLocalAccounts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOMER_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalAccounts = (accounts) => {
  localStorage.setItem(LOCAL_CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const readStorageObject = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getTierFromLoginCount = (loginCount) => {
  if (loginCount >= 5) {
    return 'Premium';
  }

  if (loginCount >= 2) {
    return 'Standard';
  }

  return 'New';
};

const sanitizeLocalUser = (account) => ({
  id: account.id,
  name: account.name,
  email: account.email,
  role: 'customer',
  orderCount: Number(account.orderCount || 0),
  loginCount: Number(account.loginCount || 0),
  tier: account.tier || 'New',
  createdAt: account.createdAt,
  lastLoginAt: account.lastLoginAt || null,
});

const upsertLocalAccount = ({
  id = '',
  name = '',
  email = '',
  password = '',
  orderCount = 0,
  loginCount = 0,
  tier = '',
  createdAt = '',
  lastLoginAt = null,
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const accounts = readLocalAccounts();
  const accountIndex = accounts.findIndex((account) => account.email === normalizedEmail);
  const existingAccount = accountIndex >= 0 ? accounts[accountIndex] : null;
  const nextLoginCount = Number.isFinite(Number(loginCount))
    ? Number(loginCount)
    : Number(existingAccount?.loginCount || 0);
  const nextAccount = {
    id: id || existingAccount?.id || `cust-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || existingAccount?.name || normalizedEmail.split('@')[0] || 'Customer').trim(),
    email: normalizedEmail,
    password: String(password || existingAccount?.password || ''),
    orderCount: Number.isFinite(Number(orderCount)) ? Number(orderCount) : Number(existingAccount?.orderCount || 0),
    loginCount: nextLoginCount,
    tier: tier || existingAccount?.tier || getTierFromLoginCount(nextLoginCount),
    createdAt: createdAt || existingAccount?.createdAt || new Date().toISOString(),
    lastLoginAt: lastLoginAt || existingAccount?.lastLoginAt || null,
  };

  if (accountIndex >= 0) {
    accounts[accountIndex] = nextAccount;
  } else {
    accounts.unshift(nextAccount);
  }

  saveLocalAccounts(accounts);
  return nextAccount;
};

const readRememberedCustomer = (email = '') => {
  const normalizedEmail = normalizeEmail(email);
  const customerData = readStorageObject('customerData');
  const customerProfile = readStorageObject('customerProfile');
  const loginData = readStorageObject('loginData');
  const rememberedEmails = [
    normalizeEmail(customerData?.email),
    normalizeEmail(customerProfile?.email),
    normalizeEmail(loginData?.email),
  ].filter(Boolean);

  if (!normalizedEmail || !rememberedEmails.includes(normalizedEmail)) {
    return null;
  }

  return {
    id: customerData?.id || '',
    name: customerData?.name || customerProfile?.fullName || loginData?.userName || 'Customer',
    email: normalizedEmail,
    orderCount: Number(customerData?.orderCount || 0),
    loginCount: Number(customerData?.loginCount || 0),
    tier: customerData?.tier || 'New',
    createdAt: customerData?.createdAt || new Date().toISOString(),
    lastLoginAt: customerData?.lastLoginAt || null,
  };
};

const syncRemoteUserToLocal = (payload, user) =>
  upsertLocalAccount({
    id: user?.id,
    name: user?.name,
    email: user?.email,
    password: payload?.password || '',
    orderCount: user?.orderCount,
    loginCount: user?.loginCount,
    tier: user?.tier,
    createdAt: user?.createdAt,
    lastLoginAt: user?.lastLoginAt,
  });

const registerWithLocalFallback = async ({ name = '', email = '', password = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readLocalAccounts();
  const existingAccount = accounts.find((account) => account.email === normalizedEmail);

  if (existingAccount) {
    throw buildError({ message: 'An account with this email already exists.' }, 'Unable to create account.');
  }

  const nextAccount = upsertLocalAccount({
    name,
    email: normalizedEmail,
    password,
    orderCount: 0,
    loginCount: 0,
    tier: 'New',
  });

  return {
    success: true,
    message: 'Account created successfully.',
    user: sanitizeLocalUser(nextAccount),
    source: 'local-fallback',
  };
};

const loginWithLocalFallback = async ({ email = '', password = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  let accounts = readLocalAccounts();
  let accountIndex = accounts.findIndex((account) => account.email === normalizedEmail);
  let account = accountIndex >= 0 ? accounts[accountIndex] : null;

  if (!account) {
    const rememberedCustomer = readRememberedCustomer(normalizedEmail);

    if (rememberedCustomer) {
      account = upsertLocalAccount({
        ...rememberedCustomer,
        email: normalizedEmail,
        password,
      });
      accounts = readLocalAccounts();
      accountIndex = accounts.findIndex((entry) => entry.email === normalizedEmail);
    }
  }

  if (!account) {
    throw buildError(
      {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Please sign up first.',
      },
      'Unable to log in.',
    );
  }

  if (String(account.password || '') !== String(password || '')) {
    const rememberedCustomer = readRememberedCustomer(normalizedEmail);

    if (rememberedCustomer) {
      account = upsertLocalAccount({
        ...account,
        ...rememberedCustomer,
        email: normalizedEmail,
        password,
      });
      accounts = readLocalAccounts();
      accountIndex = accounts.findIndex((entry) => entry.email === normalizedEmail);
    } else {
      throw buildError(
        {
          code: 'INVALID_PASSWORD',
          message: 'Invalid email or password.',
        },
        'Unable to log in.',
      );
    }
  }

  const loginCount = Number(account?.loginCount || 0) + 1;
  const lastLoginAt = new Date().toISOString();
  const updatedAccount = {
    ...account,
    loginCount,
    lastLoginAt,
    tier: getTierFromLoginCount(loginCount),
  };

  accounts[accountIndex] = updatedAccount;
  saveLocalAccounts(accounts);

  return {
    success: true,
    message: 'Login successful.',
    user: sanitizeLocalUser(updatedAccount),
    source: 'local-fallback',
  };
};

const canUseLocalFallback = (response, data) => {
  if (!response) {
    return true;
  }

  if (response.ok) {
    return !data?.user;
  }

  return response.status >= 500 || !data?.message;
};

const requestCustomerAuth = async (path, payload, fallbackHandler, fallbackMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely(response);

    if (response.ok && data?.user) {
      syncRemoteUserToLocal(payload, data.user);
      return data;
    }

    if (canUseLocalFallback(response, data)) {
      return fallbackHandler(payload);
    }

    throw buildError(data, fallbackMessage);
  } catch (error) {
    if (error?.isApiError || error?.code === 'ACCOUNT_NOT_FOUND' || error?.code === 'INVALID_PASSWORD') {
      throw error;
    }

    return fallbackHandler(payload);
  }
};

export const customerAuthApi = {
  register: async (payload) =>
    requestCustomerAuth('/api/auth/register', payload, registerWithLocalFallback, 'Unable to create account.'),
  login: async (payload) => requestCustomerAuth('/api/auth/login', payload, loginWithLocalFallback, 'Unable to log in.'),
};
