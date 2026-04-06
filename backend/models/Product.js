import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sourceRegistrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    modelNumber: {
      type: String,
      required: true,
      trim: true,
    },
    purchaseDate: {
      type: String,
      required: true,
      trim: true,
    },
    warrantyMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    invoiceName: {
      type: String,
      default: '',
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
    collection: 'products',
    versionKey: false,
  },
);

productSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
