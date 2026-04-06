import { Router } from 'express';
import mongoose from 'mongoose';
import SubAdmin from '../models/SubAdmin.js';
import { hashPassword } from '../utils/passwords.js';

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

router.get('/', async (_request, response) => {
  try {
    const subAdmins = await SubAdmin.find({})
      .sort({ createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      subAdmins: subAdmins.map(sanitizeSubAdmin),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load sub admins.',
    });
  }
});

router.post('/', async (request, response) => {
  try {
    const {
      name = '',
      email = '',
      password = '',
      role = 'Manager',
      permissions = [],
    } = request.body ?? {};

    const normalizedEmail = email.trim().toLowerCase();
    const cleanedPermissions = Array.isArray(permissions)
      ? permissions.map((permission) => String(permission).trim()).filter(Boolean)
      : [];

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

    if (cleanedPermissions.length === 0) {
      response.status(400).json({ success: false, message: 'Select at least one permission.' });
      return;
    }

    const existingSubAdmin = await SubAdmin.findOne({ email: normalizedEmail }).select('_id');

    if (existingSubAdmin) {
      response.status(409).json({ success: false, message: 'A sub admin with this email already exists.' });
      return;
    }

    const subAdmin = await SubAdmin.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: role.trim() || 'Manager',
      permissions: cleanedPermissions,
      createdBy: process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin',
    });

    response.status(201).json({
      success: true,
      message: 'Sub admin created successfully.',
      subAdmin: sanitizeSubAdmin(subAdmin),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A sub admin with this email already exists.' });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create sub admin.',
    });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid sub admin id.' });
      return;
    }

    const deletedSubAdmin = await SubAdmin.findByIdAndDelete(id);

    if (!deletedSubAdmin) {
      response.status(404).json({ success: false, message: 'Sub admin not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Sub admin deleted successfully.',
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to delete sub admin.',
    });
  }
});

export default router;
