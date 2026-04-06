import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    role: {
      type: String,
      default: 'customer',
      trim: true,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      default: 'New',
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
  },
  {
    collection: 'customers',
    versionKey: false,
  },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
