import exceljs from 'exceljs';
import { FinanceModel } from '../models/finance.model.js';
import { orderApi, productApi, warehouseApi, userApi } from '../config/axios.js';

export const FinanceController = {
  // --- PAYROLL ---
  async getPayroll(req, res) {
    try {
      const result = await FinanceModel.getPayroll(req.query);

      // Enrich with employee names from user-service (best-effort, no auth token needed for internal call)
      let employeeMap = {};
      try {
        const empRes = await userApi.get('/employees', { params: { limit: 500 } });
        const empList = empRes.data?.data || empRes.data || [];
        empList.forEach(emp => {
          employeeMap[emp.manhanvien] = { tennhanvien: emp.hoten, vaitro: emp.vaitro };
        });
      } catch (empErr) {
        console.warn('Could not fetch employee names from user-service:', empErr.message);
      }

      const enriched = result.map(r => ({
        ...r,
        tennhanvien: employeeMap[r.manhanvien]?.tennhanvien || r.manhanvien,
        vaitro: employeeMap[r.manhanvien]?.vaitro || '',
      }));

      return res.json(enriched);
    } catch (err) {
      console.error('Error getting payroll:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn bảng lương' });
    }
  },

  async createPayroll(req, res) {
    try {
      const { maNhanVien, thang, nam, luongCoBan, tongPhuCap, tongKhauTru } = req.body;

      if (!maNhanVien || !thang || !nam || luongCoBan === undefined) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (maNhanVien, thang, nam, luongCoBan)' });
      }

      // Check if payroll already exists for this employee/month/year
      const existing = await FinanceModel.getPayroll({ thang, nam, maNhanVien });
      if (existing && existing.length > 0) {
        return res.status(400).json({ message: 'Bảng lương của nhân viên này trong tháng/năm đã được khởi tạo trước đó' });
      }

      const newPayroll = await FinanceModel.createPayroll({
        thang,
        nam,
        luongCoBan,
        tongPhuCap: tongPhuCap || 0,
        tongKhauTru: tongKhauTru || 0,
        maNhanVien,
        maNVKeToan: req.user.tenDangnhap
      });

      return res.status(201).json({ message: 'Khởi tạo bảng lương thành công', payroll: newPayroll });
    } catch (err) {
      console.error('Error creating payroll:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi khởi tạo bảng lương' });
    }
  },

  async confirmPayroll(req, res) {
    try {
      const { id } = req.params;
      const payroll = await FinanceModel.getPayrollById(id);
      if (!payroll) {
        return res.status(404).json({ message: 'Không tìm thấy bảng lương' });
      }

      if (payroll.trangthai === 'Đã chốt') {
        return res.status(400).json({ message: 'Bảng lương này đã được chốt từ trước' });
      }

      const updated = await FinanceModel.confirmPayroll(id);
      return res.json({ message: 'Chốt bảng lương thành công', payroll: updated });
    } catch (err) {
      console.error('Error confirming payroll:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // --- SHIFT SETTLEMENT ---
  async settleShift(req, res) {
    try {
      const { ngayQuyetToan, caLam, doanhThuThucTe, maNVBanHang, ghiChu } = req.body;

      if (!ngayQuyetToan || !caLam || doanhThuThucTe === undefined || !maNVBanHang) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (ngayQuyetToan, caLam, doanhThuThucTe, maNVBanHang)' });
      }

      // 1. Call order-service to retrieve system revenue
      let doanhThuHeThong = 0;
      try {
        const response = await orderApi.get('/revenue', {
          params: { ngay: ngayQuyetToan, ca: caLam, maNV: maNVBanHang }
        });
        doanhThuHeThong = response.data.doanhThuHeThong;
      } catch (err) {
        console.error('Failed to retrieve revenue from order-service:', err.message);
        return res.status(500).json({ message: 'Không thể kết nối với dịch vụ đơn hàng để lấy doanh thu hệ thống' });
      }

      // 2. Save shift settlement in database
      const result = await FinanceModel.settleShift({
        ngayQuyetToan,
        caLam,
        doanhThuThucTe,
        doanhThuHeThong,
        maNVBanHang,
        maNVKeToan: req.user.tenDangnhap,
        ghiChu
      });

      return res.status(201).json({ message: 'Quyết toán ca làm việc thành công', shiftSettlement: result });
    } catch (err) {
      console.error('Error settling shift:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi quyết toán ca' });
    }
  },

  async getShiftSettlements(req, res) {
    try {
      const result = await FinanceModel.getShiftSettlements(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting shift settlements:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách quyết toán ca' });
    }
  },

  // --- WAREHOUSE PAYMENTS ---
  async getWarehousePayments(req, res) {
    try {
      const result = await FinanceModel.getWarehousePayments();
      return res.json(result);
    } catch (err) {
      console.error('Error getting warehouse payments:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  async payWarehouseInvoice(req, res) {
    try {
      const { id } = req.params;
      const { phuongThuc, ghiChu } = req.body;

      if (!phuongThuc) {
        return res.status(400).json({ message: 'Phương thức thanh toán là bắt buộc' });
      }

      const payment = await FinanceModel.getPaymentById(id);
      if (!payment) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
      }

      if (payment.phuongthuc) {
        return res.status(400).json({ message: 'Hóa đơn kho này đã được thanh toán trước đó' });
      }

      // Update local payment record
      const updated = await FinanceModel.payWarehouseInvoice(id, {
        phuongThuc,
        maNVKeToan: req.user.tenDangnhap,
        ghiChu
      });

      // Notify warehouse-service to update the original invoice status to 'Đã thanh toán'
      try {
        await warehouseApi.patch(`/invoices/${payment.maphieukho}/payment-status`, {
          trangThaiTT: 'Đã thanh toán'
        });
      } catch (err) {
        console.error(`Failed to update invoice status in warehouse-service for ${payment.maphieukho}:`, err.message);
        // Note: We don't rollback local payment to avoid inconsistent state, but we log the warning.
      }

      return res.json({ message: 'Thanh toán hóa đơn kho thành công', payment: updated });
    } catch (err) {
      console.error('Error paying warehouse invoice:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi thanh toán hóa đơn kho' });
    }
  },

  // --- STATISTICS ---
  async getRevenueStatistics(req, res) {
    try {
      const { loai, tuNgay, denNgay } = req.query;
      const response = await orderApi.get('/statistics/revenue', {
        params: { loai, tuNgay, denNgay }
      });
      return res.json(response.data);
    } catch (err) {
      console.error('Error getting revenue statistics:', err.message);
      return res.status(500).json({ message: 'Không thể lấy dữ liệu doanh thu từ dịch vụ đơn hàng' });
    }
  },

  // --- EXCEL EXPORT ---
  async exportExcel(req, res) {
    try {
      const { loai = 'NGAY', tuNgay, denNgay, thang, nam } = req.query;
      const currentMonth = thang ? parseInt(thang, 10) : new Date().getMonth() + 1;
      const currentYear = nam ? parseInt(nam, 10) : new Date().getFullYear();

      const workbook = new exceljs.Workbook();
      workbook.creator = 'Vua Dac San';
      workbook.lastModifiedBy = req.user.tenDangnhap;
      workbook.created = new Date();

      // Helper: style header row
      const styleHeader = (sheet, bgColor = 'FF2D6A4F') => {
        const row = sheet.getRow(1);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 22;
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      };

      // Helper: format date label from ISO string
      const formatLabel = (label) => {
        if (!label) return '';
        const d = new Date(label);
        if (isNaN(d)) return label;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      };

      // Currency format string for Excel
      const vndFormat = '#,##0 "₫"';

      // ─── Sheet 1: Doanh thu ───────────────────────────────────────────────
      const sheet1 = workbook.addWorksheet('Doanh thu');
      sheet1.columns = [
        { header: 'Thời gian', key: 'label', width: 20 },
        { header: 'Doanh thu (VNĐ)', key: 'value', width: 25 },
      ];

      let totalRevenue = 0;
      try {
        const revRes = await orderApi.get('/statistics/revenue', { params: { loai, tuNgay, denNgay } });
        const data = revRes.data || [];
        data.forEach(item => {
          const val = parseFloat(item.value) || 0;
          totalRevenue += val;
          sheet1.addRow({ label: formatLabel(item.label), value: val });
        });
      } catch (err) {
        console.warn('Failed to retrieve revenue statistics for Excel:', err.message);
        sheet1.addRow({ label: 'Lỗi khi tải dữ liệu', value: 0 });
      }

      // Format currency column & add totals
      sheet1.getColumn('value').numFmt = vndFormat;
      sheet1.getColumn('value').alignment = { horizontal: 'right' };
      const totalRow1 = sheet1.addRow({ label: 'TỔNG CỘNG', value: totalRevenue });
      totalRow1.font = { bold: true };
      totalRow1.getCell('value').numFmt = vndFormat;
      totalRow1.getCell('value').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      styleHeader(sheet1, 'FF2D6A4F');

      // ─── Sheet 2: Top sản phẩm bán chạy ─────────────────────────────────
      const sheet2 = workbook.addWorksheet('Top san pham');
      sheet2.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã sản phẩm', key: 'masanpham', width: 20 },
        { header: 'Tên sản phẩm', key: 'tensanpham', width: 40 },
        { header: 'Số lượng đã bán', key: 'total_sold', width: 20 },
      ];

      try {
        const topRes = await orderApi.get('/statistics/top-selling', { params: { limit: 10 } });
        const items = topRes.data || [];
        const itemsWithDetail = await Promise.all(items.map(async (item, idx) => {
          try {
            const prodRes = await productApi.get(`/${item.masanpham}`);
            return { stt: idx + 1, masanpham: item.masanpham, tensanpham: prodRes.data.tensanpham, total_sold: parseInt(item.total_sold, 10) };
          } catch {
            return { stt: idx + 1, masanpham: item.masanpham, tensanpham: 'Sản phẩm ' + item.masanpham, total_sold: parseInt(item.total_sold, 10) };
          }
        }));
        itemsWithDetail.forEach(row => sheet2.addRow(row));
      } catch (err) {
        console.warn('Failed to retrieve top selling products for Excel:', err.message);
        sheet2.addRow({ stt: 1, masanpham: 'Lỗi tải dữ liệu', tensanpham: '', total_sold: 0 });
      }

      sheet2.getColumn('total_sold').alignment = { horizontal: 'center' };
      sheet2.getColumn('stt').alignment = { horizontal: 'center' };
      styleHeader(sheet2, 'FFD4A373');

      // ─── Sheet 3: Bảng lương ─────────────────────────────────────────────
      const sheet3 = workbook.addWorksheet(`Bang luong T${currentMonth}-${currentYear}`);
      sheet3.columns = [
        { header: 'STT',            key: 'stt',          width: 6  },
        { header: 'Mã nhân viên',   key: 'manhanvien',   width: 16 },
        { header: 'Họ và tên',      key: 'tennhanvien',  width: 28 },
        { header: 'Vai trò',        key: 'vaitro',       width: 14 },
        { header: 'Kỳ lương',       key: 'kyfluong',     width: 14 },
        { header: 'Lương cơ bản',   key: 'luongcoban',   width: 20 },
        { header: 'Phụ cấp',        key: 'tongphucap',   width: 18 },
        { header: 'Khấu trừ',       key: 'tongkhautru',  width: 18 },
        { header: 'Thực nhận',      key: 'tongluong',    width: 20 },
        { header: 'Trạng thái',     key: 'trangthai',    width: 14 },
        { header: 'Kế toán lập',    key: 'manvketoan',   width: 18 },
        { header: 'Ngày lập',       key: 'ngaylap',      width: 18 },
      ];

      // Fetch payroll & employee names
      const payrollList = await FinanceModel.getPayroll({ thang: currentMonth, nam: currentYear });

      let employeeMap = {};
      try {
        const empRes = await userApi.get('/employees', { params: { limit: 500 } });
        const empList = empRes.data?.data || empRes.data || [];
        empList.forEach(emp => {
          employeeMap[emp.manhanvien] = { tennhanvien: emp.hoten, vaitro: emp.vaitro };
        });
      } catch (e) {
        console.warn('Could not fetch employee names for Excel:', e.message);
      }

      const ROLE_LABEL = { QUAN_LY: 'Quản lý', KE_TOAN: 'Kế toán', BAN_HANG: 'Bán hàng', KHO: 'Thủ kho', CSKH: 'CSKH' };

      let totalLuong = 0, totalPhuCap = 0, totalKhauTru = 0, totalThucNhan = 0;

      payrollList.forEach((payroll, idx) => {
        const luong    = parseFloat(payroll.luongcoban)  || 0;
        const phuCap   = parseFloat(payroll.tongphucap)  || 0;
        const khauTru  = parseFloat(payroll.tongkhautru) || 0;
        const thucNhan = parseFloat(payroll.tongluong)   || 0;
        totalLuong    += luong;
        totalPhuCap   += phuCap;
        totalKhauTru  += khauTru;
        totalThucNhan += thucNhan;

        const emp = employeeMap[payroll.manhanvien] || {};
        const ngayLap = payroll.ngaylap ? formatLabel(payroll.ngaylap) : '';

        sheet3.addRow({
          stt:         idx + 1,
          manhanvien:  payroll.manhanvien,
          tennhanvien: emp.tennhanvien || payroll.manhanvien,
          vaitro:      ROLE_LABEL[emp.vaitro] || emp.vaitro || '',
          kyfluong:    `T${payroll.thang}/${payroll.nam}`,
          luongcoban:  luong,
          tongphucap:  phuCap,
          tongkhautru: khauTru,
          tongluong:   thucNhan,
          trangthai:   payroll.trangthai,
          manvketoan:  payroll.manvketoan,
          ngaylap:     ngayLap,
        });
      });

      // Format currency columns
      ['luongcoban', 'tongphucap', 'tongkhautru', 'tongluong'].forEach(col => {
        sheet3.getColumn(col).numFmt = vndFormat;
        sheet3.getColumn(col).alignment = { horizontal: 'right' };
      });
      sheet3.getColumn('stt').alignment = { horizontal: 'center' };
      sheet3.getColumn('trangthai').alignment = { horizontal: 'center' };
      sheet3.getColumn('kyfluong').alignment = { horizontal: 'center' };

      // Color "Đã chốt" rows green, "Chưa chốt" yellow
      sheet3.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const status = row.getCell('trangthai').value;
        const color = status === 'Đã chốt' ? 'FFE8F5E9' : 'FFFFF8E1';
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
          cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
        });
      });

      // Totals row
      const totalsRow = sheet3.addRow({
        stt: '', manhanvien: '', tennhanvien: 'TỔNG CỘNG', vaitro: '', kyfluong: '',
        luongcoban: totalLuong, tongphucap: totalPhuCap, tongkhautru: totalKhauTru,
        tongluong: totalThucNhan, trangthai: '', manvketoan: '', ngaylap: ''
      });
      totalsRow.font = { bold: true, size: 11 };
      totalsRow.getCell('tennhanvien').alignment = { horizontal: 'right' };
      ['luongcoban', 'tongphucap', 'tongkhautru', 'tongluong'].forEach(col => {
        totalsRow.getCell(col).numFmt = vndFormat;
        totalsRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
      });

      styleHeader(sheet3, 'FF1B4332');

      // ─── Add title above payroll table ───────────────────────────────────
      sheet3.insertRow(1, []);
      sheet3.insertRow(1, [`BẢNG LƯƠNG NHÂN VIÊN — THÁNG ${currentMonth}/${currentYear}`]);
      sheet3.mergeCells(1, 1, 1, 12);
      const titleCell = sheet3.getRow(1).getCell(1);
      titleCell.font = { bold: true, size: 14, color: { argb: 'FF1B4332' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet3.getRow(1).height = 30;
      sheet3.getRow(2).height = 4; // empty spacer

      // ─── Finalize ─────────────────────────────────────────────────────────
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="BaoCaoTaiChinh_T${currentMonth}_${currentYear}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();

    } catch (err) {
      console.error('Error exporting Excel report:', err);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel' });
      }
    }
  }
};
