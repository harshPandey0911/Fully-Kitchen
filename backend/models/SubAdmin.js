import mongoose from 'mongoose';

const subAdminSchema = new mongoose.Schema(
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
      default: 'Manager',
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
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
    collection: 'subadmin',
    versionKey: false,
  },
);

subAdminSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const SubAdmin = mongoose.models.SubAdmin || mongoose.model('SubAdmin', subAdminSchema);

export default SubAdmin;
