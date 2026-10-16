// models/User.js
// This defines the shape of a User document in MongoDB.
// Think of this like a form template — every user must follow this structure.

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,           // No two users with same email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,          // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['tenant', 'landlord'],  // Only these two values are allowed
      default: 'tenant',
    },
    phone: {
      type: String,
      default: '',
    },
    savedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',      // References the Property model
      },
    ],
  },
  {
    timestamps: true,         // Adds createdAt and updatedAt automatically
  }
);

// Before saving, hash the password if it was changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();  // Skip if password not changed
  this.password = await bcrypt.hash(this.password, 10); // 10 = salt rounds
  next();
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
