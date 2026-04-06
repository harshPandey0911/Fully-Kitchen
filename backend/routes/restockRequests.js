import { Router } from 'express';
import RestockRequest from '../models/RestockRequest.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeRestockRequest = (request) => ({
  id: String(request._id),
  retailerName: request.retailerName,
  retailerEmail: request.retailerEmail,
  productName: request.productName,
  brand: request.brand || '',
  modelNumber: request.modelNumber || '',
  customerName: request.customerName || '',
  customerEmail: request.customerEmail || '',
  requestNote: request.requestNote || '',
  requestedQuantity: Number(request.requestedQuantity || 1),
  status: request.status,
  createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
  updatedAt: request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt,
});

router.get('/', async (request, response) => {
  try {
    const retailerEmail = String(request.query.retailerEmail || '').trim().toLowerCase();
    const filter = retailerEmail ? { retailerEmail } : {};

    const requests = await RestockRequest.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      restockRequests: requests.map(sanitizeRestockRequest),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load restock requests.',
    });
  }
});

router.post('/', async (request, response) => {
  try {
    const {
      retailerName = '',
      retailerEmail = '',
      productName = '',
      brand = '',
      modelNumber = '',
      customerName = '',
      customerEmail = '',
      requestNote = '',
      requestedQuantity = 1,
    } = request.body ?? {};

    const normalizedRetailerEmail = retailerEmail.trim().toLowerCase();
    const normalizedCustomerEmail = customerEmail.trim().toLowerCase();
    const normalizedQuantity = Number(requestedQuantity || 1);

    if (!retailerName.trim()) {
      response.status(400).json({ success: false, message: 'Retailer name is required.' });
      return;
    }

    if (!normalizedRetailerEmail) {
      response.status(400).json({ success: false, message: 'Retailer email is required.' });
      return;
    }

    if (!emailPattern.test(normalizedRetailerEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid retailer email address.' });
      return;
    }

    if (!productName.trim()) {
      response.status(400).json({ success: false, message: 'Product name is required.' });
      return;
    }

    if (normalizedCustomerEmail && !emailPattern.test(normalizedCustomerEmail)) {
      response.status(400).json({ success: false, message: 'Enter a valid customer email address.' });
      return;
    }

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      response.status(400).json({ success: false, message: 'Enter a valid requested quantity.' });
      return;
    }

    const restockRequest = await RestockRequest.create({
      retailerName: retailerName.trim(),
      retailerEmail: normalizedRetailerEmail,
      productName: productName.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber.trim(),
      customerName: customerName.trim(),
      customerEmail: normalizedCustomerEmail,
      requestNote: requestNote.trim(),
      requestedQuantity: normalizedQuantity,
      status: 'Pending',
    });

    response.status(201).json({
      success: true,
      message: 'Restock request created successfully.',
      restockRequest: sanitizeRestockRequest(restockRequest),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create restock request.',
    });
  }
});

router.patch('/:id', async (request, response) => {
  try {
    const { id } = request.params;
    const { status = '' } = request.body ?? {};
    const normalizedStatus = status.trim();

    if (!normalizedStatus) {
      response.status(400).json({ success: false, message: 'Status is required.' });
      return;
    }

    if (!['Pending', 'Accepted', 'Rejected'].includes(normalizedStatus)) {
      response.status(400).json({ success: false, message: 'Invalid status value.' });
      return;
    }

    const updated = await RestockRequest.findByIdAndUpdate(
      id,
      { $set: { status: normalizedStatus, updatedAt: new Date() } },
      { new: true },
    );

    if (!updated) {
      response.status(404).json({ success: false, message: 'Restock request not found.' });
      return;
    }

    response.status(200).json({
      success: true,
      message: 'Restock request updated.',
      restockRequest: sanitizeRestockRequest(updated),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to update restock request.',
    });
  }
});

export default router;
