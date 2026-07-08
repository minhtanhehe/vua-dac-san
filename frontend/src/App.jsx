import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Protection
import ProtectedRoute from './routes/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import OrdersPage from './pages/admin/OrdersPage';
import ProductsPage from './pages/admin/ProductsPage';
import SupportPage from './pages/admin/SupportPage';
import FinancePage from './pages/admin/FinancePage';
import EmployeesPage from './pages/admin/EmployeesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import CustomersPage from './pages/admin/CustomersPage';
import PostsPage from './pages/admin/PostsPage';
import PromotionsPage from './pages/admin/PromotionsPage';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import CustomerProductsPage from './pages/customer/ProductsPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import CustomerPostsPage from './pages/customer/PostsPage';
import CustomerPostDetailPage from './pages/customer/PostDetailPage';
import CustomerSupportPage from './pages/customer/SupportPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';


import ProfilePage from './pages/customer/ProfilePage';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Simple placeholder for routes not yet implemented
function PlaceholderPage({ name }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-light">
      <h2 className="text-xl font-bold text-brand-dark font-heading mb-4">{name}</h2>
      <p className="text-gray-500">Khu vực chức năng đang được phát triển giao diện chi tiết.</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* PUBLIC CUSTOMER WEBSITE */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<CustomerProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="posts" element={<CustomerPostsPage />} />
          <Route path="posts/:id" element={<CustomerPostDetailPage />} />
          <Route path="support" element={<CustomerSupportPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="policy" element={<PlaceholderPage name="Chính sách & Quy định" />} />
          
          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
          </Route>
        </Route>

        {/* AUTHENTICATION */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
        </Route>

        {/* PROTECTED BACKOFFICE ADMIN PANELS */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Admin area: role restrictions checking */}
          <Route element={<ProtectedRoute allowedRoles={['QUAN_LY']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['BAN_HANG', 'QUAN_LY']} />}>
            <Route path="orders" element={<OrdersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="posts" element={<PostsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['KHO', 'QUAN_LY']} />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['CSKH', 'QUAN_LY']} />}>
            <Route path="support" element={<SupportPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['KE_TOAN', 'QUAN_LY']} />}>
            <Route path="finance" element={<FinancePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['BAN_HANG', 'KE_TOAN', 'QUAN_LY']} />}>
            <Route path="promotions" element={<PromotionsPage />} />
          </Route>
        </Route>

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}
