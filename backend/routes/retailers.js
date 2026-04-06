import { Router } from 'express';
import mongoose from 'mongoose';
import Retailer from '../models/Retailer.js';
import { hashPassword } from '../utils/passwords.js';

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

const getCreatedByFilter = (createdBy = '') => {
  const normalizedCreatedBy = String(createdBy).trim().toLowerCase();
  return normalizedCreatedBy ? { createdBy: normalizedCreatedBy } : {};
};

router.get('/', async (request, response) => {
  try {
    const filter = getCreatedByFilter(request.query.createdBy);
    const loggedInOnly = String(request.query.loggedInOnly || '').trim().toLowerCase() === 'true';

    if (loggedInOnly) {
      filter.lastLoginAt = { $ne: null };
    }

    const retailers = await Retailer.find(filter)
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      retailers: retailers.map(sanitizeRetailer),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load retailers.',
    });
  }
});

router.post('/', async (request, response) => {
  try {
    const {
      name = '',
      email = '',
      password = '',
      phone = '',
      location = '',
      status = 'Active',
      createdBy = '',
    } = request.body ?? {};

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCreatedBy = String(createdBy).trim().toLowerCase();

    if (!name.trim()) {
      response.status(400).json({ success: false, message: 'Name is required.' });
      return;
    }

    if (!normalizedEmail) {
      response.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid email address.' });
      return;
    }

    if (!password || password.length < 6) {
      response.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    if (!phone.trim()) {
      response.status(400).json({ success: false, message: 'Phone is required.' });
      return;
    }

    if (!location.trim()) {
      response.status(400).json({ success: false, message: 'Location is required.' });
      return;
    }

    const existingRetailer = await Retailer.findOne({ email: normalizedEmail }).select('_id');

    if (existingRetailer) {
      response.status(409).json({ success: false, message: 'A retailer with this email already exists.' });
      return;
    }

    const retailer = await Retailer.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      phone: phone.trim(),
      location: location.trim(),
      status: status.trim() || 'Active',
      orderCount: 0,
      createdBy: normalizedCreatedBy || 'distributor',
    });

    response.status(201).json({
      success: true,
      message: 'Retailer created successfully.',
      retailer: sanitizeRetailer(retailer),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A retailer with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create retailer.',
    });
  }
});

router.put('/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const {
      name = '',
      email = '',
      phone = '',
      location = '',
      status = 'Active',
      createdBy = '',
    } = request.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();
    const ownershipFilter = getCreatedByFilter(createdBy);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid retailer id.' });
      return;
    }

    if (!name.trim() || !normalizedEmail || !phone.trim() || !location.trim()) {
      response.status(400).json({ success: false, message: 'Name, email, phone, and location are required.' });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid email address.' });
      return;
    }

    const existingRetailer = await Retailer.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    }).select('_id');

    if (existingRetailer) {
      response.status(409).json({ success: false, message: 'A retailer with this email already exists.' });
      return;
    }

    const retailer = await Retailer.findOneAndUpdate(
      {
        _id: id,
        ...ownershipFilter,
      },
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          location: location.trim(),
          status: status.trim() || 'Active',
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!retailer) {
      response.status(404).json({ success: false, message: 'Retailer not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Retailer updated successfully.',
      retailer: sanitizeRetailer(retailer),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A retailer with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to update retailer.',
    });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const ownershipFilter = getCreatedByFilter(request.query.createdBy);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid retailer id.' });
      return;
    }

    const deletedRetailer = await Retailer.findOneAndDelete({
      _id: id,
      ...ownershipFilter,
    });

    if (!deletedRetailer) {
      response.status(404).json({ success: false, message: 'Retailer not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Retailer deleted successfully.',
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to delete retailer.',
    });
  }
});

export default router;
