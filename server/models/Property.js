// models/Property.js
// This defines the shape of a Property document in MongoDB.
// Each property listing in the database follows this structure.

import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    type: {
      type: String,
      enum: ['Apartment', 'Villa', 'House', 'Studio', 'PG'],
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    furnished: {
      type: String,
      enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'],
      default: 'Unfurnished',
    },
    amenities: {
      type: [String],          // Array of strings e.g. ['Parking', 'Gym']
      default: [],
    },
    images: {
      type: [String],          // Array of image URLs
      default: [],
    },
    available: {
      type: Boolean,
      default: true,           // Is the property available to rent?
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'removed'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    removalReason: {
      type: String,
      default: '',
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    approvalHistory: [
      {
        status: { type: String, required: true },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, default: '' },
        date: { type: Date, default: Date.now },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',             // Who listed this property
      required: true,
    },
  },
  {
    timestamps: true,          // Adds createdAt and updatedAt automatically
  }
);

// ── Indexes for Optimized Query Performance ─────────────────────────────────

// 1. Full-Text Search: speeds up search by keywords across title, description, area/locality, and city
propertySchema.index({ title: 'text', description: 'text', locality: 'text', city: 'text' });

// 2. Compound Index (city + propertyType + rent): optimizes standard rental search filters
propertySchema.index({ city: 1, type: 1, price: 1 });

// 3. Compound Index (city + rent + bedrooms): optimizes budget and bedroom searches in a city
propertySchema.index({ city: 1, price: 1, bedrooms: 1 });

// 4. Foreign Key Index (owner): speeds up landlord lookups on "my listings" (/api/properties/my-listings)
propertySchema.index({ owner: 1 });

// 5. Single field indexes for standalone filters
// Note: We do NOT need a standalone { city: 1 } index because both compound indexes
// above start with `city`. In MongoDB, the compound index already serves single-field city queries.
propertySchema.index({ price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ approvalStatus: 1, available: 1 });

const Property = mongoose.model('Property', propertySchema);
export default Property;
