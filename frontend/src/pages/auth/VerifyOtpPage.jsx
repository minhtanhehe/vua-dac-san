import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Loader2, MailCheck } from 'lucide-react';

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'Mã OTP phải bao gồm 6 chữ số' })
});

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.');
      navigate('/register');
    }
  }, [email, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await customerApi.verifyOtp({ email, otp: data.otp });
      toast.success(res.data.message || 'Xác thực thành công! Hãy đăng nhập ngay.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
          <MailCheck size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-dark font-heading">
          Xác thực tài khoản
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Vui lòng nhập mã OTP vừa được gửi đến email:<br />
          <strong className="text-brand-dark">{email}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-brand-light">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-brand-dark text-center">
                Mã OTP 6 chữ số
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="mt-2 block w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold bg-brand-light border border-gray-200 rounded-xl text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition uppercase"
                placeholder="------"
                {...register('otp')}
              />
              {errors.otp && <p className="mt-2 text-sm text-red-500 text-center">{errors.otp.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-[#1A1A1A] bg-[#D4A373] hover:bg-[#c39262] focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 transition shadow-sm"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5 text-brand-dark mr-2" />}
                Xác thực & Kích hoạt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
