import mongoose from 'mongoose';

const registeredProductSchema = new mongoose.Schema(
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
    collection: 'registeredProducts',
    versionKey: false,
  },
);

registeredProductSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const RegisteredProduct =
  mongoose.models.RegisteredProduct ||
  mongoose.model('RegisteredProduct', registeredProductSchema);

export default RegisteredProduct;
