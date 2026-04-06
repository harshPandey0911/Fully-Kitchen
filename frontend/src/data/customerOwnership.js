import { customerProducts } from './customerProducts';
import { APP_NAME } from '../constants/branding';

const productImages = {
  'Mixer Grinder': customerProducts.find((product) => product.name === 'Mixer Grinder Pro')?.image || customerProducts[0]?.image || '',
  'Microwave Oven': customerProducts.find((product) => product.name === 'Microwave Oven')?.image || customerProducts[1]?.image || '',
  'Air Fryer': customerProducts.find((product) => product.name === 'Air Fryer Max')?.image || customerProducts[2]?.image || '',
  Refrigerator: customerProducts.find((product) => product.name === 'Refrigerator Plus')?.image || customerProducts[3]?.image || '',
  'Electric Kettle': customerProducts.find((product) => product.name === 'Electric Kettle')?.image || customerProducts[4]?.image || '',
  Toaster: customerProducts.find((product) => product.name === 'Toaster Duo')?.image || customerProducts[5]?.image || '',
};

export const ownershipProductOptions = [
  { name: 'Mixer Grinder', image: productImages['Mixer Grinder'] },
  { name: 'Microwave Oven', image: productImages['Microwave Oven'] },
  { name: 'Air Fryer', image: productImages['Air Fryer'] },
  { name: 'Refrigerator', image: productImages.Refrigerator },
  { name: 'Electric Kettle', image: productImages['Electric Kettle'] },
  { name: 'Toaster', image: productImages.Toaster },
];

export const warrantyPeriodOptions = [6, 12, 18, 24, 36, 48];
export const serviceIssueTypes = ['Repair', 'Installation', 'Replacement'];

export const initialOwnedProducts = [
  {
    id: 'prd-1001',
    productName: 'Mixer Grinder',
    brand: APP_NAME,
    modelNumber: 'KH-MX500',
    purchaseDate: '2025-05-14',
    warrantyMonths: 24,
    invoiceName: 'mixer-invoice.pdf',
  },
  {
    id: 'prd-1002',
    productName: 'Microwave Oven',
    brand: 'HomeCore',
    modelNumber: 'HC-MW22L',
    purchaseDate: '2025-04-08',
    warrantyMonths: 12,
    invoiceName: 'microwave-bill.pdf',
  },
  {
    id: 'prd-1003',
    productName: 'Air Fryer',
    brand: 'QuickChef',
    modelNumber: 'QC-AF360',
    purchaseDate: '2024-01-12',
    warrantyMonths: 12,
    invoiceName: '',
  },
  {
    id: 'prd-1004',
    productName: 'Refrigerator',
    brand: APP_NAME,
    modelNumber: 'KH-RF420',
    purchaseDate: '2025-08-20',
    warrantyMonths: 24,
    invoiceName: 'refrigerator-invoice.pdf',
  },
];

export const initialServiceRequests = [
  {
    id: 'SR-4101',
    productId: 'prd-1001',
    productName: 'Mixer Grinder',
    issueType: 'Repair',
    description: 'Motor overheats during longer grinding cycles.',
    status: 'In Progress',
    assignedTechnician: 'Rohit Menon',
    imageName: 'motor-panel.jpg',
    createdAt: '2026-04-01T10:20:00',
    updatedAt: '2026-04-02T15:10:00',
  },
  {
    id: 'SR-4102',
    productId: 'prd-1002',
    productName: 'Microwave Oven',
    issueType: 'Installation',
    description: 'Need help with setup and first-time configuration.',
    status: 'Pending',
    assignedTechnician: 'Unassigned',
    imageName: '',
    createdAt: '2026-04-03T08:35:00',
    updatedAt: '2026-04-03T08:35:00',
  },
  {
    id: 'SR-4095',
    productId: 'prd-1003',
    productName: 'Air Fryer',
    issueType: 'Replacement',
    description: 'Basket coating was peeling after repeated use.',
    status: 'Completed',
    assignedTechnician: 'Ananya Shah',
    imageName: 'basket-issue.png',
    createdAt: '2026-03-24T13:15:00',
    updatedAt: '2026-03-27T17:00:00',
  },
];

