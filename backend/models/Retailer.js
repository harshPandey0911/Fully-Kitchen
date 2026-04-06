import mongoose from 'mongoose';

const retailerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'Active',
      trim: true,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      default: 'distributor',
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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
    collection: 'retailer',
    versionKey: false,
  },
);

retailerSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Retailer = mongoose.models.Retailer || mongoose.model('Retailer', retailerSchema);

export default Retailer;
