import { Router } from 'express';
import SubAdmin from '../models/SubAdmin.js';
import { verifyPassword } from '../utils/passwords.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeSubAdmin = (subAdmin) => ({
  id: String(subAdmin._id),
  name: subAdmin.name,
  email: subAdmin.email,
  role: subAdmin.role,
  permissions: Array.isArray(subAdmin.permissions) ? subAdmin.permissions : [],
  createdBy: subAdmin.createdBy,
  lastLoginAt: subAdmin.lastLoginAt instanceof Date ? subAdmin.lastLoginAt.toISOString() : subAdmin.lastLoginAt,
  createdAt: subAdmin.createdAt instanceof Date ? subAdmin.createdAt.toISOString() : subAdmin.createdAt,
});

router.post('/login', async (request, response) => {
  try {
    const { email = '', password = '' } = request.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      response.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid email address.' });
      return;
    }

    if (!password) {
      response.status(400).json({ success: false, message: 'Password is required.' });
      return;
    }

    const subAdmin = await SubAdmin.findOne({ email: normalizedEmail });

    if (!subAdmin || !verifyPassword(password, subAdmin.passwordHash)) {
      response.status(401).json({ success: false, message: 'Invalid sub admin email or password.' });
      return;
    }

    subAdmin.lastLoginAt = new Date();
    await subAdmin.save();

    response.status(200).json({
      success: true,
      message: 'Sub admin login successful.',
      subAdmin: sanitizeSubAdmin(subAdmin),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to log in as sub admin.',
    });
  }
});

export default router;
