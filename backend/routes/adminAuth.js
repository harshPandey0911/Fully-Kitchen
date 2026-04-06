import { Router } from 'express';
import Admin from '../models/Admin.js';
import { verifyPassword } from '../utils/passwords.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeAdmin = (admin) => ({
  id: String(admin._id),
  name: admin.name,
  email: admin.email,
  role: admin.role,
  lastLoginAt: admin.lastLoginAt instanceof Date ? admin.lastLoginAt.toISOString() : admin.lastLoginAt,
  createdAt: admin.createdAt instanceof Date ? admin.createdAt.toISOString() : admin.createdAt,
});

router.post('/login', async (request, response) => {
  try {
    const { email = '', password = '' } = request.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();
    const allowedAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

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

    if (!allowedAdminEmail || normalizedEmail !== allowedAdminEmail) {
      response.status(401).json({ success: false, message: 'Invalid admin email or password.' });
      return;
    }

    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      response.status(401).json({ success: false, message: 'Invalid admin email or password.' });
      return;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    response.status(200).json({
      success: true,
      message: 'Admin login successful.',
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to log in as admin.',
    });
  }
});

export default router;
