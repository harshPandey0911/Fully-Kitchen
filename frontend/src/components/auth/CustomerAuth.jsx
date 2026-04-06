import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { saveDummyLoginSession } from '../../services/authSession';
import { customerAuthApi } from '../../services/customerAuthApi';
import { APP_LOGO, APP_NAME, APP_STORAGE_PREFIX } from '../../constants/branding';

const PREFILL_EMAIL_KEY = `${APP_STORAGE_PREFIX}CustomerPrefillEmail`;
const SIGNUP_PREFILL_EMAIL_KEY = `${APP_STORAGE_PREFIX}CustomerSignupPrefillEmail`;

const initialLoginForm = {
  email: '',
  password: '',
  rememberMe: true,
};

const initialSignupForm = {
  name: '',
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UnderlineField = ({
  label,
  icon: Icon,
  error,
  trailing,
  ...inputProps
}) => {
  const iconClass = `auth-input-icon h-5 w-5 shrink-0 transition-colors duration-300 ${
    error ? 'text-[#C89A82]' : 'text-[#B8A899]'
  }`;
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#5C3A21]">{label}</label>
      <div className={`customer-auth-underline flex items-center gap-3 bg-transparent pb-1 transition-all duration-200 ${error ? 'customer-auth-underline-error' : ''}`}>
        <Icon className={iconClass} />
        <input
          {...inputProps}
          className="w-full border-0 bg-transparent py-3 text-[15px] text-[#2c2c2c] placeholder:text-[#B8A899] focus:outline-none"
        />
        {trailing}
      </div>
      {error ? <p className="text-xs text-[#7C4E32]">{error}</p> : null}
    </div>
  );
};

