import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { Search, MessageCircle, CheckCircle, Clock, Loader2, X, ChevronRight } from 'lucide-react';

const MOCK_TICKETS = [
  { mayeucau: 'YC001', tieude: 'Sản phẩm bị vỡ khi nhận hàng', noidung: 'Tôi nhận được gói bánh pía bị nứt vỡ, cần đổi hàng mới.', trangthai: 'Chờ xử lý', loaiyeucau: 'Khiếu nại', ngaytao: '2026-06-27T09:00:00Z', khachhang: 'customer1@gmail.com', mahoadon: 'HD20260001' },
  { mayeucau: 'YC002', tieude: 'Hỏi về chính sách đổi trả hàng', noidung: 'Tôi muốn biết thời gian đổi trả sản phẩm là bao lâu?', trangthai: 'Đã phản hồi', loaiyeucau: 'Hỏi đáp', ngaytao: '2026-06-26T14:00:00Z', khachhang: 'customer2@gmail.com', mahoadon: null },
  { mayeucau: 'YC003', tieude: 'Giao hàng chậm hơn dự kiến', noidung: 'Đơn hàng HD20260003 đã 5 ngày nhưng chưa nhận được.', trangthai: 'Đang xử lý', loaiyeucau: 'Khiếu nại', ngaytao: '2026-06-26T10:30:00Z', khachhang: 'customer3@gmail.com', mahoadon: 'HD20260003' },
];

const statusStyle = {
  'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
  'Đang xử lý': 'bg-blue-100 text-blue-800',
  'Đã phản hồi': 'bg-green-100 text-green-800',
  'Đã đóng': 'bg-gray-100 text-gray-600',
};

function TicketModal({ ticket, onClose }) {
  const [reply, setReply] = useState('');
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/content/support-requests/${ticket.mayeucau}/reply`, { noiDungPhanHoi: reply });
    },
    onSuccess: () => {
      toast.success('Đã gửi phản hồi thành công!');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi phản hồi');
    }
  });

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-brand-dark">Chi tiết Yêu cầu #{ticket.mayeucau}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
        </div>
        <div className="bg-brand-bg rounded-xl p-4 space-y-2 text-sm">
          <div className="flex gap-2 items-center">
            <span className="font-bold text-brand-dark px-2 py-0.5 bg-brand-light rounded-md text-xs">{ticket.loaiyeucau}</span>
          </div>
          <div className="text-gray-500 text-xs">{ticket.makhachhang} · {new Date(ticket.ngaytao).toLocaleString('vi-VN')}</div>
          <p className="text-gray-700 mt-2 leading-relaxed font-medium">Nội dung KH: {ticket.noidungkh}</p>
          {ticket.noidungphanhoi && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              <span className="font-bold">Đã phản hồi: </span>
              {ticket.noidungphanhoi}
            </div>
          )}
          {ticket.mahoadon && (
            <div className="bg-white border border-brand-light rounded-lg px-3 py-2 text-xs text-brand-accent font-semibold mt-2">
              📦 Liên quan đơn hàng: {ticket.mahoadon}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Phản hồi của CSKH</label>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung phản hồi cho khách hàng..."
            className="w-full border border-brand-light rounded-xl p-4 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!reply.trim() || replyMutation.isPending}
            className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50"
          >
            {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      try {
        const res = await api.get('/content/support-requests');
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch {
        return MOCK_TICKETS;
      }
    }
  });

  const filtered = tickets.filter(t =>
    !search ||
    t.noidungkh?.toLowerCase().includes(search.toLowerCase()) ||
    t.makhachhang?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = tickets.filter(t => t.trangthai === 'Chờ xử lý').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark font-heading">Chăm sóc Khách hàng</h1>
        <p className="text-sm text-gray-500">Xử lý yêu cầu hỗ trợ, khiếu nại và hỏi đáp từ khách hàng</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu', value: tickets.length, color: 'text-brand-dark', bg: 'bg-white' },
          { label: 'Chờ xử lý', value: pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Đang xử lý', value: tickets.filter(t => t.trangthai === 'Đang xử lý').length, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Đã phản hồi', value: tickets.filter(t => t.trangthai === 'Đã phản hồi').length, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border border-brand-light rounded-2xl p-5 shadow-sm`}>
            <div className={`text-2xl font-bold font-heading ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm tiêu đề, email khách hàng..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div
              key={t.mayeucau}
              onClick={() => setSelectedTicket(t)}
              className="bg-white border border-brand-light rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex-shrink-0 flex items-center justify-center text-brand-primary mt-0.5">
                    <MessageCircle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusStyle[t.trangthai] || ''}`}>{t.trangthai}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-light text-brand-accent">{t.loaiyeucau}</span>
                    </div>
                    <p className="text-sm text-brand-dark mt-2 font-medium line-clamp-1">{t.noidungkh}</p>
                    {t.noidungphanhoi && (
                      <p className="text-xs text-green-700 mt-1 line-clamp-1 italic border-l-2 border-green-400 pl-2">
                        Admin: {t.noidungphanhoi}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Khách hàng: {t.makhachhang}</span>
                      <span>·</span>
                      <span>{new Date(t.ngaytao).toLocaleString('vi-VN')}</span>
                      {t.mahoadon && <><span>·</span><span className="text-brand-accent font-semibold">Đơn: {t.mahoadon}</span></>}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p>Không có yêu cầu nào phù hợp</p>
            </div>
          )}
        </div>
      )}

      <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
