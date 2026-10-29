// controllers/reviewController.js
// Handles tenant property ratings, feedback reviews, and public listings.

import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Property from '../models/Property.js';

// ─────────────────────────────────────────────
// @route   POST /api/reviews
// @desc    Submit a review on a property (Tenants only, 1 review per property per user)
// @access  Private
// ─────────────────────────────────────────────
export const createReview = async (req, res) => {
  const { propertyId, rating, text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Review text cannot be empty' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Prevent landlords from reviewing their own property
  if (property.owner.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot write a review for your own property.' });
  }

  // Check for duplicate review
  const existingReview = await Review.findOne({ property: propertyId, reviewer: req.user._id });
  if (existingReview) {
    return res.status(400).json({ message: 'You have already submitted a review for this property.' });
  }

  const review = await Review.create({
    property: propertyId,
    reviewer: req.user._id,
    rating: numRating,
    text: text.trim(),
    originalContentSnapshot: text.trim(),
  });

  const populated = await Review.findById(review._id).populate('reviewer', 'name');

  res.status(201).json(populated);
};

// ─────────────────────────────────────────────
// @route   GET /api/reviews/property/:propertyId
// @desc    Get all non-hidden reviews for a property
// @access  Public
// ─────────────────────────────────────────────
export const getPropertyReviews = async (req, res) => {
  const { propertyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  // Only show reviews where isHidden is false (Rule 9)
  const reviews = await Review.find({ property: propertyId, isHidden: { $ne: true } })
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
};
