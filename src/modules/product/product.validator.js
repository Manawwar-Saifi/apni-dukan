import { body } from 'express-validator';

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('priceType')
    .optional()
    .isIn(['fixed', 'negotiable'])
    .withMessage('Price type must be fixed or negotiable'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('image').optional().trim(),
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('priceType')
    .optional()
    .isIn(['fixed', 'negotiable'])
    .withMessage('Price type must be fixed or negotiable'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('image').optional().trim(),
];
