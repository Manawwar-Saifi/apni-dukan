import { Router } from 'express';
import { createShop, getMyShop, updateShop } from './shop.controller.js';
import { createShopValidator, updateShopValidator } from './shop.validator.js';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import roleCheck from '../../middleware/roleCheck.js';
import { upload } from '../../utils/upload.js';

const router = Router();

// All shop routes require auth + seller role
router.use(auth, roleCheck('admin', 'seller'));

router.post('/', upload.single('image'), validate(createShopValidator), createShop);
router.get('/', getMyShop);
router.put('/', upload.single('image'), validate(updateShopValidator), updateShop);

export default router;
