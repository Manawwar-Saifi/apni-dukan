import { Router } from 'express';
import { signup, login, getMe, updateProfile } from './auth.controller.js';
import { signupValidator, loginValidator } from './auth.validator.js';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import { upload } from '../../utils/upload.js';

const router = Router();

router.post('/signup', validate(signupValidator), signup);
router.post('/login', validate(loginValidator), login);
router.get('/me', auth, getMe);
router.put('/profile', auth, upload.single('avatar'), updateProfile);

export default router;
