import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  hoTen: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' }),
  sdt: z.string().min(10, { message: 'Số điện thoại không hợp lệ' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  matKhau: z.string().min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' })
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hoTen: '',
      sdt: '',
      email: '',
      matKhau: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await customerApi.register(data);
      toast.success(res.data.message || 'Đăng ký thành công!');
      // Chuyển hướng sang trang nhập OTP
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark font-heading">
          Đăng ký Tài khoản Khách hàng
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hoặc{' '}
          <Link to="/login" className="font-bold text-brand-primary hover:text-brand-accent transition">
            đăng nhập nếu đã có tài khoản
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-brand-light">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="hoTen" className="block text-sm font-semibold text-brand-dark">Họ và tên</label>
              <input
                id="hoTen"
                type="text"
                className="mt-1 block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                placeholder="Nguyễn Văn A"
                {...register('hoTen')}
              />
              {errors.hoTen && <p className="mt-1 text-sm text-red-500">{errors.hoTen.message}</p>}
            </div>

            <div>
              <label htmlFor="sdt" className="block text-sm font-semibold text-brand-dark">Số điện thoại</label>
              <input
                id="sdt"
                type="text"
                className="mt-1 block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                placeholder="0912345678"
                {...register('sdt')}
              />
              {errors.sdt && <p className="mt-1 text-sm text-red-500">{errors.sdt.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brand-dark">Email</label>
              <input
                id="email"
                type="email"
                className="mt-1 block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                placeholder="email@domain.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="matKhau" className="block text-sm font-semibold text-brand-dark">Mật khẩu</label>
              <div className="relative mt-1">
                <input
                  id="matKhau"
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-xl text-brand-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                  placeholder="••••••••"
                  {...register('matKhau')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.matKhau && <p className="mt-1 text-sm text-red-500">{errors.matKhau.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-[#1A1A1A] bg-[#D4A373] hover:bg-[#c39262] focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 transition shadow-sm"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5 text-brand-dark mr-2" />}
                Đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
