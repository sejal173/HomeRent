// models/VerificationSubmission.js
// Stores property-level verification documents and review workflow.

import mongoose from 'mongoose';

const verificationSubmissionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property owner reference is required'],
      index: true,
    },
    documents: [
      {
        originalName: { type: String, required: true },
        filename: { type: String, required: true },
        path: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
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
    resubmissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

verificationSubmissionSchema.index({ property: 1, createdAt: -1 });

const VerificationSubmission = mongoose.model('VerificationSubmission', verificationSubmissionSchema);
export default VerificationSubmission;
