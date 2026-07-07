import { OrderModel } from '../models/order.model.js';
import { CustomerModel } from '../models/customer.model.js';
import { productApi } from '../config/axios.js';
import pool from '../config/db.js';
import PDFDocument from 'pdfkit';
import { publishOrderCompleted } from '../config/rabbitmq.js';

async function generateOrderCode() {
  const year = new Date().getFullYear();
  const prefix = `HD${year}`;
  const result = await pool.query(
    'SELECT maHoadon FROM HOA_DON WHERE maHoadon LIKE $1 ORDER BY maHoadon DESC LIMIT 1',
    [`${prefix}%`]
  );
  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }
  const lastCode = result.rows[0].mahoadon;
  const lastNum = parseInt(lastCode.replace(prefix, ''), 10);
  const nextNum = lastNum + 1;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

export const OrderController = {
  // GET /orders
  async getOrders(req, res) {
    try {
      const { page, limit, trangThaiDH, search, tuNgay, denNgay } = req.query;
      const result = await OrderModel.getOrders({
        page,
        limit,
        trangThaiDH,
        search,
        tuNgay,
        denNgay,
        requestUser: req.user
      });
      return res.json(result);
    } catch (err) {
      console.error('Error getting orders:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách đơn hàng' });
    }
  },

  // POST /orders
  async createOrder(req, res) {
    console.log('Order payload:', req.body);
    const { maKhachHang, maDiaChi, sanPham, maKhuyenMai, pThucThanhToan } = req.body;
    
    if (!maKhachHang || !maDiaChi || !sanPham || !Array.isArray(sanPham) || sanPham.length === 0 || !pThucThanhToan) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc để tạo đơn hàng' });
    }

    // Security Check: Customer can only buy for themselves
    const roles = req.user.cacQuyen || [req.user.vaiTro];
    if (roles.includes('KHACH_HANG') && !roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
      const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
      if (!customerRecord || customerRecord.makhachhang !== maKhachHang) {
        return res.status(403).json({ message: 'Bạn không có quyền tạo đơn hàng cho tài khoản khác' });
      }
    }

    // 1. Verify Customer
    const customer = await CustomerModel.findById(maKhachHang);
    if (!customer) {
      return res.status(404).json({ message: 'Khách hàng không tồn tại' });
    }
    if (customer.trangthai === 0) {
      return res.status(400).json({ message: 'Tài khoản khách hàng đã bị khóa hoặc chưa kích hoạt' });
    }

    // 2. Verify Address
    const address = await CustomerModel.getAddressById(maDiaChi);
    if (!address || address.makhachhang !== maKhachHang) {
      return res.status(400).json({ message: 'Địa chỉ giao hàng không hợp lệ' });
    }

    // 3. Check stock & get prices from product-service
    const orderItems = [];
    let tongTienSP = 0;

    try {
      for (const item of sanPham) {
        if (!item.maSanpham || !item.soLuong || item.soLuong <= 0) {
          return res.status(400).json({ message: 'Thông tin sản phẩm hoặc số lượng không hợp lệ' });
        }

        // Call product-service HTTP endpoint
        const response = await productApi.get(`/${item.maSanpham}`);
        const product = response.data;

        if (!product) {
          return res.status(404).json({ message: `Sản phẩm ${item.maSanpham} không tồn tại` });
        }

        if (product.soluongton < item.soLuong) {
          return res.status(400).json({ 
            message: `Sản phẩm [${product.tensanpham}] không đủ hàng trong kho (Còn lại: ${product.soluongton}, yêu cầu: ${item.soLuong})` 
          });
        }

        const itemTotal = item.soLuong * parseFloat(product.giadon);
        tongTienSP += itemTotal;

        orderItems.push({
          maSanpham: item.maSanpham,
          soLuong: item.soLuong,
          giaBan: parseFloat(product.giadon),
          tenSanpham: product.tensanpham
        });
      }
    } catch (err) {
      console.error('Error verifying products from product-service:', err.message);
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: err.response.data.message || 'Không tìm thấy sản phẩm trên hệ thống' });
      }
      return res.status(500).json({ message: 'Lỗi khi kết nối với dịch vụ sản phẩm' });
    }

    // 4. Handle Promotion (Khuyến mãi)
    let discountValue = 0;
    let phiVanChuyen = 30000; // Default shipping fee

    if (maKhuyenMai) {
      const promo = await OrderModel.getPromo(maKhuyenMai);
      if (!promo) {
        return res.status(400).json({ message: 'Mã khuyến mãi không tồn tại' });
      }

      // Check conditions
      const now = new Date();
      if (new Date(promo.ngaybatdau) > now || new Date(promo.ngayketthuc) < now) {
        return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng' });
      }

      if (promo.dasd >= promo.soluongtoida) {
        return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
      }

      if (tongTienSP < parseFloat(promo.dontoithieu)) {
        return res.status(400).json({ 
          message: `Đơn hàng không đạt giá trị tối thiểu để áp dụng mã này (Yêu cầu: ${parseFloat(promo.dontoithieu)} VND)` 
        });
      }

      // Calculate discount
      if (promo.loaima === 'PHAN_TRAM') {
        discountValue = tongTienSP * (parseFloat(promo.giatrigiam) / 100);
      } else if (promo.loaima === 'TRU_TIEN') {
        discountValue = parseFloat(promo.giatrigiam);
      } else if (promo.loaima === 'FREESHIP') {
        discountValue = phiVanChuyen;
      }

      // Discount cannot exceed subtotal
      if (discountValue > tongTienSP) {
        discountValue = tongTienSP;
      }
    }

    const tongTienTT = Math.max(0, tongTienSP + phiVanChuyen - discountValue);
    const maHoadon = await generateOrderCode();

    // 5. Database transaction for Order creation and stock deduction
    const client = await OrderModel.getTransactionClient();
    const updatedStockProducts = [];

    try {
      await client.query('BEGIN');

      // Create Order local records
      const newOrder = await OrderModel.createOrder({
        maHoadon,
        maKhachHang,
        maNVBanHang: roles.some(r => ['BAN_HANG', 'QUAN_LY'].includes(r)) ? req.user.tenDangnhap : null,
        maDiaChi,
        pThucThanhToan,
        maKhuyenMai,
        tongTienSP,
        phiVanChuyen,
        tongTienTT,
        items: orderItems
      }, client);

      // Increment promo usage
      if (maKhuyenMai) {
        await OrderModel.incrementPromoUsage(maKhuyenMai, client);
      }

      // Call product-service HTTP REST API to reserve stock atomically
      try {
        await productApi.post('/reserve-stock', { items: orderItems });
      } catch (stockErr) {
        console.error('Failed to reserve stock:', stockErr.message);
        const errorMsg = stockErr.response && stockErr.response.data && stockErr.response.data.message 
          ? stockErr.response.data.message 
          : 'Lỗi trừ tồn kho sản phẩm';
        throw new Error(errorMsg);
      }

      // Commit local db
      await client.query('COMMIT');
      return res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });

    } catch (err) {
      console.error('Full DB Error:', err);
      await client.query('ROLLBACK');
      console.warn('Order creation failed. Rolled back local transaction.');

      return res.status(400).json({ message: err.message || 'Lỗi máy chủ khi tạo đơn hàng' });
    } finally {
      client.release();
    }
  },

  // GET /orders/:id
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Security check: Customer can only view their own order
      const roles = req.user.cacQuyen || [req.user.vaiTro];
      if (roles.includes('KHACH_HANG') && !roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
        const customer = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customer || customer.makhachhang !== order.makhachhang) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng của tài khoản khác' });
        }
      }

      const items = await OrderModel.getOrderItems(id);
      const history = await OrderModel.getOrderHistory(id);

      // Fetch latest names from product service if possible (non-blocking)
      const itemsWithDetail = await Promise.all(items.map(async (item) => {
        try {
          const prodRes = await productApi.get(`/${item.masanpham}`);
          return { ...item, tenSanpham: prodRes.data.tensanpham };
        } catch (e) {
          return { ...item, tenSanpham: 'Sản phẩm ' + item.masanpham };
        }
      }));

      return res.json({ ...order, items: itemsWithDetail, history });
    } catch (err) {
      console.error('Error getting order details:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PATCH /orders/:id/status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThaiMoi, ghiChu } = req.body;

      if (!trangThaiMoi) {
        return res.status(400).json({ message: 'Trạng thái mới là bắt buộc' });
      }

      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      const currentStatus = order.trangthaidh;
      if (currentStatus === 'Giao thành công' || currentStatus === 'Đã hủy') {
        return res.status(400).json({ message: 'Không thể cập nhật trạng thái của đơn hàng đã hoàn thành hoặc đã hủy' });
      }

      // Status Flow check
      const statusFlow = {
        'Chờ thanh toán': ['Đã xác nhận', 'Đã hủy'],
        'Chờ xác nhận': ['Đã xác nhận', 'Đã hủy'],
        'Đã xác nhận': ['Bàn giao vận chuyển', 'Đã hủy'],
        'Bàn giao vận chuyển': ['Đang giao'],
        'Đang giao': ['Giao thành công', 'Giao thất bại'],
        'Giao thất bại': ['Đang giao', 'Đã hủy']
      };

      const allowedNext = statusFlow[currentStatus] || [];
      if (!allowedNext.includes(trangThaiMoi)) {
        return res.status(400).json({ 
          message: `Luồng chuyển trạng thái không hợp lệ. Trạng thái hiện tại: [${currentStatus}] không thể chuyển trực tiếp sang [${trangThaiMoi}].` 
        });
      }

      const client = await OrderModel.getTransactionClient();
      try {
        await client.query('BEGIN');

        const updated = await OrderModel.updateOrderStatus(id, trangThaiMoi, client);
        await OrderModel.addOrderHistory(id, trangThaiMoi, ghiChu || `Cập nhật trạng thái sang ${trangThaiMoi}`, client);

        await client.query('COMMIT');
        
        // Publish event to RabbitMQ if order is successfully completed
        if (trangThaiMoi === 'Giao thành công') {
          publishOrderCompleted(updated.mahoadon, parseFloat(updated.tongtientt)).catch((err) => {
            console.error('Failed to publish order.completed event:', err.message);
          });
        }

        return res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order: updated });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // DELETE /orders/:id/cancel
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { lyDoHuy } = req.body;

      if (!lyDoHuy) {
        return res.status(400).json({ message: 'Lý do hủy đơn hàng là bắt buộc' });
      }

      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Security Check: Customer can only cancel their own order
      const roles = req.user.cacQuyen || [req.user.vaiTro];
      if (roles.includes('KHACH_HANG') && !roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
        const customer = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customer || customer.makhachhang !== order.makhachhang) {
          return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng của tài khoản khác' });
        }
        if (order.trangthaidh !== 'Chờ xác nhận' && order.trangthaidh !== 'Chờ thanh toán') {
          return res.status(400).json({ message: 'Khách hàng chỉ được tự hủy đơn hàng khi trạng thái là Chờ xác nhận hoặc Chờ thanh toán' });
        }
      }

      const currentStatus = order.trangthaidh;
      if (currentStatus === 'Bàn giao vận chuyển' || currentStatus === 'Đang giao' || currentStatus === 'Giao thành công') {
        return res.status(400).json({ message: 'Không thể hủy đơn hàng sau khi đã bàn giao vận chuyển' });
      }
      if (currentStatus === 'Đã hủy') {
        return res.status(400).json({ message: 'Đơn hàng này đã được hủy trước đó' });
      }

      const items = await OrderModel.getOrderItems(id);
      const client = await OrderModel.getTransactionClient();

      try {
        await client.query('BEGIN');

        // Update status to Cancelled
        const query = 'UPDATE HOA_DON SET trangThaiDH = $1, lyDoHuy = $2, ngayCapNhat = NOW() WHERE maHoadon = $3 RETURNING *';
        const orderRes = await client.query(query, ['Đã hủy', lyDoHuy, id]);
        const updatedOrder = orderRes.rows[0];

        // Add history record
        await OrderModel.addOrderHistory(id, 'Đã hủy', `Hủy đơn hàng. Lý do: ${lyDoHuy}`, client);

        // Revert promo usage
        if (order.makhuyenmai) {
          await OrderModel.decrementPromoUsage(order.makhuyenmai, client);
        }

        // Call product-service to add back stock
        for (const item of items) {
          try {
            await productApi.patch(`/${item.masanpham}/stock`, {
              soLuongThayDoi: item.soluong
            });
          } catch (stockErr) {
            console.error(`Failed to restore stock for product ${item.masanpham}:`, stockErr.message);
            throw new Error(`Lỗi hoàn trả tồn kho cho sản phẩm mã ${item.masanpham}`);
          }
        }

        await client.query('COMMIT');
        return res.json({ message: 'Hủy đơn hàng thành công và đã hoàn lại tồn kho sản phẩm', order: updatedOrder });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error cancelling order:', err);
      return res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
    }
  },

  // GET /orders/:id/invoice (PDF Generation)
  async getInvoice(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Security check
      const roles = req.user.cacQuyen || [req.user.vaiTro];
      if (roles.includes('KHACH_HANG') && !roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
        const customer = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customer || customer.makhachhang !== order.makhachhang) {
          return res.status(403).json({ message: 'Bạn không có quyền tải hóa đơn của tài khoản khác' });
        }
      }

      const items = await OrderModel.getOrderItems(id);
      
      // Fetch latest names from product service if possible
      const itemsWithDetail = await Promise.all(items.map(async (item) => {
        try {
          const prodRes = await productApi.get(`/${item.masanpham}`);
          return { ...item, tenSanpham: prodRes.data.tensanpham };
        } catch (e) {
          return { ...item, tenSanpham: 'San pham ' + item.masanpham };
        }
      }));

      // Create PDF using PDFKit
      const doc = new PDFDocument({ margin: 50 });

      // Set headers for response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice_${id}.pdf"`);

      // Pipe to response
      doc.pipe(res);

      // Transliterate accents for standard Helvetica compatibility
      const safeText = (text) => {
        if (!text) return '';
        return text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'));
      };

      // Header Title
      doc.font('Helvetica-Bold').fontSize(20).text('HOA DON BAN HANG - VUA DAC SAN', { align: 'center' });
      doc.moveDown();

      // Horizontal Line
      doc.moveTo(50, 100).lineTo(550, 100).stroke();
      doc.moveDown(2);

      // Invoice Details
      doc.font('Helvetica-Bold').fontSize(12).text('Thong tin hoa don:');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Ma hoa don: ${order.mahoadon}`);
      doc.text(`Ngay lap: ${new Date(order.ngaytaohoadon).toLocaleString()}`);
      doc.text(`Phuong thuc thanh toan: ${order.pthucthanhtoan}`);
      doc.text(`Trang thai thanh toan: ${safeText(order.trangthaitt)}`);
      doc.text(`Trang thai giao hang: ${safeText(order.trangthaidh)}`);
      doc.moveDown();

      // Customer Details
      doc.font('Helvetica-Bold').fontSize(12).text('Thong tin khach hang:');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Khach hang: ${safeText(order.tenkhachhang)}`);
      doc.text(`So dien thoai: ${order.sdtkhachhang}`);
      doc.text(`Email: ${order.emailkhachhang || 'N/A'}`);
      doc.moveDown();

      // Table Header for Items
      doc.font('Helvetica-Bold').fontSize(12).text('Danh sach san pham mua:');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Ten san pham', 50, tableTop);
      doc.text('Ma SP', 250, tableTop);
      doc.text('So luong', 350, tableTop, { width: 50, align: 'right' });
      doc.text('Don gia', 420, tableTop, { width: 50, align: 'right' });
      doc.text('Thanh tien', 490, tableTop, { width: 60, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let currentY = tableTop + 25;
      itemsWithDetail.forEach((item) => {
        const lineTotal = item.soluong * parseFloat(item.giaban);
        doc.font('Helvetica').text(safeText(item.tenSanpham), 50, currentY, { width: 190, lineBreak: false });
        doc.text(item.masanpham, 250, currentY);
        doc.text(item.soluong.toString(), 350, currentY, { width: 50, align: 'right' });
        doc.text(parseFloat(item.giaban).toLocaleString() + ' VND', 420, currentY, { width: 50, align: 'right' });
        doc.text(lineTotal.toLocaleString() + ' VND', 490, currentY, { width: 60, align: 'right' });
        currentY += 20;
      });

      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 15;

      // Pricing details
      doc.font('Helvetica-Bold');
      doc.text('Tong tien san pham:', 350, currentY);
      doc.font('Helvetica').text(parseFloat(order.tongtiensp).toLocaleString() + ' VND', 480, currentY, { width: 70, align: 'right' });
      currentY += 15;

      doc.font('Helvetica-Bold').text('Phi van chuyen:', 350, currentY);
      doc.font('Helvetica').text(parseFloat(order.phivanchuyen).toLocaleString() + ' VND', 480, currentY, { width: 70, align: 'right' });
      currentY += 15;

      if (order.makhuyenmai) {
        doc.font('Helvetica-Bold').text(`Giam gia (${order.makhuyenmai}):`, 350, currentY);
        const discountValue = parseFloat(order.tongtiensp) + parseFloat(order.phivanchuyen) - parseFloat(order.tongtientt);
        doc.font('Helvetica').text('-' + discountValue.toLocaleString() + ' VND', 480, currentY, { width: 70, align: 'right' });
        currentY += 15;
      }

      doc.moveTo(350, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica-Bold').fontSize(12).text('TONG CONG:', 350, currentY);
      doc.fontSize(12).text(parseFloat(order.tongtientt).toLocaleString() + ' VND', 480, currentY, { width: 70, align: 'right' });

      // Footer notice
      doc.fontSize(8).font('Helvetica-Oblique').text('Cam on quy khach da mua hang tai Vua Dac San!', 50, 700, { align: 'center' });

      // End PDF Document
      doc.end();

    } catch (err) {
      console.error('Error generating PDF invoice:', err);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Lỗi máy chủ khi tạo hóa đơn PDF' });
      }
    }
  },

  // GET /revenue (Internal)
  async getShiftRevenue(req, res) {
    try {
      const { ngay, ca, maNV } = req.query;
      if (!ngay || !ca || !maNV) {
        return res.status(400).json({ message: 'Thiếu thông tin truy vấn (ngay, ca, maNV)' });
      }
      const total = await OrderModel.getShiftRevenue({ ngay, ca, maNV });
      return res.json({ doanhThuHeThong: total });
    } catch (err) {
      console.error('Error getting shift revenue:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /statistics/revenue (Internal)
  async getRevenueStatistics(req, res) {
    try {
      const { loai, tuNgay, denNgay } = req.query;
      const stats = await OrderModel.getRevenueStatistics({ loai, tuNgay, denNgay });
      return res.json(stats);
    } catch (err) {
      console.error('Error getting revenue statistics:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /statistics/top-selling (Internal)
  async getTopSellingProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit || '10', 10);
      const result = await OrderModel.getTopSellingProducts(limit);
      return res.json(result);
    } catch (err) {
      console.error('Error getting top selling products:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /:id/verify-internal (Internal)
  async verifyOrderInternal(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      return res.json(order);
    } catch (err) {
      console.error('Error in internal order verification:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
