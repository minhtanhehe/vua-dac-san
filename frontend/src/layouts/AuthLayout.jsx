import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-brand-primary/20">
        <div className="text-center">
          <Link to="/" className="text-3xl font-extrabold tracking-widest text-brand-primary font-heading">
            VUA ĐẶC SẢN
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Hệ thống Cung cấp Đặc sản Ba Miền Cao cấp
          </p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
}
