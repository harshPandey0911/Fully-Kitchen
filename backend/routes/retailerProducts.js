import { Router } from 'express';
import mongoose from 'mongoose';
import RetailerProduct from '../models/RetailerProduct.js';

const router = Router();

const requireRetailerRole = (request, response) => {
  const role = String(request.header('x-role') || '').toLowerCase();
  if (role !== 'retailer') {
    response.status(403).json({ success: false, message: 'Only retailers can manage this catalog.' });
    return false;
  }
  return true;
};

const sanitizeRetailerProduct = (product) => ({
  id: String(product._id),
  name: product.name,
  category: product.category,
  price: Number(product.price || 0),
  priceLabel: `Rs ${Number(product.price || 0).toLocaleString('en-IN')}`,
  sku: product.sku,
  status: product.status,
  createdBy: product.createdBy,
  createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
  updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
});

const generateSku = (name) => {
  const segments = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('');

  return `RET-${segments || 'PR'}-${Date.now().toString().slice(-5)}`;
};

router.get('/', async (_request, response) => {
  try {
    const products = await RetailerProduct.find({}).sort({ createdAt: -1 }).lean();
    response.status(200).json({
      success: true,
      retailerProducts: products.map(sanitizeRetailerProduct),
    });
  } catch (error) {
    response.status(500).json({ success: false, message: error.message || 'Unable to load retailer products.' });
  }
});

router.post('/', async (request, response) => {
  if (!requireRetailerRole(request, response)) {
    return;
  }

  try {
    const { name = '', category = '', price = 0, sku = '', status = '' } = request.body ?? {};
    const normalizedPrice = Number(price);

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

    const retailerProduct = await RetailerProduct.create({
      name: name.trim(),
      category: category.trim(),
      price: normalizedPrice,
      sku: String(sku || generateSku(name)).trim().toUpperCase(),
      status: status.trim() || 'Active',
      createdBy: String(request.header('x-user-email') || request.body?.createdBy || 'retailer').trim().toLowerCase(),
    });

    response.status(201).json({
      success: true,
      message: 'Retailer product added successfully.',
      retailerProduct: sanitizeRetailerProduct(retailerProduct),
    });
  } catch (error) {
    if (error?.code === 11000) {
      response.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
      return;
    }
    response.status(500).json({ success: false, message: error.message || 'Unable to add retailer product.' });
  }
});

router.put('/:id', async (request, response) => {
  if (!requireRetailerRole(request, response)) {
    return;
  }

  try {
    const { id } = request.params;
    const updates = request.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid retailer product id.' });
      return;
    }

    const product = await RetailerProduct.findById(id);
    if (!product) {
      response.status(404).json({ success: false, message: 'Retailer product not found.' });
      return;
    }

    const nextName = typeof updates.name === 'string' ? updates.name.trim() : product.name;
    const nextCategory = typeof updates.category === 'string' ? updates.category.trim() : product.category;
    const nextPrice = updates.price === undefined ? product.price : Number(updates.price);
    const nextStatus = typeof updates.status === 'string' && updates.status.trim() ? updates.status.trim() : product.status;

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

    product.name = nextName;
    product.category = nextCategory;
    product.price = nextPrice;
    product.status = nextStatus;
    product.updatedAt = new Date();

    await product.save();

    response.status(200).json({
      success: true,
      message: 'Retailer product updated successfully.',
      retailerProduct: sanitizeRetailerProduct(product),
    });
  } catch (error) {
    response.status(500).json({ success: false, message: error.message || 'Unable to update retailer product.' });
  }
});

router.delete('/:id', async (request, response) => {
  if (!requireRetailerRole(request, response)) {
    return;
  }

  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid retailer product id.' });
      return;
    }

    const deletedProduct = await RetailerProduct.findByIdAndDelete(id);
    if (!deletedProduct) {
      response.status(404).json({ success: false, message: 'Retailer product not found.' });
      return;
    }

    response.status(200).json({ success: true, message: 'Retailer product deleted successfully.' });
  } catch (error) {
    response.status(500).json({ success: false, message: error.message || 'Unable to delete retailer product.' });
  }
});

export default router;
