import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../../api/employeeApi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  Search, UserPlus, Mail, Phone, User, Loader2, X, Pencil, Eye, Lock, Unlock, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';

const MOCK_EMPLOYEES = [
  { manhanvien: 'NV001', hoten: 'Nguyễn Văn An', email: 'an.nguyen@vuadacsan.com', sdt: '0901234567', chucvu: 'BAN_HANG', trangthai: 1, ngaytao: '2024-03-01', ngaysinh: '1995-05-15', cccd: '079095001234' },
  { manhanvien: 'NV002', hoten: 'Trần Thị Bình', email: 'binh.tran@vuadacsan.com', sdt: '0912345678', chucvu: 'KHO', trangthai: 1, ngaytao: '2024-05-15', ngaysinh: '1993-10-20', cccd: '079093001235' },
  { manhanvien: 'NV003', hoten: 'Lê Minh Cường', email: 'cuong.le@vuadacsan.com', sdt: '0923456789', chucvu: 'CSKH', trangthai: 1, ngaytao: '2024-07-10', ngaysinh: '1996-01-10', cccd: '079096001236' },
  { manhanvien: 'NV004', hoten: 'Phạm Thu Dung', email: 'dung.pham@vuadacsan.com', sdt: '0934567890', chucvu: 'KE_TOAN', trangthai: 0, ngaytao: '2023-12-01', ngaysinh: '1994-08-25', cccd: '079094001237' },
];

const ROLE_LABELS = { BAN_HANG: 'Bán hàng', KHO: 'Thủ kho', CSKH: 'CSKH', KE_TOAN: 'Kế toán', QUAN_LY: 'Quản lý' };
const ROLE_COLORS = {
  BAN_HANG: 'bg-blue-100 text-blue-700', KHO: 'bg-orange-100 text-orange-700', CSKH: 'bg-purple-100 text-purple-700',
  KE_TOAN: 'bg-green-100 text-green-700', QUAN_LY: 'bg-brand-primary/20 text-brand-accent',
};
const AVATAR_COLORS = ['#D4A373', '#2D6A4F', '#C97A34', '#6B7280', '#8B5CF6'];
function getInitials(name) { return name ? name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : '?'; }

