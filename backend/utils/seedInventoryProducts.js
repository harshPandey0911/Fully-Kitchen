import InventoryProduct from '../models/InventoryProduct.js';

const LOW_STOCK_THRESHOLD = 10;

const legacySeedSkus = [
  'ADM-IC-124',
  'ADM-WM-349',
  'ADM-RF-485',
  'ADM-MG-319',
  'ADM-WP-158',
  'ADM-MO-899',
];

export const deriveInventoryStatus = (quantity) =>
  Number(quantity) < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';

export const syncInventoryProductsCatalog = async () => {
  const cleanupResult = await InventoryProduct.deleteMany({
    sku: { $in: legacySeedSkus },
  });

  if (cleanupResult.deletedCount > 0) {
    console.log(`Removed ${cleanupResult.deletedCount} legacy inventory seed records.`);
  }

  const inventoryCount = await InventoryProduct.countDocuments();
  console.log(`Inventory catalog ready with ${inventoryCount} products.`);
};
