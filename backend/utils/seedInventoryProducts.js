import InventoryProduct from '../models/InventoryProduct.js';

const LOW_STOCK_THRESHOLD = 10;

const defaultInventoryProducts = [
  {
    name: 'Induction Cooktop',
    category: 'Cooking',
    price: 12499,
    quantity: 45,
    sku: 'ADM-IC-124',
  },
  {
    name: 'Washing Machine',
    category: 'Laundry',
    price: 34999,
    quantity: 8,
    sku: 'ADM-WM-349',
  },
  {
    name: 'Refrigerator',
    category: 'Cooling',
    price: 48500,
    quantity: 22,
    sku: 'ADM-RF-485',
  },
  {
    name: 'Mixer Grinder',
    category: 'Kitchen',
    price: 3199,
    quantity: 65,
    sku: 'ADM-MG-319',
  },
  {
    name: 'Water Purifier',
    category: 'Water',
    price: 15800,
    quantity: 5,
    sku: 'ADM-WP-158',
  },
  {
    name: 'Microwave Oven',
    category: 'Cooking',
    price: 8999,
    quantity: 3,
    sku: 'ADM-MO-899',
  },
];

export const deriveInventoryStatus = (quantity) =>
  Number(quantity) < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';

export const syncInventoryProductsCatalog = async () => {
  const createdBy = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin';
  const existingProducts = await InventoryProduct.find(
    { sku: { $in: defaultInventoryProducts.map((item) => item.sku) } },
    { sku: 1 },
  ).lean();
  const existingSkus = new Set(existingProducts.map((item) => item.sku));
  const missingProducts = defaultInventoryProducts.filter((item) => !existingSkus.has(item.sku));

  if (missingProducts.length > 0) {
    await InventoryProduct.insertMany(
      missingProducts.map((item) => ({
        ...item,
        status: deriveInventoryStatus(item.quantity),
        createdBy,
      })),
    );
    console.log(
      `Seeded ${missingProducts.length} inventory products for admin and distributor panels.`,
    );
  }

  const inventoryCount = await InventoryProduct.countDocuments();
  console.log(`Inventory catalog ready with ${inventoryCount} products.`);
};