// ===== EMPLOYEE FORM MODAL =====
function EmployeeFormModal({ employee, onClose, onSave, isSaving }) {
  const isEdit = !!employee;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      hoTen: employee.hoten, email: employee.email, sdt: employee.sdt,
      chucVu: employee.chucvu, ngaySinh: employee.ngaysinh ? employee.ngaysinh.split('T')[0] : '', cccd: employee.cccd || '',
    } : { hoTen: '', email: '', sdt: '', chucVu: '', ngaySinh: '', cccd: '' }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-heading text-brand-dark">{isEdit ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
            <input {...register('hoTen', { required: 'Vui lòng nhập họ tên' })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Nguyễn Văn A" />
            {errors.hoTen && <p className="text-red-500 text-xs mt-1">{errors.hoTen.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="nv@vuadacsan.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
              <input {...register('sdt', { required: 'Vui lòng nhập SĐT' })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="0901234567" />
              {errors.sdt && <p className="text-red-500 text-xs mt-1">{errors.sdt.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Chức vụ <span className="text-red-500">*</span></label>
              <select {...register('chucVu', { required: 'Vui lòng chọn chức vụ' })} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white">
                <option value="">-- Chọn chức vụ --</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              {errors.chucVu && <p className="text-red-500 text-xs mt-1">{errors.chucVu.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Ngày sinh</label>
              <input type="date" {...register('ngaySinh')} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">CCCD</label>
            <input {...register('cccd')} className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="079095001234" />
          </div>
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <Shield size={16} className="inline mr-2" />
              Tài khoản đăng nhập sẽ được tự động tạo với mật khẩu mặc định: <strong>Abc@123456</strong>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button type="submit" disabled={isSaving} className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              {isEdit ? 'Cập nhật' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== EMPLOYEE DETAIL MODAL =====
function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-brand-dark">Chi tiết Nhân viên</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
        </div>
        <div className="space-y-3 text-sm divide-y divide-brand-light">
          <div className="flex justify-between py-2"><span className="text-gray-500">Mã NV</span><span className="font-bold">{employee.manhanvien}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Họ tên</span><span className="font-semibold">{employee.hoten}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Email</span><span>{employee.email}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">SĐT</span><span>{employee.sdt}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Chức vụ</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${ROLE_COLORS[employee.chucvu] || 'bg-gray-100'}`}>{ROLE_LABELS[employee.chucvu] || employee.chucvu}</span>
          </div>
          <div className="flex justify-between py-2"><span className="text-gray-500">CCCD</span><span>{employee.cccd || '—'}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Ngày sinh</span><span>{employee.ngaysinh ? new Date(employee.ngaysinh).toLocaleDateString('vi-VN') : '—'}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Ngày vào</span><span>{employee.ngaytao ? new Date(employee.ngaytao).toLocaleDateString('vi-VN') : '—'}</span></div>
          <div className="flex justify-between py-2 items-center"><span className="text-gray-500">Trạng thái</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${employee.trangthai === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {employee.trangthai === 1 ? 'Đang hoạt động' : 'Đã khóa'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition">Đóng</button>
      </div>
    </div>
  );
}

// ===== MAIN EMPLOYEES PAGE =====
export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const queryClient = useQueryClient();

  const { data: empData, isLoading } = useQuery({
    queryKey: ['employees', page, search, roleFilter],
    queryFn: async () => {
      try {
        const res = await employeeApi.getAll({ page, limit: 12, search: search || undefined, chucVu: roleFilter || undefined });
        const raw = res.data;
        if (raw && raw.data && raw.total !== undefined) return raw;
        const arr = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        return { data: arr, total: arr.length, page: 1, totalPages: 1 };
      } catch {
        return { data: MOCK_EMPLOYEES, total: MOCK_EMPLOYEES.length, page: 1, totalPages: 1 };
      }
    }
  });

  const employees = empData?.data || [];
  const totalPages = empData?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data) => employeeApi.create(data),
    onSuccess: (res) => {
      const pwd = res.data?.defaultPassword || 'Abc@123456';
      toast.success(`Thêm nhân viên thành công! Mật khẩu mặc định: ${pwd}`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi thêm nhân viên')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật nhân viên thành công!'); queryClient.invalidateQueries({ queryKey: ['employees'] }); setEditEmployee(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật nhân viên')
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, trangThai }) => employeeApi.updateStatus(id, { trangThai }),
    onSuccess: () => { toast.success('Cập nhật trạng thái thành công!'); queryClient.invalidateQueries({ queryKey: ['employees'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật trạng thái')
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Nhân sự</h1>
          <p className="text-sm text-gray-500">Danh sách nhân viên và phân quyền hệ thống</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm">
          <UserPlus size={18} /> Thêm nhân viên
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(ROLE_LABELS).map(([key, label]) => {
          const count = employees.filter(e => e.chucvu === key).length;
          return (
            <div key={key} className="bg-white border border-brand-light rounded-2xl p-5 shadow-sm">
              <div className={`text-2xl font-bold font-heading ${ROLE_COLORS[key]?.split(' ')[1] || 'text-brand-dark'}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, email, SĐT..." className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="px-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
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
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4 text-center">Chức vụ</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {employees.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400"><User size={48} className="mx-auto mb-4 opacity-30" /><p>Không tìm thấy nhân viên nào</p></td></tr>
                )}
                {employees.map((e, idx) => (
                  <tr key={e.manhanvien} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                          {getInitials(e.hoten)}
                        </div>
                        <div>
                          <div className="font-bold text-brand-dark">{e.hoten}</div>
                          <div className="text-xs text-gray-400">{e.manhanvien}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{e.email}</td>
                    <td className="px-6 py-4 text-gray-600">{e.sdt}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[e.chucvu] || 'bg-gray-100 text-gray-600'}`}>{ROLE_LABELS[e.chucvu] || e.chucvu}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${e.trangthai === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {e.trangthai === 1 ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelectedEmployee(e)} title="Xem chi tiết" className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"><Eye size={16} /></button>
                        <button onClick={() => setEditEmployee(e)} title="Chỉnh sửa" className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil size={16} /></button>
                        <button
                          onClick={() => statusMutation.mutate({ id: e.manhanvien, trangThai: e.trangthai === 1 ? 0 : 1 })}
                          title={e.trangthai === 1 ? 'Khóa tài khoản' : 'Mở khóa'}
                          className={`p-2 rounded-lg transition ${e.trangthai === 1 ? 'text-gray-500 hover:bg-red-50 hover:text-red-600' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}`}
                        >
                          {e.trangthai === 1 ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
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
      {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
      {showForm && <EmployeeFormModal employee={null} onClose={() => setShowForm(false)} onSave={(data) => createMutation.mutate(data)} isSaving={createMutation.isPending} />}
      {editEmployee && <EmployeeFormModal employee={editEmployee} onClose={() => setEditEmployee(null)} onSave={(data) => updateMutation.mutate({ id: editEmployee.manhanvien, data })} isSaving={updateMutation.isPending} />}
    </div>
  );
}
