import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLoginRouteConfig, saveDummyLoginSession } from '../../services/authSession';
import { adminAuthApi } from '../../services/adminAuthApi';
import { distributorAuthApi } from '../../services/distributorAuthApi';
import { retailerAuthApi } from '../../services/retailerAuthApi';
import { subAdminAuthApi } from '../../services/subAdminAuthApi';
import { APP_DOMAIN, APP_LOGO, APP_NAME, APP_STORAGE_PREFIX } from '../../constants/branding';

const ACCOUNT_STORAGE_KEY = `${APP_STORAGE_PREFIX}UnifiedRoleAccounts`;

const initialLoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm = {
  name: '',
  email: '',
  password: '',
};

const inputClass = 'input-field';
const hasAtSymbol = (value) => String(value).includes('@');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readAccounts = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts) => {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
};

const getCustomerLoginRoute = (pathname) => {
  if (pathname === '/login') {
    return '/login';
  }

  return '/customer/login';
};

export default function RoleAuth({ initialMode = 'login' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const config = useMemo(() => getLoginRouteConfig(location.pathname), [location.pathname]);
  const [activeMode, setActiveMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const canRegister = config.role === 'customer';
  const currentMode = canRegister ? activeMode : 'login';
  const isAdminLogin = config.role === 'admin';
  const isDistributorLogin = config.role === 'distributor';
  const isRetailerLogin = config.role === 'retailer';
  const isSubAdminLogin = config.role === 'subadmin';

  useEffect(() => {
    setActiveMode(canRegister ? initialMode : 'login');
    setErrors({});
  }, [canRegister, initialMode]);

  const subtitle = `${config.label} ${currentMode === 'register' ? 'Register' : 'Login'}`;

  const switchMode = (nextMode) => {
    if (!canRegister) {
      return;
    }

    setErrors({});
    setActiveMode(nextMode);

    navigate(nextMode === 'login' ? getCustomerLoginRoute(location.pathname) : '/signup');
  };

  const validateLogin = () => {
    const nextErrors = {};
    const normalizedEmail = loginForm.email.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required';
    } else if (isAdminLogin && !emailPattern.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    } else if (!isAdminLogin && !hasAtSymbol(normalizedEmail)) {
      nextErrors.email = 'Email must include @';
    }

    if (!loginForm.password.trim()) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateRegister = () => {
    const nextErrors = {};

    if (!registerForm.name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!registerForm.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!hasAtSymbol(registerForm.email.trim())) {
      nextErrors.email = 'Email must include @';
    }

    if (!registerForm.password.trim()) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      let matchingAccount;

      if (isAdminLogin) {
        const response = await adminAuthApi.login({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

        matchingAccount = response.admin;
      } else if (isDistributorLogin) {
        const response = await distributorAuthApi.login({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

        matchingAccount = response.distributor;
      } else if (isRetailerLogin) {
        const response = await retailerAuthApi.login({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

        matchingAccount = response.retailer;
      } else if (isSubAdminLogin) {
        const response = await subAdminAuthApi.login({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

        matchingAccount = response.subAdmin;
      } else {
        matchingAccount = readAccounts().find(
          (account) =>
            account.role === config.role &&
            account.email.toLowerCase() === loginForm.email.trim().toLowerCase(),
        );
      }

      const { dashboardPath } = saveDummyLoginSession({
        pathname: location.pathname,
        email: loginForm.email.trim(),
        displayNameOverride: matchingAccount?.name,
      });

      toast.success(`${config.label} login successful`);
      navigate(dashboardPath);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        password: error.message || 'Login failed.',
      }));
      toast.error(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!validateRegister()) {
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));

      const nextAccount = {
        id: `${config.role}-${Date.now()}`,
        role: config.role,
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        createdAt: new Date().toLocaleString(),
      };

      const accounts = readAccounts().filter(
        (account) =>
          !(account.role === nextAccount.role && account.email.toLowerCase() === nextAccount.email.toLowerCase()),
      );
      writeAccounts([nextAccount, ...accounts]);

      if (config.role === 'customer') {
        localStorage.setItem(
          'customerData',
          JSON.stringify({
            id: nextAccount.id,
            name: nextAccount.name,
            email: nextAccount.email,
            password: nextAccount.password,
            role: nextAccount.role,
            createdAt: nextAccount.createdAt,
          }),
        );
      }

      setLoginForm({
        email: nextAccount.email,
        password: '',
      });
      setRegisterForm(initialRegisterForm);
      setErrors({});
      setActiveMode('login');

      if (canRegister) {
        navigate(getCustomerLoginRoute(location.pathname));
      }

      toast.success(`${config.label} account created`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full">
        <div
          className="mx-auto w-full max-w-sm rounded-2xl border border-black/70 bg-white p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <img src={APP_LOGO} alt={`${APP_NAME} logo`} className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-black">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>

          {canRegister ? (
            <div className="flex rounded-lg bg-gray-100 p-1">
              <div className="grid w-full grid-cols-2 gap-1">
                {[
                  { id: 'login', label: 'Login' },
                  { id: 'register', label: 'Register' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchMode(tab.id)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      currentMode === tab.id ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentMode === 'login' ? (
            <form className={`${canRegister ? 'mt-6' : 'mt-8'} space-y-4`} onSubmit={handleLoginSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="text"
                  value={loginForm.email}
                  onChange={(event) => {
                    setLoginForm((current) => ({ ...current, email: event.target.value }));
                    setErrors((current) => ({ ...current, email: '' }));
                  }}
                  placeholder={`${config.role}@${APP_DOMAIN}`}
                  className={inputClass}
                />
                {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => {
                    setLoginForm((current) => ({ ...current, password: event.target.value }));
                    setErrors((current) => ({ ...current, password: '' }));
                  }}
                  placeholder="Enter password"
                  className={inputClass}
                />
                {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(event) => {
                    setRegisterForm((current) => ({ ...current, name: event.target.value }));
                    setErrors((current) => ({ ...current, name: '' }));
                  }}
                  placeholder="Enter full name"
                  className={inputClass}
                />
                {errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="text"
                  value={registerForm.email}
                  onChange={(event) => {
                    setRegisterForm((current) => ({ ...current, email: event.target.value }));
                    setErrors((current) => ({ ...current, email: '' }));
                  }}
                  placeholder={`${config.role}@${APP_DOMAIN}`}
                  className={inputClass}
                />
                {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => {
                    setRegisterForm((current) => ({ ...current, password: event.target.value }));
                    setErrors((current) => ({ ...current, password: '' }));
                  }}
                  placeholder="Create password"
                  className={inputClass}
                />
                {errors.password ? <p className="text-xs text-red-500">{errors.password}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}

          <p className="mt-6 px-4 text-center text-xs text-gray-400">
            By continuing, you agree to our <span className="font-medium text-gray-700">Terms &amp; Conditions</span>{' '}
            and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
