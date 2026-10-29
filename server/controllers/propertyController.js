// controllers/propertyController.js
// Handles all property-related operations: list, search, get one, create, update, delete.

import Property from '../models/Property.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─────────────────────────────────────────────
// @route   GET /api/properties
// @desc    Get all properties with search, filter, sort, pagination
// @access  Public
// ─────────────────────────────────────────────
export const getProperties = async (req, res) => {
  const {
    keyword,    // Search text (title, description, city, locality)
    city,       // Filter by city
    type,       // Filter by property type (Apartment, Villa, etc.)
    minPrice,   // Minimum rent
    maxPrice,   // Maximum rent
    bedrooms,   // Number of bedrooms
    furnished,  // Furnished / Semi-Furnished / Unfurnished
    sort,       // Sort order: price_asc, price_desc, newest
    page = 1,   // Current page (default: 1)
    limit = 9,  // Results per page (default: 9)
  } = req.query;

  // Build the filter object dynamically based on what the user sent
  // Public search only returns approved properties (or unmigrated properties) that are available
  const filter = {
    available: true,
    approvalStatus: { $in: ['approved', null] },
  };

  // Exclude listings owned by suspended landlords
  const suspendedOwners = await User.find({ isSuspended: true }).distinct('_id');
  if (suspendedOwners.length > 0) {
    filter.owner = { $nin: suspendedOwners };
  }

  if (keyword) {
    filter.$text = { $search: keyword }; // Uses the text index for fast search
  }
  if (city) filter.city = { $regex: city, $options: 'i' }; // case-insensitive match
  if (type) filter.type = type;
  if (bedrooms) filter.bedrooms = Number(bedrooms);
  if (furnished) filter.furnished = furnished;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Build sort object
  let sortOption = { createdAt: -1 }; // Default: newest first
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  // Run the query
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name email phone'), // Include owner's name, email, phone
    Property.countDocuments(filter),
  ]);

  res.json({
    properties,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/properties/:id
// @desc    Get a single property by its ID
// @access  Public
// ─────────────────────────────────────────────
export const getPropertyById = async (req, res) => {
  const property = await Property.findById(req.params.id).populate('owner', 'name email phone isSuspended');

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Public users can only see approved listings whose owner is NOT suspended (Rule 3.3).
  // Allow owners and admins to preview their own/any listing even if pending/rejected/removed or suspended.
  const isOwnerSuspended = Boolean(property.owner?.isSuspended);
  const isPubliclyVisible = (!property.approvalStatus || property.approvalStatus === 'approved') && !isOwnerSuspended;

  if (!isPubliclyVisible) {
    let authorized = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer') && process.env.JWT_SECRET) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && (user.role === 'admin' || property.owner._id.toString() === user._id.toString())) {
          authorized = true;
        }
      } catch {
        // Token invalid or expired
      }
    }
    if (!authorized) {
      return res.status(404).json({ message: 'Property not found or is currently unavailable.' });
    }
  }

  res.json(property);
};

// ─────────────────────────────────────────────
// @route   POST /api/properties
// @desc    Create a new property listing
// @access  Private + Landlord only
// ─────────────────────────────────────────────
export const createProperty = async (req, res) => {
  const {
    title, description, type, price, city, locality,
    bedrooms, bathrooms, furnished, amenities, images,
  } = req.body;

  const property = await Property.create({
    title, description, type, price, city, locality,
    bedrooms, bathrooms, furnished, amenities, images,
    owner: req.user._id, // The logged-in user becomes the owner
    approvalStatus: 'pending', // New listings start as pending per rule 6
  });

  res.status(201).json(property);
};

// ─────────────────────────────────────────────
// @route   PUT /api/properties/:id
// @desc    Update a property (only the owner can do this)
// @access  Private + Owner only
// ─────────────────────────────────────────────
export const updateProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Security check: make sure the logged-in user owns this property
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to edit this property' });
  }

  // Rule A.2: If property was administratively removed, edits must be refused (403)
  if (property.approvalStatus === 'removed') {
    return res.status(403).json({
      message: 'This property listing has been administratively removed and cannot be edited. Please contact support.',
    });
  }

  // Field allowlist to prevent mass-assignment of sensitive/admin-only attributes
  const allowedFields = [
    'title', 'description', 'type', 'price', 'city', 'locality',
    'bedrooms', 'bathrooms', 'furnished', 'amenities', 'images', 'available',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Rule A.2: If property was rejected, landlord edit moves it back to 'pending' (resubmission)
  if (property.approvalStatus === 'rejected') {
    updateData.approvalStatus = 'pending';
    updateData.rejectionReason = '';
    property.approvalHistory.push({
      status: 'pending',
      reason: 'Resubmitted by landlord after changes',
      date: new Date(),
    });
    updateData.approvalHistory = property.approvalHistory;
  }

  // Update only allowlisted fields safely
  const updated = await Property.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  res.json(updated);
};

// ─────────────────────────────────────────────
// @route   DELETE /api/properties/:id
// @desc    Delete a property (only the owner can do this)
// @access  Private + Owner only
// ─────────────────────────────────────────────
export const deleteProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Security check: only the owner can delete
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this property' });
  }

  await property.deleteOne();
  res.json({ message: 'Property deleted successfully' });
};

// ─────────────────────────────────────────────
// @route   GET /api/properties/my-listings
// @desc    Get all properties listed by the logged-in landlord
// @access  Private + Landlord only
// ─────────────────────────────────────────────
export const getMyListings = async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(properties);
};
