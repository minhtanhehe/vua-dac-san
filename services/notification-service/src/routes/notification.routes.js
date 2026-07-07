import express from 'express';
import { NotificationController } from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/verify-otp', NotificationController.verifyOtp);

export default router;
