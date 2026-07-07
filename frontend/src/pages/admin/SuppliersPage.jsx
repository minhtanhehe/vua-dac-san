import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi } from '../../api/supplierApi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  Search, Plus, Loader2, X, Pencil, Trash2, Eye, Truck, Phone, Mail, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';

const MOCK_SUPPLIERS = [
  { mancc: 'NCC001', tenncc: 'Công ty Bình Dương', sdt: '02743123456', email: 'contact@binhduong.vn', diachi: '123 Lê Lợi, TP. Thủ Dầu Một, Bình Dương', trangthai: 'Đang hợp tác' },
  { mancc: 'NCC002', tenncc: 'HTX Dừa Bến Tre', sdt: '02753123456', email: 'htxdua@bentre.vn', diachi: '456 Trần Hưng Đạo, TP. Bến Tre', trangthai: 'Đang hợp tác' },
  { mancc: 'NCC003', tenncc: 'Làng nghề Huế', sdt: '02343456789', email: 'langnghehue@hue.vn', diachi: '78 Nguyễn Huệ, TP. Huế', trangthai: 'Đang hợp tác' },
  { mancc: 'NCC004', tenncc: 'Hợp tác xã Tây Bắc', sdt: '02153456789', email: 'htxtaybac@dienbienphu.vn', diachi: '99 Trường Chinh, TP. Điện Biên Phủ', trangthai: 'Ngừng hợp tác' },
];

const STATUS_COLOR = {
  'Đang hợp tác': 'bg-green-100 text-green-700',
  'Ngừng hợp tác': 'bg-red-100 text-red-700',
};

