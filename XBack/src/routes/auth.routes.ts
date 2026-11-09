import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter, otpRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

router.post('/register', authRateLimiter, authController.register.bind(authController));
router.post('/login', authRateLimiter, authController.login.bind(authController));
router.post('/verify-otp', otpRateLimiter, authController.verifyOTP.bind(authController));
router.post('/resend-otp', otpRateLimiter, authController.resendOTP.bind(authController));
router.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', passwordResetRateLimiter, authController.resetPassword.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

export default router;