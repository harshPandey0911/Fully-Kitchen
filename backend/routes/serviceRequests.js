import { Router } from 'express';
import ServiceRequest from '../models/ServiceRequest.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeServiceRequest = (serviceRequest) => ({
  id: String(serviceRequest._id),
  customerEmail: serviceRequest.customerEmail,
  customerName: serviceRequest.customerName,
  customerPhone: serviceRequest.customerPhone || '',
  productId: serviceRequest.productId,
  productName: serviceRequest.productName,
  issueType: serviceRequest.issueType,
  description: serviceRequest.description,
  imageName: serviceRequest.imageName || '',
  status: serviceRequest.status,
  assignedTechnician: serviceRequest.assignedTechnician,
  createdAt:
    serviceRequest.createdAt instanceof Date
      ? serviceRequest.createdAt.toISOString()
      : serviceRequest.createdAt,
  updatedAt:
    serviceRequest.updatedAt instanceof Date
      ? serviceRequest.updatedAt.toISOString()
      : serviceRequest.updatedAt,
});

router.get('/', async (request, response) => {
  try {
    const customerEmail = String(request.query.customerEmail || '').trim().toLowerCase();
    const filter = customerEmail ? { customerEmail } : {};

    const serviceRequests = await ServiceRequest.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    response.status(200).json({
      success: true,
      serviceRequests: serviceRequests.map(sanitizeServiceRequest),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to load service requests.',
    });
  }
});

router.post('/', async (request, response) => {
  try {
    const {
      customerEmail = '',
      customerName = '',
      customerPhone = '',
      productId = '',
      productName = '',
      issueType = '',
      description = '',
      imageName = '',
      assignedTechnician = 'Support Desk',
    } = request.body ?? {};

    const normalizedCustomerEmail = customerEmail.trim().toLowerCase();

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

    if (!productId.trim() || !productName.trim() || !issueType.trim()) {
      response.status(400).json({
        success: false,
        message: 'Product and issue details are required.',
      });
      return;
    }

    if (!description.trim()) {
      response.status(400).json({ success: false, message: 'Please describe the issue.' });
      return;
    }

    const serviceRequest = await ServiceRequest.create({
      customerEmail: normalizedCustomerEmail,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      productId: productId.trim(),
      productName: productName.trim(),
      issueType: issueType.trim(),
      description: description.trim(),
      imageName: imageName.trim(),
      status: 'Pending',
      assignedTechnician: assignedTechnician.trim() || 'Support Desk',
    });

    response.status(201).json({
      success: true,
      message: 'Service request created successfully.',
      serviceRequest: sanitizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: error.message || 'Unable to create service request.',
    });
  }
});

export default router;
