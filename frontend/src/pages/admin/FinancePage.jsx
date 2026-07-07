import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, Loader2, DollarSign, UserCheck } from 'lucide-react';

const MOCK_SALARY = [
  { manhanvien: 'NV001', tennhanvien: 'Nguyễn Văn An', vaitro: 'BAN_HANG', luongcoban: 8000000, thuong: 1200000, khautru: 0, thangnam: '06/2026', trangthai: 'Đã chốt' },
  { manhanvien: 'NV002', tennhanvien: 'Trần Thị Bình', vaitro: 'KHO', luongcoban: 7500000, thuong: 800000, khautru: 200000, thangnam: '06/2026', trangthai: 'Đã chốt' },
  { manhanvien: 'NV003', tennhanvien: 'Lê Minh Cường', vaitro: 'CSKH', luongcoban: 7000000, thuong: 500000, khautru: 0, thangnam: '06/2026', trangthai: 'Chưa chốt' },
  { manhanvien: 'NV004', tennhanvien: 'Phạm Thu Dung', vaitro: 'KE_TOAN', luongcoban: 9000000, thuong: 1500000, khautru: 0, thangnam: '06/2026', trangthai: 'Đã chốt' },
];

const MOCK_CHART = [
  { ten: 'Tháng 1', doanhThu: 42000000, chiPhi: 28000000 },
  { ten: 'Tháng 2', doanhThu: 51000000, chiPhi: 32000000 },
  { ten: 'Tháng 3', doanhThu: 38000000, chiPhi: 25000000 },
  { ten: 'Tháng 4', doanhThu: 65000000, chiPhi: 38000000 },
  { ten: 'Tháng 5', doanhThu: 58000000, chiPhi: 35000000 },
  { ten: 'Tháng 6', doanhThu: 72000000, chiPhi: 41000000 },
];

export default function FinancePage() {
  const [exporting, setExporting] = useState(false);

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: async () => {
      try {
        const now = new Date();
        const res = await api.get(`/finance/payroll?thang=${now.getMonth() + 1}&nam=${now.getFullYear()}`);
        const raw = res.data;
        return Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
      } catch {
        return MOCK_SALARY;
      }
    }
  });

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

  const formatVND = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  const totalSalary = salaries.reduce((acc, s) => acc + (s.luongcoban || 0) + (s.thuong || 0) - (s.khautru || 0), 0);

  // Map monthly revenue from database, fallback to mock if empty
  const chartData = revenueData.length > 0
    ? revenueData.map((item, idx) => {
        const monthLabel = new Date(item.label).getMonth() + 1;
        const val = parseFloat(item.value);
        const mockCost = MOCK_CHART.find(m => m.ten === `Tháng ${monthLabel}`)?.chiPhi || (val * 0.6);
        return {
          ten: `Tháng ${monthLabel}`,
          doanhThu: val,
          chiPhi: mockCost
        };
      })
    : MOCK_CHART;

  const latestRevenue = revenueData.length > 0 
    ? parseFloat(revenueData[revenueData.length - 1]?.value || 0) 
    : 72000000;

  const handleExport = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const res = await api.get(`/finance/statistics/export?thang=${now.getMonth() + 1}&nam=${now.getFullYear()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao_cao_luong_t${now.getMonth() + 1}_${now.getFullYear()}.xlsx`);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Tài chính & Tiền lương</h1>
          <p className="text-sm text-gray-500">Thống kê doanh thu, chi phí và bảng lương nhân viên</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm disabled:opacity-50"
        >
          {exporting ? <Loader2 className="animate-spin h-5 w-5" /> : <Download size={18} />}
          Xuất báo cáo Excel
        </button>
      </div>

      {/* KPI summary */}
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
            <div className="text-xs text-gray-400 uppercase font-bold">Tổng quỹ lương</div>
            <div className="text-xl font-bold text-brand-dark font-heading">{formatVND(totalSalary)}</div>
          </div>
        </div>
      </div>

      {/* Bar chart revenue vs expenses */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-light">
        <h3 className="font-bold text-brand-dark mb-6 font-heading">Doanh thu & Chi phí 6 tháng đầu năm 2026</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="ten" stroke="#a0a0a0" fontSize={12} tickLine={false} />
              <YAxis stroke="#a0a0a0" fontSize={12} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
              <Tooltip formatter={v => formatVND(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0' }} />
              <Bar dataKey="doanhThu" name="Doanh thu" fill="#D4A373" radius={[6,6,0,0]} />
              <Bar dataKey="chiPhi" name="Chi phí" fill="#2D6A4F" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salary table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        <div className="p-6 border-b border-brand-light">
          <h3 className="font-bold text-brand-dark font-heading">Bảng lương Tháng 6/2026</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Lương cơ bản</th>
                  <th className="px-6 py-4 text-right">Thưởng</th>
                  <th className="px-6 py-4 text-right">Khấu trừ</th>
                  <th className="px-6 py-4 text-right">Thực nhận</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {salaries.map(s => {
                  const net = (s.luongcoban || 0) + (s.thuong || 0) - (s.khautru || 0);
                  return (
                    <tr key={s.manhanvien} className="hover:bg-brand-bg/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-dark">{s.tennhanvien}</div>
                        <div className="text-xs text-gray-400">{s.manhanvien}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-brand-light px-2.5 py-1 rounded-full text-brand-accent">{s.vaitro}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">{formatVND(s.luongcoban)}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">+{formatVND(s.thuong)}</td>
                      <td className="px-6 py-4 text-right text-red-500">{s.khautru > 0 ? `-${formatVND(s.khautru)}` : '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-brand-dark">{formatVND(net)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.trangthai === 'Đã chốt' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {s.trangthai}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
