import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Tên đăng nhập không được để trống' }),
  password: z.string().min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' })
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email_hoac_sdt: data.username,
        matKhau: data.password
      });

      const { accessToken, refreshToken, user } = response.data;

      // Save in Zustand
      setAuth(accessToken, refreshToken, user);

      toast.success('Đăng nhập thành công!');

      // Redirect depending on user roles
      const userRoles = user.cacQuyen || [user.vaiTro];
      const hasAdminAccess = userRoles.some(role =>
        ['QUAN_LY', 'BAN_HANG', 'KHO', 'CSKH', 'KE_TOAN'].includes(role)
      );

      if (hasAdminAccess) {
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (userRoles.includes('QUAN_LY')) {
          navigate('/admin/dashboard');
        } else if (userRoles.includes('BAN_HANG')) {
          navigate('/admin/orders');
        } else if (userRoles.includes('KHO')) {
          navigate('/admin/products');
        } else if (userRoles.includes('CSKH')) {
          navigate('/admin/support');
        } else if (userRoles.includes('KE_TOAN')) {
          navigate('/admin/finance');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        navigate(redirectUrl || '/');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        {/* Username field */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-brand-dark">
            Tên đăng nhập (Email / SĐT)
          </label>
          <input
            id="username"
            type="text"
            className="mt-1 block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            placeholder="admin hoặc email@domain.com"
            {...register('username')}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-brand-dark">
            Mật khẩu
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-[#1A1A1A] bg-[#D4A373] hover:bg-[#c39262] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5 text-brand-dark mr-2" />
          ) : null}
          Đăng nhập
        </button>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-brand-primary hover:text-brand-accent transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </form>
  );
}
