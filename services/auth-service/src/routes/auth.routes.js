import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { verifyAccessToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rate limiter: 10 requests/minute on login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth routes
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected auth routes
router.get('/verify', verifyAccessToken, AuthController.verify);
router.post('/change-password', verifyAccessToken, AuthController.changePassword);

// Internal service-to-service routes (No token verify required, but can add auth token in headers if needed)
router.post('/internal/create-account', AuthController.internalCreateAccount);
router.put('/internal/permissions', AuthController.internalUpdatePermissions);

export default router;
