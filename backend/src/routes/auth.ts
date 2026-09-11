import { Router } from 'express';
import { sendOtp, verifyOtp, register, login, getMe } from '../controllers/AuthController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;
