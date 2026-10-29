// models/VisitRequest.js
// Stores scheduling and tour requests from tenants to property landlords.

import mongoose from 'mongoose';

const visitRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
      index: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant reference is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Landlord owner reference is required'],
      index: true,
    },
    requestedDate: {
      type: Date,
      required: [true, 'Requested date is required'],
    },
    requestedTime: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    tenantName: {
      type: String,
      default: '',
      trim: true,
    },
    tenantPhone: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

visitRequestSchema.index({ property: 1, tenant: 1, createdAt: -1 });

const VisitRequest = mongoose.model('VisitRequest', visitRequestSchema);
export default VisitRequest;
