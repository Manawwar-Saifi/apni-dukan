import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from './product.controller.js';
import { createProductValidator, updateProductValidator } from './product.validator.js';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import roleCheck from '../../middleware/roleCheck.js';

const router = Router();

// All product routes require auth + seller role
router.use(auth, roleCheck('admin', 'seller'));

router.post('/', validate(createProductValidator), createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', validate(updateProductValidator), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