// ===== SUPPLIER FORM MODAL =====
function SupplierFormModal({ supplier, onClose, onSave, isSaving }) {
  const isEdit = !!supplier;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      tenNCC: supplier.tenncc, sdt: supplier.sdt, email: supplier.email || '', diaChi: supplier.diachi || '',
      trangThai: supplier.trangthai || 'Đang hợp tác',
    } : { tenNCC: '', sdt: '', email: '', diaChi: '', trangThai: 'Đang hợp tác' }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-heading text-brand-dark">{isEdit ? 'Chỉnh sửa NCC' : 'Thêm Nhà cung cấp mới'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tên nhà cung cấp <span className="text-red-500">*</span></label>
            <input {...register('tenNCC', { required: 'Vui lòng nhập tên NCC' })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="VD: Công ty TNHH ABC" />
            {errors.tenNCC && <p className="text-red-500 text-xs mt-1">{errors.tenNCC.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
              <input {...register('sdt', { required: 'Vui lòng nhập SĐT' })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="02743123456" />
              {errors.sdt && <p className="text-red-500 text-xs mt-1">{errors.sdt.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
              <input type="email" {...register('email')} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="contact@ncc.vn" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Địa chỉ</label>
            <textarea {...register('diaChi')} rows={2} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" placeholder="Địa chỉ nhà cung cấp..." />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Trạng thái</label>
              <select {...register('trangThai')} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white">
                <option value="Đang hợp tác">Đang hợp tác</option>
                <option value="Ngừng hợp tác">Ngừng hợp tác</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button type="submit" disabled={isSaving} className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              {isEdit ? 'Cập nhật' : 'Thêm NCC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== SUPPLIER DETAIL MODAL =====
function SupplierDetailModal({ supplier, onClose }) {
  if (!supplier) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-brand-dark">Chi tiết Nhà cung cấp</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
        </div>
        <div className="space-y-3 text-sm divide-y divide-brand-light">
          <div className="flex justify-between py-2"><span className="text-gray-500">Mã NCC</span><span className="font-bold">{supplier.mancc}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Tên NCC</span><span className="font-semibold">{supplier.tenncc}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">SĐT</span><span>{supplier.sdt}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Email</span><span>{supplier.email || '—'}</span></div>
          <div className="py-2"><span className="text-gray-500 block mb-1">Địa chỉ</span><p className="text-brand-dark">{supplier.diachi || '—'}</p></div>
          <div className="flex justify-between py-2 items-center"><span className="text-gray-500">Trạng thái</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[supplier.trangthai] || 'bg-gray-100 text-gray-600'}`}>{supplier.trangthai}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition">Đóng</button>
      </div>
    </div>
  );
}

// ===== DELETE CONFIRM MODAL =====
function DeleteConfirmModal({ title, message, onClose, onConfirm, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0"><Trash2 size={24} /></div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark font-heading">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null} Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN SUPPLIERS PAGE =====
export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppData, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => {
      try {
        const res = await supplierApi.getAll({ page, limit: 12, search: search || undefined });
        const raw = res.data;
        if (raw && raw.data && raw.total !== undefined) return raw;
        const arr = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        return { data: arr, total: arr.length, page: 1, totalPages: 1 };
      } catch {
        return { data: MOCK_SUPPLIERS, total: MOCK_SUPPLIERS.length, page: 1, totalPages: 1 };
      }
    }
  });

  const suppliers = suppData?.data || [];
  const totalPages = suppData?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data) => supplierApi.create(data),
    onSuccess: () => { toast.success('Thêm nhà cung cấp thành công!'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setShowForm(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi thêm nhà cung cấp')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật NCC thành công!'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setEditSupplier(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật NCC')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierApi.delete(id),
    onSuccess: (res) => { toast.success(res.data?.message || 'Xóa NCC thành công!'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa NCC')
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Nhà cung cấp</h1>
          <p className="text-sm text-gray-500">Danh sách đối tác cung cấp hàng hóa đặc sản</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm">
          <Plus size={18} /> Thêm NCC
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, SĐT, mã NCC..." className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map(s => (
            <div key={s.mancc} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md hover:border-brand-primary/30 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary flex-shrink-0">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-dark leading-tight">{s.tenncc}</h3>
                    <p className="text-xs text-gray-400">{s.mancc}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[s.trangthai] || 'bg-gray-100 text-gray-600'}`}>{s.trangthai}</span>
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span>{s.sdt}</span></div>
                {s.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} className="text-gray-400 flex-shrink-0" /><span className="truncate">{s.email}</span></div>}
                {s.diachi && <div className="flex items-start gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{s.diachi}</span></div>}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-brand-light">
                <button onClick={() => setSelectedSupplier(s)} className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
                  <Eye size={14} className="inline mr-1" /> Xem
                </button>
                <button onClick={() => setEditSupplier(s)} className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition">
                  <Pencil size={14} className="inline mr-1" /> Sửa
                </button>
                <button onClick={() => setDeleteTarget(s)} className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition">
                  <Trash2 size={14} className="inline mr-1" /> Xóa
                </button>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Truck size={48} className="mx-auto mb-4 opacity-30" /><p>Không tìm thấy nhà cung cấp nào</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30"><ChevronLeft size={18} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm font-bold transition ${p === page ? 'bg-brand-primary text-brand-dark' : 'border border-brand-light text-gray-500 hover:bg-white'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}

      {/* Modals */}
      {selectedSupplier && <SupplierDetailModal supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />}
      {showForm && <SupplierFormModal supplier={null} onClose={() => setShowForm(false)} onSave={(data) => createMutation.mutate(data)} isSaving={createMutation.isPending} />}
      {editSupplier && <SupplierFormModal supplier={editSupplier} onClose={() => setEditSupplier(null)} onSave={(data) => updateMutation.mutate({ id: editSupplier.mancc, data })} isSaving={updateMutation.isPending} />}
      {deleteTarget && <DeleteConfirmModal title="Xóa nhà cung cấp?" message={`Bạn có chắc muốn xóa "${deleteTarget.tenncc}" (${deleteTarget.mancc})? Nếu NCC có giao dịch, hệ thống sẽ tự chuyển sang Ngừng hợp tác.`} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.mancc)} isDeleting={deleteMutation.isPending} />}
    </div>
  );
}
