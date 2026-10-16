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

// TEXT INDEX for fast full-text search on title, description, city, locality
// We will measure performance before and after adding this index
propertySchema.index({ title: 'text', description: 'text', city: 'text', locality: 'text' });

// Regular indexes for fast filtering queries
propertySchema.index({ city: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ bedrooms: 1 });

const Property = mongoose.model('Property', propertySchema);
export default Property;
