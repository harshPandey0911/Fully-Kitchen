import { Router } from 'express';
import Distributor from '../models/Distributor.js';
import { verifyPassword } from '../utils/passwords.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeDistributor = (distributor) => ({
  id: String(distributor._id),
  name: distributor.name,
  email: distributor.email,
  phone: distributor.phone,
  location: distributor.location,
  status: distributor.status,
  totalOrders: Number(distributor.totalOrders || 0),
  createdBy: distributor.createdBy,
  lastLoginAt:
    distributor.lastLoginAt instanceof Date
      ? distributor.lastLoginAt.toISOString()
      : distributor.lastLoginAt,
  createdAt:
    distributor.createdAt instanceof Date
      ? distributor.createdAt.toISOString()
      : distributor.createdAt,
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

    const distributor = await Distributor.findOne({ email: normalizedEmail });

    if (!distributor || !verifyPassword(password, distributor.passwordHash)) {
      response.status(401).json({ success: false, message: 'Invalid distributor email or password.' });
      return;
    }

    distributor.lastLoginAt = new Date();
    await distributor.save();

    response.status(200).json({
      success: true,
      message: 'Distributor login successful.',
      distributor: sanitizeDistributor(distributor),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to log in as distributor.',
    });
  }
});

export default router;
