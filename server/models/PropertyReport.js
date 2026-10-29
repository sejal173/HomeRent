// models/PropertyReport.js
// Stores tenant reports on suspicious rental listings for safety and quality compliance.

import mongoose from 'mongoose';

const propertyReportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Reported property reference is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'fake_listing',
        'duplicate_listing',
        'incorrect_information',
        'suspicious_payment_request',
        'misleading_photographs',
        'other',
      ],
      required: [true, 'Report category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolution: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate reports by the same user on the same listing
propertyReportSchema.index({ property: 1, reportedBy: 1 }, { unique: true });

const PropertyReport = mongoose.model('PropertyReport', propertyReportSchema);
export default PropertyReport;
