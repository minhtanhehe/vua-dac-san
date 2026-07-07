import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, LogIn, LayoutDashboard, LogOut, ShoppingBag, ChevronDown, User } from 'lucide-react';

export default function CustomerLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Cart count comes from the central store — no manual localStorage reads needed
  const items = useCartStore((state) => state.items);
  const syncFromStorage = useCartStore((state) => state.syncFromStorage);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Keep the store in sync when another tab modifies the cart
  useEffect(() => {
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, [syncFromStorage]);

  const userRoles = user?.cacQuyen || [user?.vaiTro || ''];
  const hasAdminAccess = userRoles.some(role => 
    ['QUAN_LY', 'BAN_HANG', 'KHO', 'CSKH', 'KE_TOAN'].includes(role)
  );

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-brand-light shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold tracking-wider text-brand-primary font-heading">
            VUA ĐẶC SẢN
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-brand-dark hover:text-brand-primary font-bold transition duration-200 uppercase text-sm tracking-wide">
              Trang chủ
            </Link>
            
            {/* Mega Menu Dropdown */}
            <div className="group relative">
              <Link to="/products" className="flex items-center gap-1 text-brand-dark hover:text-brand-primary font-bold transition duration-200 uppercase text-sm tracking-wide py-6">
                Sản phẩm <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
              </Link>
              
              {/* Dropdown Content */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-white rounded-2xl shadow-2xl border border-brand-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <div className="p-6 grid grid-cols-2 gap-8">
                  {/* Regions */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Đặc Sản Vùng Miền</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link to="/products?region=Miền Bắc" className="block p-3 rounded-xl hover:bg-red-50 hover:text-red-700 transition">
                          <span className="font-bold block">Miền Bắc</span>
                          <span className="text-xs text-gray-500 font-normal">Thịt trâu gác bếp, lạp sườn...</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/products?region=Miền Trung" className="block p-3 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition">
                          <span className="font-bold block">Miền Trung</span>
                          <span className="text-xs text-gray-500 font-normal">Mè xửng, nem chua, tré...</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/products?region=Miền Nam" className="block p-3 rounded-xl hover:bg-green-50 hover:text-green-700 transition">
                          <span className="font-bold block">Miền Nam</span>
                          <span className="text-xs text-gray-500 font-normal">Bánh pía, kẹo dừa, khô cá...</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Danh Mục Phổ Biến</h3>
                    <ul className="space-y-3 pt-2">
                      <li><Link to="/products" className="text-sm font-semibold text-brand-dark hover:text-brand-primary transition">Đồ khô & Gác bếp</Link></li>
                      <li><Link to="/products" className="text-sm font-semibold text-brand-dark hover:text-brand-primary transition">Bánh mứt & Kẹo</Link></li>
                      <li><Link to="/products" className="text-sm font-semibold text-brand-dark hover:text-brand-primary transition">Gia vị truyền thống</Link></li>
                      <li><Link to="/products" className="text-sm font-semibold text-brand-dark hover:text-brand-primary transition">Thức uống & Trà</Link></li>
                      <li>
                        <Link to="/products" className="mt-4 inline-flex text-xs font-bold bg-brand-light text-brand-dark px-4 py-2 rounded-lg hover:bg-brand-primary transition">
                          Xem tất cả &rarr;
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/posts" className="text-brand-dark hover:text-brand-primary font-bold transition duration-200 uppercase text-sm tracking-wide">
              Tin tức
            </Link>
            <Link to="/support" className="text-brand-dark hover:text-brand-primary font-bold transition duration-200 uppercase text-sm tracking-wide">
              Liên hệ
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            {/* Cart Icon */}
            <Link to="/cart" className="relative text-brand-dark hover:text-brand-primary transition">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Actions */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="group relative">
                  <button className="flex items-center space-x-2 bg-brand-light text-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-primary hover:text-white hover:shadow-lg transition-all duration-300">
                    <User size={18} />
                    <span className="hidden sm:inline">Tài khoản</span>
                    <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-brand-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden flex flex-col z-50">
                    <div className="p-4 border-b border-brand-light bg-brand-bg/50">
                      <p className="text-xs text-gray-500 mb-1">Đăng nhập dưới tên</p>
                      <p className="text-sm font-bold text-brand-dark truncate">{user.tenDangnhap}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {hasAdminAccess && (
                        <Link to="/admin/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-dark hover:bg-brand-light hover:text-brand-primary transition">
                          <LayoutDashboard size={18} />
                          <span>Trang Quản trị</span>
                        </Link>
                      )}
                      
                      <Link to="/profile" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-dark hover:bg-brand-light hover:text-brand-primary transition">
                        <User size={18} />
                        <span>Thông tin cá nhân</span>
                      </Link>
                      <Link to="/my-orders" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-dark hover:bg-brand-light hover:text-brand-primary transition">
                        <ShoppingBag size={18} />
                        <span>Đơn hàng của tôi</span>
                      </Link>
                      
                      <div className="h-px bg-brand-light my-1 mx-2"></div>
                      
                      <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition w-full text-left">
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-brand-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-accent hover:shadow-lg transition-all duration-300"
              >
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark text-gray-400 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4 font-heading tracking-widest text-brand-primary">
              VUA ĐẶC SẢN
            </h3>
            <p className="text-sm leading-relaxed">
              Hệ thống bán đặc sản ba miền cao cấp hàng đầu Việt Nam. Tươi ngon, an toàn vệ sinh thực phẩm, giữ trọn hương vị truyền thống.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Liên hệ</h4>
            <p className="text-sm">Địa chỉ: 123 Đường Đặc Sản, Quận 1, TP. Hồ Chí Minh</p>
            <p className="text-sm mt-2">Email: lienhe@vuadacsan.com</p>
            <p className="text-sm mt-2">Hotline: 1900 6868</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Chính sách</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/policy" className="hover:text-white transition">Chính sách đổi trả</Link></li>
              <li><Link to="/policy" className="hover:text-white transition">Chính sách vận chuyển</Link></li>
              <li><Link to="/policy" className="hover:text-white transition">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-white/5 text-center text-xs">
          &copy; 2026 Vua Đặc Sản. Tất cả các quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
}
