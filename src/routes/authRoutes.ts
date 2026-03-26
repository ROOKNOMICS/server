import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
} from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

export default router;