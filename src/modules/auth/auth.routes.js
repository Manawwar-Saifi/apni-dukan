import { Router } from 'express';
import { signup, login, getMe } from './auth.controller.js';
import { signupValidator, loginValidator } from './auth.validator.js';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';

const router = Router();

router.post('/signup', validate(signupValidator), signup);
router.post('/login', validate(loginValidator), login);
router.get('/me', auth, getMe);

export default router;
