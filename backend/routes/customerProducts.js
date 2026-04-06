import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import RegisteredProduct from '../models/RegisteredProduct.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value).includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getRegistrationStatus = (purchaseDate, warrantyMonths) => {
  const parsedPurchaseDate = parseDateValue(purchaseDate);

  if (!parsedPurchaseDate || !warrantyMonths) {
    return {
      status: 'Unknown',
      warrantyExpiryDate: null,
    };
  }

  const warrantyExpiryDate = new Date(parsedPurchaseDate);
  warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + Number(warrantyMonths));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  warrantyExpiryDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.round((warrantyExpiryDate.getTime() - today.getTime()) / 86400000);

  if (daysRemaining < 0) {
    return {
      status: 'Expired',
      warrantyExpiryDate: warrantyExpiryDate.toISOString(),
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'Expiring Soon',
      warrantyExpiryDate: warrantyExpiryDate.toISOString(),
    };
  }

  return {
    status: 'Active',
    warrantyExpiryDate: warrantyExpiryDate.toISOString(),
  };
};

const sanitizeRegisteredProduct = (registeredProduct) => {
  const warrantySnapshot = getRegistrationStatus(
    registeredProduct.purchaseDate,
    registeredProduct.warrantyMonths,
  );

  return {
    id: String(registeredProduct._id),
    customerEmail: registeredProduct.customerEmail,
    customerName: registeredProduct.customerName,
    productName: registeredProduct.productName,
    brand: registeredProduct.brand,
    modelNumber: registeredProduct.modelNumber,
    purchaseDate: registeredProduct.purchaseDate,
    warrantyMonths: Number(registeredProduct.warrantyMonths || 0),
    invoiceName: registeredProduct.invoiceName || '',
    status: warrantySnapshot.status,
    warrantyExpiryDate: warrantySnapshot.warrantyExpiryDate,
    createdAt:
      registeredProduct.createdAt instanceof Date
        ? registeredProduct.createdAt.toISOString()
        : registeredProduct.createdAt,
    updatedAt:
      registeredProduct.updatedAt instanceof Date
        ? registeredProduct.updatedAt.toISOString()
        : registeredProduct.updatedAt,
  };
};

const buildProductMirrorPayload = (registeredProduct) => ({
  sourceRegistrationId: String(registeredProduct._id),
  customerEmail: registeredProduct.customerEmail,
  customerName: registeredProduct.customerName,
  productName: registeredProduct.productName,
  brand: registeredProduct.brand,
  modelNumber: registeredProduct.modelNumber,
  purchaseDate: registeredProduct.purchaseDate,
  warrantyMonths: Number(registeredProduct.warrantyMonths || 0),
  invoiceName: registeredProduct.invoiceName || '',
  createdAt: registeredProduct.createdAt,
  updatedAt: new Date(),
});

const syncProductMirror = async (registeredProduct) => {
  await Product.findOneAndUpdate(
    { sourceRegistrationId: String(registeredProduct._id) },
    {
      $set: buildProductMirrorPayload(registeredProduct),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

router.get('/', async (request, response) => {
  try {
    const customerEmail = String(request.query.customerEmail || '').trim().toLowerCase();
    const filter = customerEmail ? { customerEmail } : {};

    const registeredProducts = await RegisteredProduct.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    await Promise.all(
      registeredProducts.map((registeredProduct) => syncProductMirror(registeredProduct)),
    );

    response.status(200).json({
      success: true,
      registeredProducts: registeredProducts.map(sanitizeRegisteredProduct),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load registered products.',
    });
  }
});

router.post('/', async (request, response) => {
  try {
    const {
      customerEmail = '',
      customerName = '',
      productName = '',
      brand = '',
      modelNumber = '',
      purchaseDate = '',
      warrantyMonths = 0,
      invoiceName = '',
    } = request.body ?? {};

    const normalizedCustomerEmail = customerEmail.trim().toLowerCase();
    const normalizedWarrantyMonths = Number(warrantyMonths);

    if (!normalizedCustomerEmail) {
      response.status(400).json({ success: false, message: 'Customer email is required.' });
      return;
    }

    if (!emailPattern.test(normalizedCustomerEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid customer email address.' });
      return;
    }

    if (!customerName.trim()) {
      response.status(400).json({ success: false, message: 'Customer name is required.' });
      return;
    }

    if (!productName.trim() || !brand.trim() || !modelNumber.trim()) {
      response.status(400).json({
        success: false,
        message: 'Product name, brand, and model number are required.',
      });
      return;
    }

    if (!purchaseDate.trim() || !parseDateValue(purchaseDate)) {
      response.status(400).json({ success: false, message: 'Enter a valid purchase date.' });
      return;
    }

    if (!Number.isFinite(normalizedWarrantyMonths) || normalizedWarrantyMonths <= 0) {
      response.status(400).json({ success: false, message: 'Enter a valid warranty period.' });
      return;
    }

    const registeredProduct = await RegisteredProduct.create({
      customerEmail: normalizedCustomerEmail,
      customerName: customerName.trim(),
      productName: productName.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber.trim(),
      purchaseDate: purchaseDate.trim(),
      warrantyMonths: normalizedWarrantyMonths,
      invoiceName: invoiceName.trim(),
    });

    await syncProductMirror(registeredProduct);

    response.status(201).json({
      success: true,
      message: 'Product registered successfully.',
      registeredProduct: sanitizeRegisteredProduct(registeredProduct),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to register product.',
    });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).json({ success: false, message: 'Invalid registered product id.' });
      return;
    }

    const deletedProduct = await RegisteredProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      response.status(404).json({ success: false, message: 'Registered product not found.' });
      return;
    }

    await Product.findOneAndDelete({ sourceRegistrationId: id });

    response.status(200).json({
      success: true,
      message: 'Registered product deleted successfully.',
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to delete registered product.',
    });
  }
});

export default router;
