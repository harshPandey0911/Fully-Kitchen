import { Router } from 'express';
import Retailer from '../models/Retailer.js';
import { verifyPassword } from '../utils/passwords.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeRetailer = (retailer) => ({
  id: String(retailer._id),
  name: retailer.name,
  email: retailer.email,
  phone: retailer.phone,
  location: retailer.location,
  status: retailer.status,
  orderCount: Number(retailer.orderCount || 0),
  createdBy: retailer.createdBy,
  lastLoginAt:
    retailer.lastLoginAt instanceof Date
      ? retailer.lastLoginAt.toISOString()
      : retailer.lastLoginAt,
  createdAt:
    retailer.createdAt instanceof Date
      ? retailer.createdAt.toISOString()
      : retailer.createdAt,
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

    const retailer = await Retailer.findOne({ email: normalizedEmail });

    if (!retailer || !verifyPassword(password, retailer.passwordHash)) {
      response.status(401).json({ success: false, message: 'Invalid retailer email or password.' });
      return;
    }

    if (retailer.status !== 'Active') {
      response.status(403).json({ success: false, message: 'Retailer account is inactive.' });
      return;
    }

    retailer.lastLoginAt = new Date();
    await retailer.save();

    response.status(200).json({
      success: true,
      message: 'Retailer login successful.',
      retailer: sanitizeRetailer(retailer),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to log in as retailer.',
    });
  }
});

export default router;
