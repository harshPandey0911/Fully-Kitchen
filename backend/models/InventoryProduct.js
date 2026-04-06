import mongoose from 'mongoose';

const inventoryProductSchema = new mongoose.Schema(
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
    quantity: {
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
      default: 'In Stock',
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'admin',
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
    collection: 'inventoryProducts',
    versionKey: false,
  },
);

inventoryProductSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const InventoryProduct =
  mongoose.models.InventoryProduct ||
  mongoose.model('InventoryProduct', inventoryProductSchema);

export default InventoryProduct;
