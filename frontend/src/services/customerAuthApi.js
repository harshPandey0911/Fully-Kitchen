import { APP_STORAGE_PREFIX } from '../constants/branding';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const LOCAL_CUSTOMER_ACCOUNTS_KEY = `${APP_STORAGE_PREFIX}CustomerAccounts`;

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

const registerWithLocalFallback = async ({ name = '', email = '', password = '' }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const accounts = readLocalAccounts();
  const existingAccount = accounts.find((account) => account.email === normalizedEmail);

  if (existingAccount) {
    throw buildError({ message: 'An account with this email already exists.' }, 'Unable to create account.');
  }

  const createdAt = new Date().toISOString();
  const nextAccount = {
    id: `cust-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || '').trim(),
    email: normalizedEmail,
    password,
    orderCount: 0,
    loginCount: 0,
    tier: 'New',
    createdAt,
    lastLoginAt: null,
  };

  accounts.unshift(nextAccount);
  saveLocalAccounts(accounts);

  return {
    success: true,
    message: 'Account created successfully.',
    user: sanitizeLocalUser(nextAccount),
    source: 'local-fallback',
  };
};

const loginWithLocalFallback = async ({ email = '', password = '' }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const accounts = readLocalAccounts();
  const accountIndex = accounts.findIndex((account) => account.email === normalizedEmail);

  if (accountIndex === -1) {
    const error = buildError(
      {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Please sign up first.',
      },
      'Unable to log in.',
    );
    throw error;
  }

  const account = accounts[accountIndex];

  if (String(account.password || '') !== String(password || '')) {
    const error = buildError(
      {
        code: 'INVALID_PASSWORD',
        message: 'Invalid email or password.',
      },
      'Unable to log in.',
    );
    throw error;
  }

  const loginCount = Number(account.loginCount || 0) + 1;
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
