import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    issueType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageName: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      default: 'Pending',
      trim: true,
    },
    assignedTechnician: {
      type: String,
      default: 'Support Desk',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'serviceRequests',
    versionKey: false,
  },
);

serviceRequestSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const ServiceRequest =
  mongoose.models.ServiceRequest ||
  mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
