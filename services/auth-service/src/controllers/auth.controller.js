import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AccountModel } from '../models/account.model.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'vua-dac-san-jwt-secret-key-321';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vua-dac-san-jwt-refresh-secret-key-654';

// Helper to generate access token
function generateAccessToken(user) {
  return jwt.sign(
    { 
      tenDangnhap: user.tenDangnhap, 
      vaiTro: user.vaiTro, 
      cacQuyen: user.cacQuyen || [user.vaiTro] 
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Helper to generate refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    { tenDangnhap: user.tenDangnhap },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export const AuthController = {
  // POST /auth/login
  async login(req, res) {
    try {
      const { email_hoac_sdt, matKhau } = req.body;

      if (!email_hoac_sdt || !matKhau) {
        return res.status(400).json({ message: 'Vui lòng điền tên đăng nhập và mật khẩu' });
      }

      // Check if account exists
      const account = await AccountModel.findByUsername(email_hoac_sdt);
      if (!account) {
        // To prevent timing attacks and match prompt requirement
        return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
      }

      // Check if account is locked
      if (account.trangthai === 0) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      if (account.thoigiankhoa && new Date(account.thoigiankhoa) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(account.thoigiankhoa) - new Date()) / 60000);
        return res.status(403).json({ 
          message: `Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau ${remainingMinutes} phút.` 
        });
      }

      // Compare password
      const isPasswordMatch = await bcrypt.compare(matKhau, account.matkhau);
      if (!isPasswordMatch) {
        // Increment failed attempts
        const lockInfo = await AccountModel.incrementFailedLogins(account.tendangnhap);
        if (lockInfo && lockInfo.thoigiankhoa) {
          return res.status(403).json({ message: 'Tài khoản đã bị khóa 30 phút do nhập sai quá 5 lần' });
        }
        return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
      }

      // Reset failed attempts
      await AccountModel.resetFailedLogins(account.tendangnhap);

      // Fetch additional permissions
      const permissions = await AccountModel.getPermissions(account.tendangnhap);
      const userPayload = {
        tenDangnhap: account.tendangnhap,
        vaiTro: account.vaitro,
        cacQuyen: permissions.length > 0 ? permissions : [account.vaitro]
      };

      // Generate tokens
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload);

      // Save refresh token to database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await AccountModel.saveRefreshToken(refreshToken, account.tendangnhap, expiresAt);

      return res.json({
        accessToken,
        refreshToken,
        user: userPayload
      });
    } catch (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống' });
    }
  },

  // POST /auth/refresh
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Missing refresh token' });
      }

      // Find token in DB
      const storedToken = await AccountModel.findRefreshToken(refreshToken);
      if (!storedToken || storedToken.darevoke || new Date(storedToken.ngayhethan) < new Date()) {
        return res.status(401).json({ message: 'Refresh token invalid or expired' });
      }

      // Verify token signature
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        // Find user account details
        const account = await AccountModel.findByUsername(decoded.tenDangnhap);
        if (!account || account.trangthai === 0) {
          return res.status(401).json({ message: 'User account invalid or locked' });
        }

        const permissions = await AccountModel.getPermissions(account.tendangnhap);
        const userPayload = {
          tenDangnhap: account.tendangnhap,
          vaiTro: account.vaitro,
          cacQuyen: permissions.length > 0 ? permissions : [account.vaitro]
        };

        const newAccessToken = generateAccessToken(userPayload);
        return res.json({ accessToken: newAccessToken });
      } catch (err) {
        return res.status(401).json({ message: 'Invalid refresh token signature' });
      }
    } catch (err) {
      console.error('Error during refresh:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // POST /auth/logout
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Missing refresh token' });
      }

      await AccountModel.revokeRefreshToken(refreshToken);
      return res.json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /auth/verify
  verify(req, res) {
    // Reached here after verifyAccessToken middleware
    return res.json({
      valid: true,
      user: {
        tenDangnhap: req.user.tenDangnhap,
        vaiTro: req.user.vaiTro,
        cacQuyen: req.user.cacQuyen
      }
    });
  },

  // POST /auth/change-password
  async changePassword(req, res) {
    try {
      const { matKhauCu, matKhauMoi } = req.body;
      const username = req.user.tenDangnhap;

      if (!matKhauCu || !matKhauMoi) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
      }

      const account = await AccountModel.findByUsername(username);
      if (!account) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(matKhauCu, account.matkhau);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
      }

      if (matKhauCu === matKhauMoi) {
        return res.status(400).json({ message: 'Mật khẩu mới không được trùng mật khẩu cũ' });
      }

      // Validate new password format
      // - length >= 8 characters
      // - contains uppercase
      // - contains lowercase
      // - contains digit
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(matKhauMoi)) {
        return res.status(400).json({ 
          message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số' 
        });
      }

      // Update password
      const hashedNewPassword = await bcrypt.hash(matKhauMoi, 12);
      await AccountModel.updatePassword(username, hashedNewPassword);

      // Revoke all existing refresh tokens for security
      await AccountModel.revokeAllUserRefreshTokens(username);

      return res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
      console.error('Error during password change:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // --- INTERNAL ENDPOINTS (not exposed via API gateway, or verify required) ---
  // POST /auth/internal/create-account
  async internalCreateAccount(req, res) {
    try {
      const { tenDangnhap, matKhau, vaiTro } = req.body;
      if (!tenDangnhap || !matKhau || !vaiTro) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const existingAccount = await AccountModel.findByUsername(tenDangnhap);
      if (existingAccount) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      const passwordHash = await bcrypt.hash(matKhau, 12);
      const newAccount = await AccountModel.createAccount(tenDangnhap, passwordHash, vaiTro, true);

      return res.status(201).json(newAccount);
    } catch (err) {
      console.error('Error during internal account creation:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // PUT /auth/internal/permissions
  async internalUpdatePermissions(req, res) {
    try {
      const { tenDangnhap, cacQuyen } = req.body; // cacQuyen = Array of roles
      if (!tenDangnhap || !Array.isArray(cacQuyen)) {
        return res.status(400).json({ message: 'Missing fields or invalid permissions format' });
      }

      const account = await AccountModel.findByUsername(tenDangnhap);
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      await AccountModel.clearPermissions(tenDangnhap);
      for (const role of cacQuyen) {
        await AccountModel.addPermission(tenDangnhap, role);
      }

      return res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
      console.error('Error during internal permissions update:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};
