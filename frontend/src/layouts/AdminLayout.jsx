import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  BookOpen, 
  Headphones, 
  CircleDollarSign, 
  UserSquare2, 
  Truck, 
  LogOut,
  User,
  Ticket
} from 'lucide-react';

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userRoles = user?.cacQuyen || [user?.vaiTro || ''];

  const allMenuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['QUAN_LY'] },
    { path: '/admin/orders', name: 'Quản lý Đơn hàng', icon: ShoppingBag, roles: ['BAN_HANG', 'QUAN_LY'] },
    { path: '/admin/products', name: 'Sản phẩm & Kho', icon: Package, roles: ['KHO', 'QUAN_LY'] },
    { path: '/admin/customers', name: 'Khách hàng', icon: Users, roles: ['BAN_HANG', 'QUAN_LY'] },
    { path: '/admin/posts', name: 'Bài viết tin tức', icon: BookOpen, roles: ['BAN_HANG', 'QUAN_LY'] },
    { path: '/admin/support', name: 'Chăm sóc khách hàng', icon: Headphones, roles: ['CSKH', 'QUAN_LY'] },
    { path: '/admin/finance', name: 'Tài chính & Lương', icon: CircleDollarSign, roles: ['KE_TOAN', 'QUAN_LY'] },
    { path: '/admin/promotions', name: 'Mã giảm giá', icon: Ticket, roles: ['BAN_HANG', 'KE_TOAN', 'QUAN_LY'] },
    { path: '/admin/employees', name: 'Quản lý Nhân viên', icon: UserSquare2, roles: ['QUAN_LY'] },
    { path: '/admin/suppliers', name: 'Nhà cung cấp', icon: Truck, roles: ['QUAN_LY'] },
  ];

  // Filter menu items by user's roles
  const menuItems = allMenuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  return (
    <div className="flex h-screen bg-brand-bg font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col shadow-lg overflow-hidden">
        {/* Logo Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-center flex-shrink-0">
          <Link to="/admin/dashboard" className="text-xl font-bold tracking-widest text-brand-primary font-heading">
            VUA ĐẶC SẢN
          </Link>
        </div>

        {/* Navigation Menu - scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${
                  isActive
                    ? 'bg-brand-primary text-brand-dark font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer logout - always pinned at bottom */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition duration-200"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-brand-light flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark font-heading">
            {menuItems.find(item => location.pathname.startsWith(item.path))?.name || 'Quản lý Hệ thống'}
          </h2>

          {/* User profile dropdown info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-dark">{user?.tenDangnhap}</div>
              <div className="text-xs text-brand-accent font-medium">
                {userRoles.join(' | ')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-light border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold shadow-sm">
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
