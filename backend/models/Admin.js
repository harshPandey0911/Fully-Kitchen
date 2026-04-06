import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
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
    role: {
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
    collection: 'admin',
    versionKey: false,
  },
);

adminSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
