import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  Search, Plus, Loader2, X, Pencil, Trash2, Tag, Ticket,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle
} from 'lucide-react';

const LOAI_MA_OPTIONS = [
  { value: 'PHAN_TRAM', label: 'Giảm theo %' },
  { value: 'TRU_TIEN', label: 'Trừ thẳng tiền (₫)' },
  { value: 'FREESHIP', label: 'Miễn phí vận chuyển' },
];

function formatVND(n) {
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}

function promoStatus(promo) {
  const now = new Date();
  const start = new Date(promo.ngaybatdau);
  const end = new Date(promo.ngayketthuc);
  if (now < start) return { label: 'Chưa bắt đầu', color: 'bg-blue-100 text-blue-700', icon: Clock };
  if (now > end) return { label: 'Đã hết hạn', color: 'bg-red-100 text-red-600', icon: XCircle };
  if (promo.dasd >= promo.soluongtoida) return { label: 'Hết lượt', color: 'bg-gray-100 text-gray-500', icon: XCircle };
  return { label: 'Đang áp dụng', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
}

function toLocalDateInput(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

// ===== FORM MODAL =====
function PromoFormModal({ promo, onClose, onSave, isSaving }) {
  const isEdit = !!promo;
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      loaiMa: promo.loaima,
      giaTriGiam: promo.giatrigiam,
      donToiThieu: promo.dontoithieu,
      ngayBatDau: toLocalDateInput(promo.ngaybatdau),
      ngayKetThuc: toLocalDateInput(promo.ngayketthuc),
      soLuongToiDa: promo.soluongtoida,
    } : { loaiMa: 'PHAN_TRAM', donToiThieu: 0, soLuongToiDa: 100 }
  });

  const loaiMa = watch('loaiMa');

  const onSubmit = (data) => {
    const isFreeship = data.loaiMa === 'FREESHIP';
    onSave({
      ...(!isEdit && { maKhuyenMai: data.maKhuyenMai?.toUpperCase() }),
      loaiMa: data.loaiMa,
      giaTriGiam: isFreeship ? 0 : parseFloat(data.giaTriGiam),
      donToiThieu: parseFloat(data.donToiThieu || 0),
      ngayBatDau: new Date(data.ngayBatDau).toISOString(),
      ngayKetThuc: new Date(data.ngayKetThuc).toISOString(),
      soLuongToiDa: parseInt(data.soLuongToiDa),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <Ticket size={18} className="text-brand-primary" />
            {isEdit ? 'Chỉnh sửa mã khuyến mãi' : 'Tạo mã khuyến mãi mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mã KM (chỉ khi tạo mới) */}
          {!isEdit && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Mã khuyến mãi *</label>
              <input
                {...register('maKhuyenMai', { required: 'Vui lòng nhập mã' })}
                placeholder="VD: SUMMER30, FREESHIP"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {errors.maKhuyenMai && <p className="text-red-500 text-xs">{errors.maKhuyenMai.message}</p>}
            </div>
          )}

          {/* Loại mã */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Loại mã *</label>
            <select {...register('loaiMa', { required: true })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white">
              {LOAI_MA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Giá trị giảm - ẩn hoàn toàn khi FREESHIP */}
          {loaiMa !== 'FREESHIP' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Giá trị giảm {loaiMa === 'PHAN_TRAM' ? '(%)' : '(₫)'}
              </label>
              <input
                type="number" min={0} step={loaiMa === 'PHAN_TRAM' ? 1 : 1000}
                {...register('giaTriGiam', { required: 'Vui lòng nhập giá trị giảm', min: { value: 0, message: 'Phải >= 0' } })}
                placeholder={loaiMa === 'PHAN_TRAM' ? 'VD: 10 (tức 10%)' : 'VD: 50000'}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {errors.giaTriGiam && <p className="text-red-500 text-xs">{errors.giaTriGiam.message}</p>}
            </div>
          )}
          {loaiMa === 'FREESHIP' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
              🚚 Mã FREESHIP sẽ tự động miễn toàn bộ phí vận chuyển (hiện tại: 30.000 ₫) cho khách hàng.
            </div>
          )}

          {/* Đơn tối thiểu */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Đơn hàng tối thiểu (₫)</label>
            <input type="number" min={0} step={1000} {...register('donToiThieu')}
              placeholder="0 = không giới hạn"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Bắt đầu *</label>
              <input type="datetime-local" {...register('ngayBatDau', { required: 'Bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              {errors.ngayBatDau && <p className="text-red-500 text-xs">{errors.ngayBatDau.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Kết thúc *</label>
              <input type="datetime-local" {...register('ngayKetThuc', { required: 'Bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              {errors.ngayKetThuc && <p className="text-red-500 text-xs">{errors.ngayKetThuc.message}</p>}
            </div>
          </div>

          {/* Số lượt tối đa */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Số lượt sử dụng tối đa *</label>
            <input type="number" min={1} {...register('soLuongToiDa', { required: 'Bắt buộc', min: { value: 1, message: 'Phải >= 1' } })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            {errors.soLuongToiDa && <p className="text-red-500 text-xs">{errors.soLuongToiDa.message}</p>}
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Hủy</button>
            <button type="submit" disabled={isSaving} className="flex-1 bg-brand-primary text-brand-dark font-bold py-2.5 rounded-xl text-sm hover:bg-brand-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
              {isEdit ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promos', page, search],
    queryFn: async () => {
      const res = await api.get('/orders/promos', { params: { page, limit: 15, search: search || undefined } });
      return res.data;
    },
    keepPreviousData: true,
  });

  const promos = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/orders/promos', body),
    onSuccess: () => {
      toast.success('Tạo mã khuyến mãi thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setShowModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi tạo mã'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, body }) => api.put(`/orders/promos/${code}`, body),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setEditPromo(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (code) => api.delete(`/orders/promos/${code}`),
    onSuccess: () => {
      toast.success('Đã xóa mã khuyến mãi');
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      setDeletingCode(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa'),
  });

  const handleSaveCreate = (data) => createMutation.mutate(data);
  const handleSaveEdit = (data) => updateMutation.mutate({ code: editPromo.makhuyenmai, body: data });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 font-heading">Quản lý Mã Giảm Giá</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tổng cộng {total} mã khuyến mãi trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm"
        >
          <Plus size={16} /> Tạo mã mới
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm theo mã khuyến mãi..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã KM</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại & Giá trị</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn tối thiểu</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời hạn</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Lượt dùng</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-16">
                <Loader2 className="animate-spin h-8 w-8 text-brand-primary mx-auto" />
              </td></tr>
            ) : promos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <Ticket size={40} className="mx-auto mb-3 opacity-30" />
                Không tìm thấy mã khuyến mãi nào
              </td></tr>
            ) : promos.map(promo => {
              const st = promoStatus(promo);
              const StatusIcon = st.icon;
              const loaiLabel = LOAI_MA_OPTIONS.find(o => o.value === promo.loaima)?.label || promo.loaima;
              const valueLabel = promo.loaima === 'PHAN_TRAM'
                ? `${promo.giatrigiam}%`
                : promo.loaima === 'FREESHIP'
                  ? 'Miễn ship'
                  : formatVND(promo.giatrigiam);

              return (
                <tr key={promo.makhuyenmai} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                        <Tag size={14} className="text-brand-primary" />
                      </div>
                      <span className="font-black text-gray-800 text-xs tracking-wide">{promo.makhuyenmai}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">{loaiLabel}</div>
                    <div className="font-bold text-brand-secondary text-sm">{valueLabel}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {parseFloat(promo.dontoithieu) > 0 ? formatVND(promo.dontoithieu) : <span className="text-gray-400 italic">Không giới hạn</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">{new Date(promo.ngaybatdau).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs text-gray-500">→ {new Date(promo.ngayketthuc).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600">
                      <span className="font-bold text-gray-800">{promo.dasd}</span> / {promo.soluongtoida}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div
                        className="bg-brand-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (promo.dasd / promo.soluongtoida) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${st.color}`}>
                      <StatusIcon size={11} /> {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditPromo(promo)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingCode(promo.makhuyenmai)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 transition">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 transition">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <PromoFormModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveCreate}
          isSaving={createMutation.isPending}
        />
      )}

      {/* EDIT MODAL */}
      {editPromo && (
        <PromoFormModal
          promo={editPromo}
          onClose={() => setEditPromo(null)}
          onSave={handleSaveEdit}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* DELETE CONFIRM */}
      {deletingCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeletingCode(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Xóa mã khuyến mãi?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn chắc chắn muốn xóa mã <strong className="text-red-600">{deletingCode}</strong>?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingCode(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Hủy</button>
              <button
                onClick={() => deleteMutation.mutate(deletingCode)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                Xóa mã
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
