import { body } from 'express-validator';

export const createShopValidator = [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('description').optional().trim(),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim(),
  body('status')
    .optional()
    .isIn(['open', 'closed', 'asp'])
    .withMessage('Status must be open, closed, or asp'),
  body('schedule')
    .optional()
    .isArray()
    .withMessage('Schedule must be an array'),
  body('schedule.*.day')
    .optional()
    .isIn(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    .withMessage('Invalid day'),
  body('schedule.*.open').optional().matches(/^\d{2}:\d{2}$/).withMessage('Open time must be HH:mm'),
  body('schedule.*.close').optional().matches(/^\d{2}:\d{2}$/).withMessage('Close time must be HH:mm'),
];

export const updateShopValidator = [
  body('name').optional().trim().notEmpty().withMessage('Shop name cannot be empty'),
  body('description').optional().trim(),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim(),
  body('status')
    .optional()
    .isIn(['open', 'closed', 'asp'])
    .withMessage('Status must be open, closed, or asp'),
  body('schedule')
    .optional()
    .isArray()
    .withMessage('Schedule must be an array'),
  body('schedule.*.day')
    .optional()
    .isIn(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    .withMessage('Invalid day'),
  body('schedule.*.open').optional().matches(/^\d{2}:\d{2}$/).withMessage('Open time must be HH:mm'),
  body('schedule.*.close').optional().matches(/^\d{2}:\d{2}$/).withMessage('Close time must be HH:mm'),
];
