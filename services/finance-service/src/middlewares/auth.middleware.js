import { authApi } from '../config/axios.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    const response = await authApi.get('/verify', {
      headers: { Authorization: authHeader }
    });

    if (response.data && response.data.valid) {
      req.user = response.data.user;
      return next();
    }
    
    return res.status(401).json({ message: 'Xác thực không thành công' });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({ message: err.response.data.message || 'Xác thực không thành công' });
    }
    console.error('Error connecting to auth-service in Finance Service:', err.message);
    return res.status(500).json({ message: 'Lỗi kết nối dịch vụ xác thực' });
  }
}

export function requireAccountant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Chưa xác thực' });
  }

  const roles = req.user.cacQuyen || [req.user.vaiTro];
  if (roles.includes('KE_TOAN') || roles.includes('QUAN_LY')) {
    return next();
  }

  return res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu quyền KE_TOAN hoặc QUAN_LY.' });
}
