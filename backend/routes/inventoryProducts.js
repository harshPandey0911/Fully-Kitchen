import { Router } from 'express';
import mongoose from 'mongoose';
import InventoryProduct from '../models/InventoryProduct.js';
import { deriveInventoryStatus } from '../utils/seedInventoryProducts.js';

const router = Router();

const requireDistributorRole = (request, response) => {
  const role = String(request.header('x-role') || '').toLowerCase();
  if (role !== 'distributor') {
    response.status(403).json({ success: false, message: 'Only distributors can manage inventory products.' });
    return false;
  }
  return true;
};

const sanitizeInventoryProduct = (inventoryProduct) => ({
  id: String(inventoryProduct._id),
  name: inventoryProduct.name,
  product: inventoryProduct.name,
  category: inventoryProduct.category,
  price: Number(inventoryProduct.price || 0),
  priceLabel: `Rs ${Number(inventoryProduct.price || 0).toLocaleString('en-IN')}`,
  quantity: Number(inventoryProduct.quantity || 0),
  availableQty: Number(inventoryProduct.quantity || 0),
  sku: inventoryProduct.sku,
  status: inventoryProduct.status,
  createdBy: inventoryProduct.createdBy,
  createdAt:
    inventoryProduct.createdAt instanceof Date
      ? inventoryProduct.createdAt.toISOString()
      : inventoryProduct.createdAt,
  updatedAt:
    inventoryProduct.updatedAt instanceof Date
      ? inventoryProduct.updatedAt.toISOString()
      : inventoryProduct.updatedAt,
});

const generateSku = (name) => {
  const segments = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('');

  return `ADM-${segments || 'PR'}-${Date.now().toString().slice(-5)}`;
};

router.get('/', async (_request, response) => {
  try {
    const inventoryProducts = await InventoryProduct.find({})
      .sort({ createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      inventoryProducts: inventoryProducts.map(sanitizeInventoryProduct),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load inventory products.',
    });
  }
});

router.post('/', async (request, response) => {
  if (!requireDistributorRole(request, response)) {
    return;
  }

  try {
    const {
      name = '',
      category = '',
      price = 0,
      quantity = 0,
      sku = '',
      status = '',
    } = request.body ?? {};

    const normalizedPrice = Number(price);
    const normalizedQuantity = Number.parseInt(quantity, 10);

    if (!name.trim()) {
      response.status(400).json({ success: false, message: 'Product name is required.' });
      return;
    }

    if (!category.trim()) {
      response.status(400).json({ success: false, message: 'Category is required.' });
      return;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      response.status(400).json({ success: false, message: 'Enter a valid price.' });
      return;
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
      response.status(400).json({ success: false, message: 'Enter a valid stock quantity.' });
      return;
    }

    const inventoryProduct = await InventoryProduct.create({
      name: name.trim(),
      category: category.trim(),
      price: normalizedPrice,
      quantity: normalizedQuantity,
      sku: String(sku || generateSku(name)).trim().toUpperCase(),
      status: status.trim() || deriveInventoryStatus(normalizedQuantity),
      createdBy: process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin',
    });

    response.status(201).json({
      success: true,
      message: 'Inventory product created successfully.',
      inventoryProduct: sanitizeInventoryProduct(inventoryProduct),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({
        success: false,
        message: 'A product with this SKU already exists.',
      });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create inventory product.',
    });
  }
});

router.put('/:id', async (request, response) => {
  if (!requireDistributorRole(request, response)) {
    return;
  }

  try {
    const { id } = request.params;
    const updates = request.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid inventory product id.' });
      return;
    }

    const currentProduct = await InventoryProduct.findById(id);

    if (!currentProduct) {
      response.status(404).json({ success: false, message: 'Inventory product not found.' });
      return;
    }

    const nextName =
      typeof updates.name === 'string' ? updates.name.trim() : currentProduct.name;
    const nextCategory =
      typeof updates.category === 'string' ? updates.category.trim() : currentProduct.category;
    const nextPrice =
      updates.price === undefined ? currentProduct.price : Number(updates.price);
    const nextQuantity =
      updates.quantity === undefined ? currentProduct.quantity : Number.parseInt(updates.quantity, 10);
    const nextStatus =
      typeof updates.status === 'string' && updates.status.trim()
        ? updates.status.trim()
        : deriveInventoryStatus(nextQuantity);

    if (!nextName) {
      response.status(400).json({ success: false, message: 'Product name is required.' });
      return;
    }

    if (!nextCategory) {
      response.status(400).json({ success: false, message: 'Category is required.' });
      return;
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      response.status(400).json({ success: false, message: 'Enter a valid price.' });
      return;
    }

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      response.status(400).json({ success: false, message: 'Enter a valid stock quantity.' });
      return;
    }

    currentProduct.name = nextName;
    currentProduct.category = nextCategory;
    currentProduct.price = nextPrice;
    currentProduct.quantity = nextQuantity;
    currentProduct.status = nextStatus;
    currentProduct.updatedAt = new Date();

    await currentProduct.save();

    response.status(200).json({
      success: true,
      message: 'Inventory product updated successfully.',
      inventoryProduct: sanitizeInventoryProduct(currentProduct),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to update inventory product.',
    });
  }
});

router.delete('/:id', async (request, response) => {
  if (!requireDistributorRole(request, response)) {
    return;
  }

  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid inventory product id.' });
      return;
    }

    const deletedProduct = await InventoryProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      response.status(404).json({ success: false, message: 'Inventory product not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Inventory product deleted successfully.',
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to delete inventory product.',
    });
  }
});

export default router;
