import Admin from '../models/Admin.js';
import { hashPassword } from './passwords.js';

const DEFAULT_ADMIN_NAME = 'Harsh Pandey';

export const syncAdminAccount = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing in backend/.env');
  }

  const passwordHash = hashPassword(adminPassword);

  const admin = await Admin.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: DEFAULT_ADMIN_NAME,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return admin;
};
