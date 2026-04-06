import { Router } from 'express';
import mongoose from 'mongoose';
import Distributor from '../models/Distributor.js';
import { hashPassword } from '../utils/passwords.js';

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

router.get('/', async (_request, response) => {
  try {
    const distributors = await Distributor.find({})
      .sort({ createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      distributors: distributors.map(sanitizeDistributor),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load distributors.',
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
    } = request.body ?? {};

    const normalizedEmail = email.trim().toLowerCase();

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

    const existingDistributor = await Distributor.findOne({ email: normalizedEmail }).select('_id');

    if (existingDistributor) {
      response.status(409).json({ success: false, message: 'A distributor with this email already exists.' });
      return;
    }

    const distributor = await Distributor.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      phone: phone.trim(),
      location: location.trim(),
      status: status.trim() || 'Active',
      totalOrders: 0,
      createdBy: process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin',
    });

    response.status(201).json({
      success: true,
      message: 'Distributor created successfully.',
      distributor: sanitizeDistributor(distributor),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A distributor with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create distributor.',
    });
  }
});

router.put('/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const { name = '', email = '', phone = '', location = '', status = 'Active' } = request.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid distributor id.' });
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

    const existingDistributor = await Distributor.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    }).select('_id');

    if (existingDistributor) {
      response.status(409).json({ success: false, message: 'A distributor with this email already exists.' });
      return;
    }

    const distributor = await Distributor.findByIdAndUpdate(
      id,
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

    if (!distributor) {
      response.status(404).json({ success: false, message: 'Distributor not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Distributor updated successfully.',
      distributor: sanitizeDistributor(distributor),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A distributor with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to update distributor.',
    });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid distributor id.' });
      return;
    }

    const deletedDistributor = await Distributor.findByIdAndDelete(id);

    if (!deletedDistributor) {
      response.status(404).json({ success: false, message: 'Distributor not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Distributor deleted successfully.',
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to delete distributor.',
    });
  }
});

export default router;
