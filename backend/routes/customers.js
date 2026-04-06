import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

const getTierFromUser = (user) => {
  const loginCount = Number(user.loginCount || 0);

  if (user.tier?.trim()) {
    return user.tier;
  }

  if (loginCount >= 5) {
    return 'Premium';
  }

  if (loginCount >= 2) {
    return 'Standard';
  }

  return 'New';
};

router.get('/', async (_request, response) => {
  try {
    const customers = await User.find({})
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .lean();

    const normalizedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      orders: String(customer.orderCount || 0),
      tier: getTierFromUser(customer),
      loginCount: Number(customer.loginCount || 0),
      createdAt: customer.createdAt,
      lastLoginAt: customer.lastLoginAt,
    }));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const premiumMembers = normalizedCustomers.filter((customer) => customer.tier === 'Premium').length;
    const newThisMonth = normalizedCustomers.filter((customer) => {
      if (!customer.createdAt) {
        return false;
      }

      const createdAt = new Date(customer.createdAt);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    }).length;
    const repeatCustomers = normalizedCustomers.filter((customer) => customer.loginCount > 1).length;
    const repeatRate =
      normalizedCustomers.length > 0
        ? `${Math.round((repeatCustomers / normalizedCustomers.length) * 100)}%`
        : '0%';

    response.status(200).json({
      success: true,
      stats: {
        activeCustomers: String(normalizedCustomers.length),
        premiumMembers: String(premiumMembers),
        newThisMonth: String(newThisMonth),
        repeatRate,
      },
      customers: normalizedCustomers,
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load customers.',
    });
  }
});

export default router;
