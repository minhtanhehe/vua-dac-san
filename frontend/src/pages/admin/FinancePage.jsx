import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { financeApi } from '../../api/financeApi';
import { employeeApi } from '../../api/employeeApi';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Download, Loader2, DollarSign, UserCheck, Plus, X, CheckCircle, RefreshCw, Calendar
} from 'lucide-react';

const MOCK_CHART = [
  { ten: 'Tháng 1', doanhThu: 42000000, chiPhi: 28000000 },
  { ten: 'Tháng 2', doanhThu: 51000000, chiPhi: 32000000 },
  { ten: 'Tháng 3', doanhThu: 38000000, chiPhi: 25000000 },
  { ten: 'Tháng 4', doanhThu: 65000000, chiPhi: 38000000 },
  { ten: 'Tháng 5', doanhThu: 58000000, chiPhi: 35000000 },
  { ten: 'Tháng 6', doanhThu: 72000000, chiPhi: 41000000 },
];

const ROLE_LABEL = {
  QUAN_LY: 'Quản lý',
  KE_TOAN: 'Kế toán',
  BAN_HANG: 'Bán hàng',
  KHO: 'Thủ kho',
  CSKH: 'CSKH',
};

const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

// ===== PAYROLL FORM MODAL =====
function PayrollFormModal({ onClose, onSave, isSaving, employees }) {
  const now = new Date();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      maNhanVien: '',
      thang: now.getMonth() + 1,
      nam: now.getFullYear(),
      luongCoBan: '',
      tongPhuCap: 0,
      tongKhauTru: 0,
    }
  });

  const luong = parseFloat(watch('luongCoBan')) || 0;
  const phuCap = parseFloat(watch('tongPhuCap')) || 0;
  const khauTru = parseFloat(watch('tongKhauTru')) || 0;
  const thucNhan = luong + phuCap - khauTru;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold font-heading text-brand-dark">Lập bảng lương</h3>
            <p className="text-sm text-gray-400 mt-0.5">Tạo bản ghi lương mới cho nhân viên</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          {/* Employee select */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nhân viên <span className="text-red-500">*</span></label>
            <select
              {...register('maNhanVien', { required: 'Vui lòng chọn nhân viên' })}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(emp => (
                <option key={emp.manhanvien} value={emp.manhanvien}>
                  {emp.hoten} ({emp.manhanvien}) — {ROLE_LABEL[emp.vaitro] || emp.vaitro}
                </option>
              ))}
            </select>
            {errors.maNhanVien && <p className="text-red-500 text-xs mt-1">{errors.maNhanVien.message}</p>}
          </div>

          {/* Month / Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tháng <span className="text-red-500">*</span></label>
              <select
                {...register('thang', { required: true })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Năm <span className="text-red-500">*</span></label>
              <select
                {...register('nam', { required: true })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary fields */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Lương cơ bản (VNĐ) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="100000"
              {...register('luongCoBan', { required: 'Vui lòng nhập lương cơ bản', min: { value: 0, message: 'Lương phải >= 0' } })}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="VD: 8000000"
            />
            {errors.luongCoBan && <p className="text-red-500 text-xs mt-1">{errors.luongCoBan.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phụ cấp (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="50000"
                {...register('tongPhuCap')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Khấu trừ (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="50000"
                {...register('tongKhauTru')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="0"
              />
            </div>
          </div>

          {/* Real-time net salary preview */}
          <div className={`rounded-xl p-4 flex items-center justify-between ${thucNhan >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <span className="text-sm font-semibold text-gray-600">Thực nhận ước tính</span>
            <span className={`text-lg font-bold ${thucNhan >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatVND(thucNhan)}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Lưu bảng lương
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN FINANCE PAGE =====
export default function FinancePage() {
  const now = new Date();
  const [exporting, setExporting] = useState(false);
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [filterThang, setFilterThang] = useState(now.getMonth() + 1);
  const [filterNam, setFilterNam] = useState(now.getFullYear());
  const queryClient = useQueryClient();

  // Fetch payroll list
  const { data: salaries = [], isLoading: isLoadingSalaries, refetch: refetchSalaries } = useQuery({
    queryKey: ['salaries', filterThang, filterNam],
    queryFn: async () => {
      try {
        const res = await financeApi.getPayroll({ thang: filterThang, nam: filterNam });
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch {
        return [];
      }
    }
  });

  // Fetch employees for form dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-payroll'],
    queryFn: async () => {
      try {
        const res = await employeeApi.getAll({ limit: 500 });
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch {
        return [];
      }
    }
  });

  // Fetch revenue chart
  const { data: revenueData = [] } = useQuery({
    queryKey: ['revenueStats'],
    queryFn: async () => {
      try {
        const res = await api.get('/finance/statistics/revenue?loai=THANG');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  });

  // Create payroll mutation
  const createMutation = useMutation({
    mutationFn: (data) => financeApi.createPayroll(data),
    onSuccess: () => {
      toast.success('Lập bảng lương thành công!');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setShowPayrollForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi lập bảng lương'),
  });

  // Confirm payroll mutation
  const confirmMutation = useMutation({
    mutationFn: (id) => financeApi.confirmPayroll(id),
    onSuccess: () => {
      toast.success('Chốt lương thành công!');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi chốt lương'),
  });

  const totalSalary = salaries.reduce((acc, s) => acc + parseFloat(s.tongluong || 0), 0);

  const chartData = revenueData.length > 0
    ? revenueData.map(item => {
        const monthLabel = new Date(item.label).getMonth() + 1;
        const val = parseFloat(item.value);
        return {
          ten: `T${monthLabel}`,
          doanhThu: val,
          chiPhi: MOCK_CHART.find(m => m.ten === `Tháng ${monthLabel}`)?.chiPhi || (val * 0.6),
        };
      })
    : MOCK_CHART.map(m => ({ ...m, ten: m.ten.replace('Tháng ', 'T') }));

  const latestRevenue = revenueData.length > 0
    ? parseFloat(revenueData[revenueData.length - 1]?.value || 0)
    : 72000000;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await financeApi.exportExcel({ thang: filterThang, nam: filterNam });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_luong_t${filterThang}_${filterNam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất báo cáo Excel thành công!');
    } catch {
      toast.error('Lỗi xuất báo cáo');
    } finally {
      setExporting(false);
    }
  };

  const handleSavePayroll = (data) => {
    createMutation.mutate({
      maNhanVien: data.maNhanVien,
      thang: parseInt(data.thang),
      nam: parseInt(data.nam),
      luongCoBan: parseFloat(data.luongCoBan),
      tongPhuCap: parseFloat(data.tongPhuCap) || 0,
      tongKhauTru: parseFloat(data.tongKhauTru) || 0,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Tài chính &amp; Tiền lương</h1>
          <p className="text-sm text-gray-500">Thống kê doanh thu, chi phí và bảng lương nhân viên</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPayrollForm(true)}
            className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-5 py-3 rounded-xl hover:bg-brand-primary/90 transition shadow-sm"
          >
            <Plus size={18} /> Lập bảng lương
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={18} />}
            Xuất Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold">Doanh thu tháng này</div>
            <div className="text-xl font-bold text-brand-dark font-heading">{formatVND(latestRevenue)}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold">Tổng quỹ lương T{filterThang}/{filterNam}</div>
            <div className="text-xl font-bold text-brand-dark font-heading">{formatVND(totalSalary)}</div>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light">
        <h3 className="font-bold text-brand-dark mb-6 font-heading">Doanh thu &amp; Chi phí theo tháng</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="ten" stroke="#a0a0a0" fontSize={12} tickLine={false} />
              <YAxis stroke="#a0a0a0" fontSize={12} tickLine={false} tickFormatter={v => `${v / 1000000}M`} />
              <Tooltip formatter={v => formatVND(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0' }} />
              <Bar dataKey="doanhThu" name="Doanh thu" fill="#D4A373" radius={[6, 6, 0, 0]} />
              <Bar dataKey="chiPhi" name="Chi phí" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        {/* Table header with filter */}
        <div className="p-6 border-b border-brand-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-brand-dark font-heading">Bảng lương Nhân viên</h3>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={filterThang}
              onChange={e => setFilterThang(Number(e.target.value))}
              className="border border-brand-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={filterNam}
              onChange={e => setFilterNam(Number(e.target.value))}
              className="border border-brand-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => refetchSalaries()}
              className="p-2 rounded-lg border border-brand-light text-gray-500 hover:bg-gray-50 transition"
              title="Làm mới"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {isLoadingSalaries ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
          </div>
        ) : salaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserCheck size={48} className="mb-3 opacity-30" />
            <p className="font-semibold">Chưa có bảng lương nào trong kỳ này</p>
            <p className="text-sm mt-1">Bấm "+ Lập bảng lương" để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Lương cơ bản</th>
                  <th className="px-6 py-4 text-right">Phụ cấp</th>
                  <th className="px-6 py-4 text-right">Khấu trừ</th>
                  <th className="px-6 py-4 text-right">Thực nhận</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {salaries.map(s => (
                  <tr key={s.mabangluong || `${s.manhanvien}-${s.thang}-${s.nam}`} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-dark">{s.tennhanvien || s.manhanvien}</div>
                      <div className="text-xs text-gray-400">{s.manhanvien}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-brand-light px-2.5 py-1 rounded-full text-brand-accent">
                        {ROLE_LABEL[s.vaitro] || s.vaitro || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatVND(s.luongcoban)}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {parseFloat(s.tongphucap) > 0 ? `+${formatVND(s.tongphucap)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-red-500">
                      {parseFloat(s.tongkhautru) > 0 ? `-${formatVND(s.tongkhautru)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-brand-dark">{formatVND(s.tongluong)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.trangthai === 'Đã chốt' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.trangthai}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.trangthai !== 'Đã chốt' ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận chốt lương cho ${s.tennhanvien || s.manhanvien} tháng ${s.thang}/${s.nam}?`)) {
                              confirmMutation.mutate(s.mabangluong);
                            }
                          }}
                          disabled={confirmMutation.isPending}
                          className="flex items-center gap-1.5 mx-auto text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          Chốt lương
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payroll Form Modal */}
      {showPayrollForm && (
        <PayrollFormModal
          onClose={() => setShowPayrollForm(false)}
          onSave={handleSavePayroll}
          isSaving={createMutation.isPending}
          employees={employees}
        />
      )}
    </div>
  );
}
