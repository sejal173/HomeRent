// controllers/userController.js
// Handles user-related actions: save/unsave a property, get saved properties, update profile.

import User from '../models/User.js';

// ─────────────────────────────────────────────
// @route   POST /api/users/save/:propertyId
// @desc    Save or unsave a property (toggle)
// @access  Private
// ─────────────────────────────────────────────
export const toggleSaveProperty = async (req, res) => {
  const user = await User.findById(req.user._id);
  const propertyId = req.params.propertyId;

  // Check if property is already saved
  const isSaved = user.savedProperties.includes(propertyId);

  if (isSaved) {
    // If already saved, remove it (unsave)
    user.savedProperties = user.savedProperties.filter(
      (id) => id.toString() !== propertyId
    );
    await user.save();
    return res.json({ message: 'Property removed from saved list', saved: false });
  } else {
    // If not saved, add it
    user.savedProperties.push(propertyId);
    await user.save();
    return res.json({ message: 'Property saved successfully', saved: true });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/users/saved
// @desc    Get all saved properties for the logged-in user
// @access  Private
// ─────────────────────────────────────────────
export const getSavedProperties = async (req, res) => {
  // populate() replaces the property IDs with the actual property data
  const user = await User.findById(req.user._id).populate({
    path: 'savedProperties',
    populate: { path: 'owner', select: 'name email' },
  });

  res.json(user.savedProperties);
};

// ─────────────────────────────────────────────
// @route   PUT /api/users/profile
// @desc    Update logged-in user's name, phone (not password here)
// @access  Private
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Only update name and phone — email and role changes need extra validation
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    phone: updated.phone,
  });
};
