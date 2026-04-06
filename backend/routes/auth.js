import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowPasswordBypass = String(process.env.ALLOW_CUSTOMER_PASSWORD_BYPASS || '').toLowerCase() === 'true';

const getTierFromLoginCount = (loginCount) => {
  if (loginCount >= 5) {
    return 'Premium';
  }

  if (loginCount >= 2) {
    return 'Standard';
  }

  return 'New';
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  orderCount: Number(user.orderCount || 0),
  loginCount: Number(user.loginCount || 0),
  tier: user.tier || 'New',
  lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : user.lastLoginAt,
  createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
});

router.post('/register', async (request, response) => {
  try {
    const { name = '', email = '', password = '' } = request.body ?? {};

    if (!name.trim()) {
      response.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!email.trim()) {
      response.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    if (!emailPattern.test(email.trim())) {
      response.status(400).json({ success: false, message: 'Enter a valid email address.' });
      return;
    }

    if (!password) {
      response.status(400).json({ success: false, message: 'Password is required.' });
      return;
    }

    if (password.length < 6) {
      response.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');

    if (existingUser) {
      response.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const nextUser = await User.create({
      id: `cust-${randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'customer',
      orderCount: 0,
      loginCount: 0,
      tier: 'New',
    });

    response.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: sanitizeUser(nextUser),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create account.',
    });
  }
});

router.post('/login', async (request, response) => {
  try {
    const { email = '', password = '' } = request.body ?? {};

    if (!email.trim()) {
      response.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    if (!emailPattern.test(email.trim())) {
      response.status(400).json({ success: false, message: 'Enter a valid email address.' });
      return;
    }

    if (!password) {
      response.status(400).json({ success: false, message: 'Password is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      response.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Please sign up first.',
      });
      return;
    }

    const passwordValid = verifyPassword(password, user.passwordHash);
    if (!passwordValid && !allowPasswordBypass) {
      response.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Invalid email or password.',
      });
      return;
    }

    user.loginCount = Number(user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    user.tier = getTierFromLoginCount(user.loginCount);
    await user.save();

    response.status(200).json({
      success: true,
      message: 'Login successful.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to log in.',
    });
  }
});

export default router;
