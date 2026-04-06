import mongoose from 'mongoose';

const retailerProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'Active',
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'retailer',
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
    collection: 'retailerProducts',
    versionKey: false,
  },
);

retailerProductSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const RetailerProduct =
  mongoose.models.RetailerProduct ||
  mongoose.model('RetailerProduct', retailerProductSchema);

export default RetailerProduct;
