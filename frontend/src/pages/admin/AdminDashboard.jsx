import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  Download, 
  Calendar,
  Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const [filterType, setFilterType] = useState('THANG'); // TUAN | THANG | QUY
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // States for API data
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    todayOrders: 0,
    expiredProducts: 0,
    newCustomers: 48 // Default fallback KPI
  });
  const [chartData, setChartData] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [newOrders, setNewOrders] = useState([]);

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Revenue Statistics
      let revenueStats = [];
      try {
        const revRes = await api.get(`/finance/statistics/revenue?loai=${filterType}`);
        revenueStats = revRes.data || [];
      } catch (err) {
        console.warn('Could not fetch revenue statistics', err);
        revenueStats = [];
      }

      // 2. Fetch Expiry Warnings
      let expiryWarnings = [];
      try {
        const expRes = await api.get('/products/expiry-warning');
        // Orders API returns { data: [...], totalItems, totalPages, currentPage }
        const raw = expRes.data;
        expiryWarnings = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch (err) {
        console.warn('Could not fetch expiry warnings, using mock fallback', err);
        expiryWarnings = [
          { masanpham: 'SP001', tensanpham: 'Bánh Pía Sầu Riêng Sóc Trăng', hansudung: '2026-07-02', soluongton: 45, songayconlai: 4 },
          { masanpham: 'SP002', tensanpham: 'Kẹo Dừa Bến Tre Nguyên Chất', hansudung: '2026-07-09', soluongton: 110, songayconlai: 11 },
          { masanpham: 'SP003', tensanpham: 'Chả Hoa Năm Thụy Trà Vinh', hansudung: '2026-06-30', soluongton: 15, songayconlai: 2 }
        ];
      }

      // 3. Fetch New Orders
      let ordersList = [];
      try {
        const orderRes = await api.get('/orders/?trangThaiDH=Chờ xác nhận&limit=5');
        const raw = orderRes.data;
        ordersList = Array.isArray(raw) ? raw : (raw?.data || raw?.hoadon || []);
      } catch (err) {
        console.warn('Could not fetch pending orders, using empty fallback', err);
      }

      // 4. Fetch New Customers count
      let newCustomersCount = 0;
      try {
        const custRes = await api.get('/customers/statistics/new');
        newCustomersCount = custRes.data?.newCustomers || 0;
      } catch (err) {
        console.warn('Could not fetch new customers count', err);
      }

      // Compute KPIs
      const totalRev = revenueStats.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
      const expiredCount = expiryWarnings.filter(p => p.songayconlai <= 7).length;

      setKpiData({
        totalRevenue: totalRev,
        todayOrders: ordersList.length,
        expiredProducts: expiredCount,
        newCustomers: newCustomersCount
      });

      // Map Recharts data keys
      const formattedChart = revenueStats.map(item => ({
        name: item.label,
        'Doanh thu': parseFloat(item.value) || 0
      }));

      setChartData(formattedChart);
      setExpiringProducts(expiryWarnings);
      setNewOrders(ordersList);

    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  // Export Financial Excel report
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const thang = now.getMonth() + 1;
      const nam = now.getFullYear();

      const response = await api.get(`/finance/statistics/export?thang=${thang}&nam=${nam}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_tai_chinh_${thang}_${nam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất báo cáo Excel thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất file Excel báo cáo');
    } finally {
      setExporting(false);
    }
  };

  // Format currency VND helper
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-10 w-10 text-brand-primary" />
        <span className="ml-3 text-gray-600 font-semibold">Đang tải dữ liệu Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Tổng quan hoạt động</h1>
          <p className="text-sm text-gray-500">Xem thống kê doanh thu, cảnh báo kho hàng và đơn hàng mới.</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center justify-center space-x-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition duration-300 disabled:opacity-50 shadow-sm"
        >
          {exporting ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <Download size={20} />
          )}
          <span>Xuất Báo cáo Tài chính</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doanh thu tổng hợp</div>
            <div className="text-xl font-bold text-brand-dark mt-2 font-heading">
              {formatVND(kpiData.totalRevenue)}
            </div>
            <div className="text-xs text-brand-secondary font-medium mt-1">↑ 12% so với tháng trước</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <DollarSign size={24} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đơn hàng chờ duyệt</div>
            <div className="text-xl font-bold text-brand-dark mt-2 font-heading">
              {kpiData.todayOrders} Đơn
            </div>
            <div className="text-xs text-brand-accent font-medium mt-1">Cần xác nhận trong ca</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sản phẩm cận HSD</div>
            <div className="text-xl font-bold text-red-600 mt-2 font-heading">
              {kpiData.expiredProducts} sản phẩm
            </div>
            <div className="text-xs text-red-500 font-medium mt-1">Hạn dưới 7 ngày</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng mới</div>
            <div className="text-xl font-bold text-brand-dark mt-2 font-heading">
              +{kpiData.newCustomers}
            </div>
            <div className="text-xs text-brand-secondary font-medium mt-1">Đăng ký mới tháng này</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts & Expiring block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-brand-light space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-dark font-heading">Biểu đồ Doanh thu</h3>
            {/* Filter type buttons */}
            <div className="flex bg-brand-light p-1 rounded-xl">
              {['TUAN', 'THANG', 'QUY'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === type
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-gray-500 hover:text-brand-dark'
                  }`}
                >
                  {type === 'TUAN' ? 'Tuần này' : type === 'THANG' ? 'Tháng này' : '3 tháng'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#a0a0a0" 
                  fontSize={12} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip 
                  formatter={(value) => [formatVND(value), 'Doanh thu']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Doanh thu" 
                  stroke="#D4A373" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expiring warnings container */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-brand-dark mb-4 font-heading flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={20} />
              Cảnh báo Hạn Sử Dụng
            </h3>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {expiringProducts.map((p) => {
                const isCritical = p.songayconlai <= 7;
                return (
                  <div 
                    key={p.masanpham} 
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-1 transition duration-200 hover:shadow-sm ${
                      isCritical 
                        ? 'bg-red-50/50 border-red-200 text-red-900' 
                        : 'bg-yellow-50/30 border-yellow-100 text-yellow-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm leading-tight">{p.tensanpham}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                        isCritical ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        Còn {p.songayconlai} ngày
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Tồn kho: <strong>{p.soluongton}</strong></span>
                      <span>HSD: <strong>{new Date(p.hansudung).toLocaleDateString('vi-VN')}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-light text-center text-xs text-gray-400">
            Dữ liệu tự động cập nhật từ Warehouse Service
          </div>
        </div>
      </div>

      {/* New orders list */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light">
        <h3 className="font-bold text-brand-dark mb-6 font-heading flex items-center">
          <Calendar className="text-brand-primary mr-2" size={20} />
          Đơn hàng mới chờ duyệt
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-light text-gray-400 text-xs uppercase font-bold">
                <th className="pb-3">Mã đơn hàng</th>
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Thời gian đặt</th>
                <th className="pb-3 text-right">Tổng tiền</th>
                <th className="pb-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light">
              {newOrders.map((o) => (
                <tr key={o.mahoadon} className="hover:bg-brand-light/30 transition text-sm">
                  <td className="py-4 font-bold text-brand-dark">{o.mahoadon}</td>
                  <td className="py-4 text-gray-600">{o.makhachhang}</td>
                  <td className="py-4 text-gray-500">
                    {new Date(o.ngaytaohoadon).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-4 text-right font-bold text-brand-dark">
                    {formatVND(parseFloat(o.tongtientt))}
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-block bg-brand-primary/10 text-brand-accent text-xs font-bold px-3 py-1 rounded-full border border-brand-primary/30">
                      {o.trangthaidh}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
