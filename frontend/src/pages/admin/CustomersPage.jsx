import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  Search, Plus, Loader2, X, Pencil, Trash2, Eye, User, Phone, Mail, MapPin, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

const MOCK_CUSTOMERS = [
  { makhachhang: 'KH001', hoten: 'Lê Văn Nam', sdt: '0987654321', email: 'nam.le@gmail.com', ngaysinh: '1990-04-12', trangthai: 1 },
  { makhachhang: 'KH002', hoten: 'Nguyễn Thị Hoa', sdt: '0976543210', email: 'hoa.nguyen@yahoo.com', ngaysinh: '1995-08-22', trangthai: 1 },
  { makhachhang: 'KH003', hoten: 'Trần Minh Hoàng', sdt: '0965432109', email: 'hoang.tran@outlook.com', ngaysinh: '1988-12-05', trangthai: 0 },
];

// ===== CUSTOMER FORM MODAL =====
function CustomerFormModal({ customer, onClose, onSave, isSaving }) {
  const isEdit = !!customer;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      hoTen: customer.hoten,
      sdt: customer.sdt,
      email: customer.email || '',
      ngaySinh: customer.ngaysinh ? customer.ngaysinh.split('T')[0] : '',
      trangThai: customer.trangthai ?? 1
    } : {
      hoTen: '',
      sdt: '',
      email: '',
      ngaySinh: '',
      trangThai: 1
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-heading text-brand-dark">
            {isEdit ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
            <input
              {...register('hoTen', { required: 'Vui lòng nhập họ tên' })}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Nguyễn Văn A"
            />
            {errors.hoTen && <p className="text-red-500 text-xs mt-1">{errors.hoTen.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
              <input
                {...register('sdt', { required: 'Vui lòng nhập số điện thoại' })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="0987654321"
              />
              {errors.sdt && <p className="text-red-500 text-xs mt-1">{errors.sdt.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Ngày sinh</label>
              <input
                type="date"
                {...register('ngaySinh')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Trạng thái tài khoản</label>
                <select
                  {...register('trangThai')}
                  className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Đã khóa</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== CUSTOMER DETAIL MODAL =====
function CustomerDetailModal({ customer, onClose }) {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-brand-dark">Chi tiết Khách hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
        </div>
        <div className="space-y-3 text-sm divide-y divide-brand-light">
          <div className="flex justify-between py-2"><span className="text-gray-500">Mã KH</span><span className="font-bold">{customer.makhachhang}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Họ tên</span><span className="font-semibold">{customer.hoten}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">SĐT</span><span>{customer.sdt}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Email</span><span>{customer.email || '—'}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Ngày sinh</span><span>{customer.ngaysinh ? new Date(customer.ngaysinh).toLocaleDateString('vi-VN') : '—'}</span></div>
          <div className="flex justify-between py-2 items-center"><span className="text-gray-500">Trạng thái</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${customer.trangthai === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {customer.trangthai === 1 ? 'Hoạt động' : 'Đã khóa'}
            </span>
          </div>
          {customer.diaChi && Array.isArray(customer.diaChi) && customer.diaChi.length > 0 && (
            <div className="py-2">
              <span className="text-gray-500 block mb-1">Địa chỉ giao hàng</span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {customer.diaChi.map((addr) => (
                  <li key={addr.maDiaChi} className="flex gap-1.5 items-start">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{addr.diaChiChiTiet} {addr.laMacDinh && <strong className="text-brand-accent">(Mặc định)</strong>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

// ===== MAIN CUSTOMERS PAGE =====
export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: custData, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      try {
        const res = await customerApi.getAll({ page, limit: 10, search: search || undefined });
        const raw = res.data;
        if (raw && raw.data && raw.totalItems !== undefined) {
          return { data: raw.data, totalPages: raw.totalPages, page: raw.currentPage };
        }
        const arr = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        return { data: arr, totalPages: 1, page: 1 };
      } catch {
        return { data: MOCK_CUSTOMERS, totalPages: 1, page: 1 };
      }
    }
  });

  const customers = custData?.data || [];
  const totalPages = custData?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: () => {
      toast.success('Thêm khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi thêm khách hàng')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditCustomer(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật khách hàng')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa khách hàng (Có thể khách hàng đã phát sinh đơn hàng)')
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý tài khoản khách hàng, địa chỉ và thông tin mua hàng</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm">
          <Plus size={18} /> Thêm khách hàng
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên, email, SĐT..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Ngày sinh</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <User size={48} className="mx-auto mb-4 opacity-30" />
                      <p>Không có khách hàng nào phù hợp</p>
                    </td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.makhachhang} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-brand-dark">{c.hoten}</div>
                        <div className="text-xs text-gray-400">{c.makhachhang}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.sdt}</td>
                    <td className="px-6 py-4 text-gray-600">{c.email || '—'}</td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {c.ngaysinh ? new Date(c.ngaysinh).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.trangthai === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.trangthai === 1 ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelectedCustomer(c)} title="Xem chi tiết" className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"><Eye size={16} /></button>
                        <button onClick={() => setEditCustomer(c)} title="Chỉnh sửa" className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteTarget(c)} title="Xóa" className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
      {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}

      {showForm && (
        <CustomerFormModal
          customer={null}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
        />
      )}

      {editCustomer && (
        <CustomerFormModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSave={(data) => updateMutation.mutate({ id: editCustomer.makhachhang, data })}
          isSaving={updateMutation.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Xóa khách hàng?"
          message={`Bạn có chắc muốn xóa khách hàng "${deleteTarget.hoten}" (${deleteTarget.makhachhang})?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.makhachhang)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
