import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { orderApi } from '../../api/orderApi';
import { ShoppingBag, Eye, Calendar, DollarSign, CreditCard, Loader2, X } from 'lucide-react';
import { formatVND } from '../../lib/utils';

const statusColors = {
  'Chờ thanh toán': 'bg-rose-100 text-rose-800 border border-rose-200',
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Đã xác nhận': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Bàn giao vận chuyển': 'bg-teal-100 text-teal-800 border border-teal-200',
  'Đang giao': 'bg-purple-100 text-purple-800 border border-purple-200',
  'Giao thành công': 'bg-green-100 text-green-800 border border-green-200',
  'Giao thất bại': 'bg-orange-100 text-orange-800 border border-orange-200',
  'Đã hủy': 'bg-red-100 text-red-800 border border-red-200',
};

function CustomerOrderDetailModal({ orderId, onClose }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ['customer-order-detail', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await orderApi.getById(orderId);
      return res.data;
    }
  });


  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-4">
          <h3 className="text-xl font-bold font-heading text-brand-dark">Đơn hàng: {orderId}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
          </div>
        ) : !order ? (
          <p className="text-center text-gray-400 py-8">Không thể tải thông tin chi tiết đơn hàng.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs bg-brand-bg/50 p-4 rounded-xl">
              <div><span className="text-gray-500">Ngày đặt:</span> <strong className="text-brand-dark">{new Date(order.ngaytaohoadon).toLocaleString('vi-VN')}</strong></div>
              <div><span className="text-gray-500">Tổng tiền thanh toán:</span> <strong className="text-brand-accent font-bold">{formatVND(order.tongtientt)}</strong></div>
              <div><span className="text-gray-500">Thanh toán:</span> <strong className="text-brand-dark">{order.trangthaitt}</strong></div>
              <div><span className="text-gray-500">Trạng thái giao nhận:</span> <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.trangthaidh] || 'bg-gray-100 text-gray-700'}`}>{order.trangthaidh}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Phương thức:</span> <strong className="text-brand-dark">{order.pthucthanhtoan}</strong></div>
              {order.diachichitiet && <div className="col-span-2"><span className="text-gray-500">Địa chỉ giao:</span> <span className="text-gray-700">{order.diachichitiet}</span></div>}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Chi tiết mặt hàng</h4>
              <div className="border border-brand-light rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-brand-light/50 border-b border-brand-light font-bold text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-brand-dark">{item.tenSanpham || item.masanpham}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{item.soluong}</td>
                        <td className="px-4 py-3 text-right">{formatVND(item.giaban || item.dongia)}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-accent">{formatVND(item.soluong * (item.giaban || item.dongia))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm">Đóng</button>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await customerApi.getOrders('me');
      return Array.isArray(res.data) ? res.data : [];
    }
  });


  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <h1 className="text-2xl font-bold font-heading text-brand-dark flex items-center gap-2">
          <ShoppingBag className="text-brand-primary" />
          Đơn hàng của tôi
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl border border-brand-light">
            <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
            <p className="text-sm text-gray-500 font-medium">Đang tải lịch sử mua hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-light p-16 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto text-4xl">
              📦
            </div>
            <h2 className="text-xl font-bold text-brand-dark font-heading">Bạn chưa có đơn đặt hàng nào</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Khi bạn mua sản phẩm đặc sản tại cửa hàng, danh sách đơn hàng sẽ xuất hiện tại đây để bạn tiện theo dõi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.mahoadon} className="bg-white rounded-2xl border border-brand-light p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-primary/40 transition duration-300">
                
                {/* Meta details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-dark text-base">{order.mahoadon}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[order.trangthaidh] || 'bg-gray-100 text-gray-700'}`}>
                      {order.trangthaidh}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(order.ngaytaohoadon || order.ngaymua || order.ngayMua || Date.now()).toLocaleDateString('vi-VN')}</div>
                    <div className="flex items-center gap-1.5"><CreditCard size={14} /> {order.pthucthanhtoan || order.pthucThanhToan || 'COD'}</div>
                    <div className="flex items-center gap-1.5"><DollarSign size={14} /> {order.trangthaitt || order.trangThaiTT || 'Chưa thanh toán'}</div>
                  </div>
                </div>

                {/* Amount and actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-brand-light">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Tổng thanh toán</div>
                    <div className="text-lg font-black text-brand-accent font-heading">{formatVND(order.tongtientt)}</div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedOrderId(order.mahoadon)}
                    className="flex items-center gap-1.5 border border-brand-light text-brand-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary hover:border-brand-primary transition"
                  >
                    <Eye size={14} /> Xem chi tiết
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerOrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
}