const staticOrderNotifications = [
  {
    id: 'order-1001',
    type: 'order',
    tone: 'info',
    title: 'Accessory order dispatched',
    message: 'Your replacement glass tray for the Microwave Oven is on the way.',
    createdAt: '2026-04-02T09:00:00',
  },
  {
    id: 'order-1002',
    type: 'order',
    tone: 'success',
    title: 'Starter kit delivered',
    message: 'Your Air Fryer starter accessories were delivered successfully.',
    createdAt: '2026-03-29T18:10:00',
  },
];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const getDayDifference = (laterDate, earlierDate) => {
  const later = startOfDay(laterDate).getTime();
  const earlier = startOfDay(earlierDate).getTime();
  return Math.round((later - earlier) / 86400000);
};

export const formatDisplayDate = (value) => {
  const date = normalizeDate(value);
  if (!date) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getProductImage = (productName) => productImages[productName] || customerProducts[0]?.image || '';

export const getWarrantyDetails = (purchaseDate, warrantyMonths) => {
  const purchase = normalizeDate(purchaseDate);

  if (!purchase || !warrantyMonths) {
    return {
      status: 'unknown',
      expiryDate: null,
      daysRemaining: 0,
      progressPercent: 0,
      totalDays: 0,
      elapsedDays: 0,
    };
  }

  const today = startOfDay(new Date());
  const expiry = new Date(purchase);
  expiry.setMonth(expiry.getMonth() + Number(warrantyMonths));

  const totalDays = Math.max(getDayDifference(expiry, purchase), 1);
  const elapsedDays = clamp(getDayDifference(today, purchase), 0, totalDays);
  const daysRemaining = getDayDifference(expiry, today);
  const progressPercent = clamp(Math.round((elapsedDays / totalDays) * 100), 0, 100);

  return {
    status: daysRemaining >= 0 ? 'active' : 'expired',
    expiryDate: expiry.toISOString(),
    daysRemaining,
    progressPercent,
    totalDays,
    elapsedDays,
  };
};

const buildServiceNotification = (request) => {
  if (request.status === 'Completed') {
    return {
      id: `service-${request.id}`,
      type: 'service',
      tone: 'success',
      title: 'Service request completed',
      message: `${request.assignedTechnician} completed the ${request.issueType.toLowerCase()} request for your ${request.productName}.`,
      createdAt: request.updatedAt || request.createdAt,
    };
  }

  if (request.status === 'In Progress') {
    return {
      id: `service-${request.id}`,
      type: 'service',
      tone: 'accent',
      title: 'Technician assigned',
      message: `${request.assignedTechnician} is currently handling your ${request.productName} ${request.issueType.toLowerCase()} request.`,
      createdAt: request.updatedAt || request.createdAt,
    };
  }

  return {
    id: `service-${request.id}`,
    type: 'service',
    tone: 'info',
    title: 'Service request received',
    message: `We logged your ${request.issueType.toLowerCase()} request for ${request.productName}.`,
    createdAt: request.createdAt,
  };
};

export const buildCustomerNotifications = (products, serviceRequests) => {
  const warrantyNotifications = products.flatMap((product) => {
    const warranty = getWarrantyDetails(product.purchaseDate, product.warrantyMonths);

    if (warranty.status === 'active' && warranty.daysRemaining <= 30) {
      return [
        {
          id: `warranty-${product.id}`,
          type: 'warranty',
          tone: warranty.daysRemaining <= 7 ? 'danger' : 'warning',
          title: `${product.productName} warranty expiring soon`,
          message: `Your ${product.productName} warranty expires in ${Math.max(warranty.daysRemaining, 0)} day${warranty.daysRemaining === 1 ? '' : 's'}.`,
          createdAt: warranty.expiryDate,
        },
      ];
    }

    if (warranty.status === 'expired') {
      return [
        {
          id: `warranty-expired-${product.id}`,
          type: 'warranty',
          tone: 'danger',
          title: `${product.productName} warranty expired`,
          message: `Coverage ended on ${formatDisplayDate(warranty.expiryDate)}. Raise a service request anytime you need support.`,
          createdAt: warranty.expiryDate,
        },
      ];
    }

    return [];
  });

  return [...warrantyNotifications, ...serviceRequests.map(buildServiceNotification), ...staticOrderNotifications].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
};
