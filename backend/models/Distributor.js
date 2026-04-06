import mongoose from 'mongoose';

const distributorSchema = new mongoose.Schema(
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
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      default: 'admin',
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
    collection: 'distributor',
    versionKey: false,
  },
);

distributorSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Distributor = mongoose.models.Distributor || mongoose.model('Distributor', distributorSchema);

export default Distributor;
