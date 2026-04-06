import mongoose from 'mongoose';

const restockRequestSchema = new mongoose.Schema(
  {
    retailerName: {
      type: String,
      required: true,
      trim: true,
    },
    retailerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    modelNumber: {
      type: String,
      default: '',
      trim: true,
    },
    customerName: {
      type: String,
      default: '',
      trim: true,
    },
    customerEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    requestNote: {
      type: String,
      default: '',
      trim: true,
    },
    requestedQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      default: 'Pending',
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
    collection: 'restockRequests',
    versionKey: false,
  },
);

restockRequestSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const RestockRequest =
  mongoose.models.RestockRequest || mongoose.model('RestockRequest', restockRequestSchema);

export default RestockRequest;
