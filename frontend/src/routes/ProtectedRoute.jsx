import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { accessToken, user } = useAuthStore();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user.cacQuyen || [user.vaiTro];
  const hasAccess = allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-brand-primary/20">
          <h1 className="text-4xl font-bold text-brand-accent mb-4 font-heading">403</h1>
          <h2 className="text-xl font-bold text-brand-dark mb-2 font-heading">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn không được phân quyền để truy cập vào khu vực quản trị này.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-brand-primary text-brand-dark font-semibold py-3 px-6 rounded-xl hover:bg-brand-primary/80 transition duration-300"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
