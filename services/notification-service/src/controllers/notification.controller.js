import redisClient from '../config/redis.js';

export const NotificationController = {
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: 'Thiếu thông tin email hoặc otp' });
      }

      const key = `otp:${email}`;
      const savedOtp = await redisClient.get(key);

      if (savedOtp && savedOtp === otp) {
        // Delete OTP on successful verification
        await redisClient.del(key);
        return res.json({ valid: true });
      }

      return res.json({ valid: false });
    } catch (err) {
      console.error('Error verifying OTP in Notification Service:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi xác thực OTP' });
    }
  }
};
