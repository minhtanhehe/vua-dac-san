import exceljs from 'exceljs';
import { FinanceModel } from '../models/finance.model.js';
import { orderApi, productApi, warehouseApi } from '../config/axios.js';

export const FinanceController = {
  // --- PAYROLL ---
  async getPayroll(req, res) {
    try {
      const result = await FinanceModel.getPayroll(req.query);
      return res.json(result);
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

      const workbook = new exceljs.Workbook();
      workbook.creator = 'Vua Dac San';
      workbook.lastModifiedBy = req.user.tenDangnhap;
      workbook.created = new Date();

      // --- Sheet 1: Doanh thu theo ngày ---
      const sheet1 = workbook.addWorksheet('Doanh thu');
      sheet1.columns = [
        { header: 'Thời gian', key: 'label', width: 25 },
        { header: 'Doanh thu (VND)', key: 'value', width: 20 }
      ];

      // Fetch statistics from order-service
      try {
        const revRes = await orderApi.get('/statistics/revenue', {
          params: { loai, tuNgay, denNgay }
        });
        const data = revRes.data || [];
        data.forEach(item => {
          sheet1.addRow({
            label: item.label,
            value: parseFloat(item.value) || 0
          });
        });
      } catch (err) {
        console.warn('Failed to retrieve revenue statistics for Excel:', err.message);
        sheet1.addRow({ label: 'Lỗi khi tải dữ liệu từ order-service', value: 0 });
      }

      // --- Sheet 2: Top sản phẩm bán chạy ---
      const sheet2 = workbook.addWorksheet('Top san pham');
      sheet2.columns = [
        { header: 'Mã sản phẩm', key: 'masanpham', width: 20 },
        { header: 'Tên sản phẩm', key: 'tensanpham', width: 35 },
        { header: 'Số lượng bán ra', key: 'total_sold', width: 20 }
      ];

      // Fetch top selling from order-service
      try {
        const topRes = await orderApi.get('/statistics/top-selling', { params: { limit: 10 } });
        const items = topRes.data || [];
        
        const itemsWithDetail = await Promise.all(items.map(async (item) => {
          try {
            const prodRes = await productApi.get(`/${item.masanpham}`);
            return {
              masanpham: item.masanpham,
              tensanpham: prodRes.data.tensanpham,
              total_sold: parseInt(item.total_sold, 10)
            };
          } catch (e) {
            return {
              masanpham: item.masanpham,
              tensanpham: 'Sản phẩm ' + item.masanpham,
              total_sold: parseInt(item.total_sold, 10)
            };
          }
        }));

        itemsWithDetail.forEach(row => {
          sheet2.addRow(row);
        });
      } catch (err) {
        console.warn('Failed to retrieve top selling products for Excel:', err.message);
        sheet2.addRow({ masanpham: 'Lỗi tải dữ liệu', tensanpham: '', total_sold: 0 });
      }

      // --- Sheet 3: Bảng lương tháng ---
      const sheet3 = workbook.addWorksheet('Bang luong');
      sheet3.columns = [
        { header: 'Mã nhân viên', key: 'manhanvien', width: 20 },
        { header: 'Tháng', key: 'thang', width: 10 },
        { header: 'Năm', key: 'nam', width: 10 },
        { header: 'Lương cơ bản', key: 'luongcoban', width: 18 },
        { header: 'Phụ cấp', key: 'tongphucap', width: 15 },
        { header: 'Khấu trừ', key: 'tongkhautru', width: 15 },
        { header: 'Tổng lĩnh', key: 'tongluong', width: 18 },
        { header: 'Trạng thái', key: 'trangthai', width: 15 },
        { header: 'Kế toán lập', key: 'manvketoan', width: 20 }
      ];

      // Fetch payroll from local DB
      const currentMonth = thang ? parseInt(thang, 10) : new Date().getMonth() + 1;
      const currentYear = nam ? parseInt(nam, 10) : new Date().getFullYear();

      const payrollList = await FinanceModel.getPayroll({ thang: currentMonth, nam: currentYear });
      payrollList.forEach(payroll => {
        sheet3.addRow({
          manhanvien: payroll.manhanvien,
          thang: payroll.thang,
          nam: payroll.nam,
          luongcoban: parseFloat(payroll.luongcoban),
          tongphucap: parseFloat(payroll.tongphucap),
          tongkhautru: parseFloat(payroll.tongkhautru),
          tongluong: parseFloat(payroll.tongluong),
          trangthai: payroll.trangthai,
          manvketoan: payroll.manvketoan
        });
      });

      // Format sheets
      [sheet1, sheet2, sheet3].forEach(sheet => {
        sheet.getRow(1).font = { bold: true };
      });

      // Return buffer
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Finance_Report_${currentMonth}_${currentYear}.xlsx"`);

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
