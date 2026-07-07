import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Truck, Loader2, ChevronDown
} from 'lucide-react';

const STATUS_LIST = ['Tất cả', 'Chờ thanh toán', 'Chờ xác nhận', 'Đã xác nhận', 'Bàn giao vận chuyển', 'Đang giao', 'Giao thành công', 'Giao thất bại', 'Đã hủy'];

const statusColor = {
  'Chờ thanh toán': 'bg-rose-100 text-rose-800 border border-rose-200',
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Đã xác nhận':   'bg-blue-100 text-blue-800 border border-blue-200',
  'Bàn giao vận chuyển': 'bg-teal-100 text-teal-800 border border-teal-200',
  'Đang giao': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Giao thành công':   'bg-green-100 text-green-800 border border-green-200',
  'Giao thất bại':       'bg-orange-100 text-orange-800 border border-orange-200',
  'Đã hủy':       'bg-red-100 text-red-800 border border-red-200',
};

const MOCK_ORDERS = [
  { mahoadon: 'HD20260001', makhachhang: 'customer1@gmail.com', ngaytaohoadon: '2026-06-27T10:00:00Z', tongtientt: '1550000.00', trangthaidh: 'Hoàn thành' },
  { mahoadon: 'HD20260002', makhachhang: 'customer2@gmail.com', ngaytaohoadon: '2026-06-27T14:00:00Z', tongtientt: '2200000.00', trangthaidh: 'Chờ xác nhận' },
  { mahoadon: 'HD20260003', makhachhang: 'customer3@gmail.com', ngaytaohoadon: '2026-06-27T15:30:00Z', tongtientt: '890000.00',  trangthaidh: 'Đang giao hàng' },
  { mahoadon: 'HD20260004', makhachhang: 'customer4@gmail.com', ngaytaohoadon: '2026-06-27T16:00:00Z', tongtientt: '450000.00',  trangthaidh: 'Đã hủy' },
  { mahoadon: 'HD20260005', makhachhang: 'customer5@gmail.com', ngaytaohoadon: '2026-06-28T08:00:00Z', tongtientt: '3100000.00', trangthaidh: 'Đang xử lý' },
];

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-heading text-brand-dark">Chi tiết Đơn hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><XCircle size={22}/></button>
        </div>
        <div className="space-y-3 text-sm divide-y divide-brand-light">
          <div className="flex justify-between py-2"><span className="text-gray-500">Mã đơn</span><span className="font-bold text-brand-dark">{order.mahoadon}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Khách hàng</span><span className="font-semibold">{order.makhachhang}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Ngày tạo</span><span>{new Date(order.ngaytaohoadon).toLocaleString('vi-VN')}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Tổng tiền</span><span className="font-bold text-brand-accent text-base">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(order.tongtientt)}</span></div>
          <div className="flex justify-between py-2 items-center">
            <span className="text-gray-500">Trạng thái</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[order.trangthaidh] || ''}`}>{order.trangthaidh}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition">Đóng</button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      try {
        const params = statusFilter !== 'Tất cả' ? `?trangThaiDH=${encodeURIComponent(statusFilter)}` : '';
        const res = await api.get(`/orders/${params}`);
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.hoadon || []);
      } catch (err) {
        console.error('Could not fetch orders', err);
        return [];
      }
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      await api.patch(`/orders/${id}/status`, { trangThaiMoi: newStatus });
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error('Lỗi cập nhật trạng thái đơn hàng')
  });

  const cancelOrder = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/orders/${id}/cancel`, { data: { lyDoHuy: 'Hủy bởi Quản lý/Admin' } });
    },
    onSuccess: () => {
      toast.success('Hủy đơn hàng thành công và đã hoàn lại tồn kho!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error('Lỗi hủy đơn hàng')
  });

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.mahoadon?.toLowerCase().includes(search.toLowerCase()) ||
      o.makhachhang?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || o.trangthaidh === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatVND = v => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Đơn hàng</h1>
        <p className="text-sm text-gray-500">Theo dõi và xử lý tất cả đơn đặt hàng của khách</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, email khách hàng..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_LIST.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-brand-primary text-brand-dark shadow-sm'
                  : 'bg-white text-gray-500 border border-brand-light hover:border-brand-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Mã đơn hàng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian đặt</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Không có đơn hàng nào phù hợp</td></tr>
                )}
                {filtered.map(o => (
                  <tr key={o.mahoadon} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4 font-bold text-brand-dark">{o.mahoadon}</td>
                    <td className="px-6 py-4 text-gray-600">{o.makhachhang}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(o.ngaytaohoadon).toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand-dark">{formatVND(parseFloat(o.tongtientt))}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${statusColor[o.trangthaidh] || 'bg-gray-100 text-gray-600'}`}>
                        {o.trangthaidh}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        ><Eye size={16}/></button>
                        
                        {(o.trangthaidh === 'Chờ xác nhận' || o.trangthaidh === 'Chờ thanh toán') && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đã xác nhận' })}
                              title="Xác nhận đơn"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                            ><CheckCircle size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Đã xác nhận' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Bàn giao vận chuyển' })}
                              title="Bàn giao vận chuyển"
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition"
                            ><Truck size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Bàn giao vận chuyển' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đang giao' })}
                            title="Bắt đầu giao"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                          ><Truck size={16}/></button>
                        )}

                        {o.trangthaidh === 'Đang giao' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Giao thành công' })}
                              title="Giao thành công"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                            ><CheckCircle size={16}/></button>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Giao thất bại' })}
                              title="Giao thất bại"
                              className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}

                        {o.trangthaidh === 'Giao thất bại' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: o.mahoadon, newStatus: 'Đang giao' })}
                              title="Giao lại"
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                            ><Truck size={16}/></button>
                            <button
                              onClick={() => cancelOrder.mutate(o.mahoadon)}
                              title="Hủy đơn"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            ><XCircle size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
