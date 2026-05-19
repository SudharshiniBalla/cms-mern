const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'author', 'viewer'],
      default: 'author',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    permissions: {
      canPublish: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Set permissions based on role
userSchema.pre('save', function (next) {
  const rolePermissions = {
    admin: { canPublish: true, canDelete: true, canManageUsers: true, canManageSettings: true },
    editor: { canPublish: true, canDelete: true, canManageUsers: false, canManageSettings: false },
    author: { canPublish: false, canDelete: false, canManageUsers: false, canManageSettings: false },
    viewer: { canPublish: false, canDelete: false, canManageUsers: false, canManageSettings: false },
  };
  if (this.isModified('role')) {
    this.permissions = rolePermissions[this.role];
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