const CustomerAuth = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMode, setActiveMode] = useState(mode);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  useEffect(() => {
    setActiveMode(mode);

    if (mode === 'login') {
      const prefillEmail = sessionStorage.getItem(PREFILL_EMAIL_KEY);

      if (prefillEmail) {
        setLoginForm((current) => ({ ...current, email: prefillEmail }));
        sessionStorage.removeItem(PREFILL_EMAIL_KEY);
      }
    } else {
      const signupPrefillEmail = sessionStorage.getItem(SIGNUP_PREFILL_EMAIL_KEY);

      if (signupPrefillEmail) {
        setSignupForm((current) => ({ ...current, email: signupPrefillEmail }));
        sessionStorage.removeItem(SIGNUP_PREFILL_EMAIL_KEY);
      }
    }
  }, [mode]);

  const switchMode = (nextMode) => {
    setLoginErrors({});
    setSignupErrors({});
    setActiveMode(nextMode);

    if (nextMode === activeMode) {
      return;
    }

    navigate(nextMode === 'login' ? '/login' : '/signup');
  };

  const validateLogin = () => {
    const nextErrors = {};

    if (!loginForm.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!emailPattern.test(loginForm.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!loginForm.password) {
      nextErrors.password = 'Password is required';
    }

    setLoginErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateSignup = () => {
    const nextErrors = {};

    if (!signupForm.name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!signupForm.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!emailPattern.test(signupForm.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!signupForm.password) {
      nextErrors.password = 'Password is required';
    } else if (signupForm.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setSignupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      return;
    }

    const trimmedEmail = loginForm.email.trim().toLowerCase();
    setLoginLoading(true);

    try {
      const response = await customerAuthApi.login({
        email: trimmedEmail,
        password: loginForm.password,
      });
      const authenticatedUser = response.user;

      const { dashboardPath, loginData } = saveDummyLoginSession({
        pathname: location.pathname,
        email: authenticatedUser.email,
        rememberMe: loginForm.rememberMe,
        displayNameOverride: authenticatedUser.name,
      });
      localStorage.setItem(
        'customerData',
        JSON.stringify({
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: authenticatedUser.role,
          createdAt: authenticatedUser.createdAt,
        }),
      );
      localStorage.setItem(
        'customerProfile',
        JSON.stringify({
          fullName: authenticatedUser.name,
          email: authenticatedUser.email,
          phone: '',
        }),
      );

      console.log('Login Success');
      toast.success(`Welcome back, ${String(loginData.userName).split(/[ _]/)[0]}!`);
      navigate(dashboardPath);
    } catch (error) {
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        sessionStorage.setItem(SIGNUP_PREFILL_EMAIL_KEY, trimmedEmail);
        toast.error('No customer account found. Please sign up first.');
        switchMode('signup');
        return;
      }

      setLoginErrors((current) => ({
        ...current,
        password: error.message,
      }));
      toast.error(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (!validateSignup()) {
      return;
    }

    const email = signupForm.email.trim().toLowerCase();
    setSignupLoading(true);

    try {
      const response = await customerAuthApi.register({
        name: signupForm.name.trim(),
        email,
        password: signupForm.password,
      });
      const createdUser = response.user;
      localStorage.setItem(
        'customerData',
        JSON.stringify({
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          createdAt: createdUser.createdAt,
        }),
      );
      localStorage.setItem(
        'customerProfile',
        JSON.stringify({
          fullName: createdUser.name,
          email: createdUser.email,
          phone: '',
        }),
      );
      sessionStorage.setItem(PREFILL_EMAIL_KEY, email);

      toast.success('Account created. Sign in to continue.');
      switchMode('login');
      setLoginForm((current) => ({ ...current, email }));
      setSignupForm(initialSignupForm);
    } catch (error) {
      setSignupErrors((current) => ({
        ...current,
        email: error.message,
      }));
      toast.error(error.message);
    } finally {
      setSignupLoading(false);
    }
  };

  const passwordToggleClass =
    'text-[#9B8B7B] transition-colors duration-200 hover:text-[#5C3A21] focus:outline-none';

  return (
    <div className="customer-auth-page min-h-screen bg-[#FBF6F1] sm:bg-[#F9F3ED]">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-transparent sm:min-h-0 sm:py-6">
        <div className="customer-auth-hero relative overflow-hidden bg-gradient-to-br from-[#A67C52] via-[#8B5E3C] to-[#5C3A21] px-6 pb-16 pt-7 text-white sm:rounded-[34px] sm:pb-20 sm:pt-8">
          <div className="absolute -left-12 top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-[-20px] top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-14 left-12 h-20 w-20 rounded-full border border-white/15" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/18 p-3 backdrop-blur-sm">
              <img src={APP_LOGO} alt={`${APP_NAME} logo`} className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-semibold">{APP_NAME}</p>
              <p className="text-sm text-white/80">Premium appliance care</p>
            </div>
          </div>

          <div className="relative z-10 mt-7 max-w-[280px] space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
              {activeMode === 'login' ? 'Sign In' : 'Sign Up'}
            </p>
            <h1 className="auth-title text-[28px] font-semibold leading-tight">
              {activeMode === 'login'
                ? 'Welcome back. Your kitchen is waiting.'
                : 'Create your account and start shopping smarter.'}
            </h1>
          </div>

          <svg
            viewBox="0 0 400 90"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-[-1px] left-0 h-20 w-full text-white"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0,36 C72,88 162,4 245,34 C302,54 352,77 400,52 L400,90 L0,90 Z"
            />
          </svg>
        </div>

        <div className="auth-container customer-auth-sheet relative z-10 -mt-10 flex-1 rounded-t-[30px] bg-white px-6 pb-8 pt-4 shadow-[0_-14px_40px_rgba(255,77,109,0.08)] sm:mx-3 sm:-mt-16 sm:rounded-[32px] sm:px-7 sm:pt-5">
          <div className="auth-tabs mb-5 flex items-center justify-between gap-6 border-b border-[#E8D9CC]">
            {[
              { id: 'login', label: 'Sign In' },
              { id: 'signup', label: 'Sign Up' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id)}
                className={`tab -mb-px flex-1 px-2 pb-3 text-center text-[15px] font-medium transition-all duration-200 ${
                  activeMode === tab.id
                    ? 'tab-active'
                    : 'tab-inactive hover:text-[#5C3A21]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form mt-2 space-y-5">
              <UnderlineField
                label="Email"
                icon={FiMail}
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={loginForm.email}
                onChange={(event) => {
                  setLoginForm((current) => ({ ...current, email: event.target.value }));
                  setLoginErrors((current) => ({ ...current, email: '', auth: '' }));
                }}
                error={loginErrors.email}
              />

              <UnderlineField
                label="Password"
                icon={FiLock}
                type={showLoginPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(event) => {
                  setLoginForm((current) => ({ ...current, password: event.target.value }));
                  setLoginErrors((current) => ({ ...current, password: '', auth: '' }));
                }}
                error={loginErrors.password}
                trailing={(
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((current) => !current)}
                    className={passwordToggleClass}
                  >
                    {showLoginPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                )}
              />

              <div className="options flex items-center justify-end gap-3 text-[13px] text-[#8f7d82]">
                <button
                  type="button"
                  onClick={() => toast('Password recovery will be available soon.')}
                  className="font-medium text-[#5C3A21] transition-colors duration-200 hover:text-[#4A2F1E]"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="customer-auth-submit btn-login mt-2 w-full rounded-[14px] border-0 bg-gradient-to-r from-[#A67C52] to-[#5C3A21] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? 'Signing In...' : 'Login'}
              </button>

              <p className="switch-text pt-1 text-center text-sm text-[#9a878d]">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-[#5C3A21] transition-colors duration-200 hover:text-[#4A2F1E]"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="auth-form mt-2 space-y-5">
              <UnderlineField
                label="Full Name"
                icon={FiUser}
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={signupForm.name}
                onChange={(event) => {
                  setSignupForm((current) => ({ ...current, name: event.target.value }));
                  setSignupErrors((current) => ({ ...current, name: '' }));
                }}
                error={signupErrors.name}
              />

              <UnderlineField
                label="Email"
                icon={FiMail}
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={signupForm.email}
                onChange={(event) => {
                  setSignupForm((current) => ({ ...current, email: event.target.value }));
                  setSignupErrors((current) => ({ ...current, email: '' }));
                }}
                error={signupErrors.email}
              />

              <UnderlineField
                label="Password"
                icon={FiLock}
                type={showSignupPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={signupForm.password}
                onChange={(event) => {
                  setSignupForm((current) => ({ ...current, password: event.target.value }));
                  setSignupErrors((current) => ({ ...current, password: '' }));
                }}
                error={signupErrors.password}
                trailing={(
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((current) => !current)}
                    className={passwordToggleClass}
                  >
                    {showSignupPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                )}
              />

              <button
                type="submit"
                disabled={signupLoading}
                className="customer-auth-submit btn-login mt-2 w-full rounded-[14px] border-0 bg-gradient-to-r from-[#A67C52] to-[#5C3A21] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signupLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="switch-text pt-1 text-center text-sm text-[#9a878d]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-[#5C3A21] transition-colors duration-200 hover:text-[#4A2F1E]"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          <p className="mt-8 px-3 text-center text-xs leading-5 text-[#b09ca2]">
            By continuing, you agree to our{' '}
            <span className="font-medium text-[#5C3A21]">Terms &amp; Conditions</span>{' '}
            and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
