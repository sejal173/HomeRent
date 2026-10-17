// middleware/validatorMiddleware.js
// Validates incoming HTTP request bodies using express-validator.
// Returns a 400 Bad Request with a clear message if validation fails.

import { body, validationResult } from 'express-validator';

// Helper: checks validation results and stops the request if there are errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// 1. Validation for user registration
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['tenant', 'landlord'])
    .withMessage('Role must be either tenant or landlord'),
  handleValidationErrors,
];

// 2. Validation for user login
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// 3. Validation for creating a property listing
export const validateCreateProperty = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Property title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('type')
    .isIn(['Apartment', 'Villa', 'House', 'Studio', 'PG'])
    .withMessage('Property type must be Apartment, Villa, House, Studio, or PG'),
  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Rent must be a positive number greater than 0'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('locality')
    .trim()
    .notEmpty()
    .withMessage('Locality / area is required'),
  body('bedrooms')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative number'),
  body('bathrooms')
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a non-negative number'),
  body('furnished')
    .optional()
    .isIn(['Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Furnishing status must be Furnished, Semi-Furnished, or Unfurnished'),
  handleValidationErrors,
];

// 4. Validation for updating a property listing
export const validateUpdateProperty = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Property title cannot be empty'),
  body('type')
    .optional()
    .isIn(['Apartment', 'Villa', 'House', 'Studio', 'PG'])
    .withMessage('Property type must be Apartment, Villa, House, Studio, or PG'),
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Rent must be a positive number greater than 0'),
  body('furnished')
    .optional()
    .isIn(['Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Furnishing status must be Furnished, Semi-Furnished, or Unfurnished'),
  handleValidationErrors,
];

// 5. Validation for updating user profile
export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('phone')
    .optional()
    .trim(),
  handleValidationErrors,
];
