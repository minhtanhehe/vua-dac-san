import pool from '../config/db.js';

export const OrderModel = {
  async getOrders({ page = 1, limit = 10, trangThaiDH, search, tuNgay, denNgay, requestUser }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT h.*, k.hoTen as tenKhachHang, k.sdt as sdtKhachHang
      FROM HOA_DON h
      JOIN KHACH_HANG k ON h.maKhachHang = k.maKhachHang
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) 
      FROM HOA_DON h
      JOIN KHACH_HANG k ON h.maKhachHang = k.maKhachHang
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role/user
    if (requestUser) {
      const roles = requestUser.cacQuyen || [requestUser.vaiTro];
      if (roles.includes('KHACH_HANG')) {
        // Find customer record for this login
        query += ` AND k.tenDangnhap = $${paramIndex}`;
        countQuery += ` AND k.tenDangnhap = $${paramIndex}`;
        params.push(requestUser.tenDangnhap);
        paramIndex++;
      } else if (roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
        // Sales only see orders they created
        query += ` AND h.maNVBanHang = $${paramIndex}`;
        countQuery += ` AND h.maNVBanHang = $${paramIndex}`;
        params.push(requestUser.tenDangnhap);
        paramIndex++;
      }
    }

    if (trangThaiDH) {
      query += ` AND h.trangThaiDH = $${paramIndex}`;
      countQuery += ` AND h.trangThaiDH = $${paramIndex}`;
      params.push(trangThaiDH);
      paramIndex++;
    }

    if (search) {
      query += ` AND (h.maHoadon ILIKE $${paramIndex} OR k.hoTen ILIKE $${paramIndex} OR k.sdt ILIKE $${paramIndex})`;
      countQuery += ` AND (h.maHoadon ILIKE $${paramIndex} OR k.hoTen ILIKE $${paramIndex} OR k.sdt ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tuNgay) {
      query += ` AND h.ngayTaoHoadon >= $${paramIndex}`;
      countQuery += ` AND h.ngayTaoHoadon >= $${paramIndex}`;
      params.push(new Date(tuNgay));
      paramIndex++;
    }

    if (denNgay) {
      query += ` AND h.ngayTaoHoadon <= $${paramIndex}`;
      countQuery += ` AND h.ngayTaoHoadon <= $${paramIndex}`;
      params.push(new Date(denNgay));
      paramIndex++;
    }

    query += ` ORDER BY h.ngayTaoHoadon DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const countParams = [...params];
    params.push(limit, offset);

    const countRes = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(query, params);

    return {
      data: dataRes.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page, 10)
    };
  },

  async getOrderById(id) {
    const query = `
      SELECT h.*, k.hoTen as tenKhachHang, k.sdt as sdtKhachHang, k.email as emailKhachHang
      FROM HOA_DON h
      JOIN KHACH_HANG k ON h.maKhachHang = k.maKhachHang
      WHERE h.maHoadon = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async getOrderItems(orderId) {
    const query = `SELECT * FROM CHI_TIET_HOA_DON WHERE maHoadon = $1`;
    const result = await pool.query(query, [orderId]);
    return result.rows;
  },

  async getPromo(code) {
    const query = 'SELECT * FROM KHUYEN_MAI WHERE maKhuyenMai = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  },

  async incrementPromoUsage(code, client) {
    const query = 'UPDATE KHUYEN_MAI SET daSD = daSD + 1 WHERE maKhuyenMai = $1 RETURNING *';
    const executeQuery = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await executeQuery(query, [code]);
    return result.rows[0];
  },

  async decrementPromoUsage(code, client) {
    const query = 'UPDATE KHUYEN_MAI SET daSD = GREATEST(0, daSD - 1) WHERE maKhuyenMai = $1 RETURNING *';
    const executeQuery = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await executeQuery(query, [code]);
    return result.rows[0];
  },

  async getTransactionClient() {
    return await pool.connect();
  },

  async createOrder({ maHoadon, maKhachHang, maNVBanHang, maDiaChi, pThucThanhToan, maKhuyenMai, tongTienSP, phiVanChuyen, tongTienTT, items }, client) {
    const orderQuery = `
      INSERT INTO HOA_DON (
        maHoadon, maKhachHang, maNVBanHang, maDiaChi, pThucThanhToan, 
        maKhuyenMai, tongTienSP, phiVanChuyen, tongTienTT, trangThaiTT, trangThaiDH
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const isCod = pThucThanhToan === 'COD';
    const initialPaymentStatus = 'Chưa thanh toán';
    const initialOrderStatus = isCod ? 'Chờ xác nhận' : 'Chờ thanh toán';

    const dbParams = [
      maHoadon,
      maKhachHang,
      maNVBanHang || null,
      maDiaChi,
      pThucThanhToan,
      maKhuyenMai || null,
      tongTienSP,
      phiVanChuyen,
      tongTienTT,
      initialPaymentStatus,
      initialOrderStatus
    ];
    console.log('DB Params for HOA_DON:', dbParams);

    const orderRes = await client.query(orderQuery, dbParams);
    const newOrder = orderRes.rows[0];

    // Insert items
    const itemQuery = `
      INSERT INTO CHI_TIET_HOA_DON (maHoadon, maSanpham, soLuong, giaBan)
      VALUES ($1, $2, $3, $4)
    `;
    for (const item of items) {
      await client.query(itemQuery, [maHoadon, item.maSanpham, item.soLuong, item.giaBan]);
    }

    // Insert history
    const historyQuery = `
      INSERT INTO LICH_SU_DON_HANG (maHoadon, trangThaiCapNhat, ghiChu)
      VALUES ($1, $2, $3)
    `;
    await client.query(historyQuery, [maHoadon, 'Chờ xác nhận', 'Đơn hàng được tạo thành công']);

    return newOrder;
  },

  async updateOrderStatus(id, trangThaiMoi, client) {
    const executeQuery = client ? client.query.bind(client) : pool.query.bind(pool);
    const query = `
      UPDATE HOA_DON 
      SET trangThaiDH = $1, 
          trangThaiTT = CASE WHEN $1::VARCHAR = 'Giao thành công' THEN 'Đã thanh toán' ELSE trangThaiTT END,
          ngayCapNhat = NOW() 
      WHERE maHoadon = $2 
      RETURNING *
    `;
    const result = await executeQuery(query, [trangThaiMoi, id]);
    return result.rows[0];
  },

  async addOrderHistory(id, trangThaiCapNhat, ghiChu, client) {
    const executeQuery = client ? client.query.bind(client) : pool.query.bind(pool);
    const query = `
      INSERT INTO LICH_SU_DON_HANG (maHoadon, trangThaiCapNhat, ghiChu)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await executeQuery(query, [id, trangThaiCapNhat, ghiChu]);
    return result.rows[0];
  },

  async getOrderHistory(orderId) {
    const query = `SELECT * FROM LICH_SU_DON_HANG WHERE maHoadon = $1 ORDER BY thoiGian ASC`;
    const result = await pool.query(query, [orderId]);
    return result.rows;
  },

  async getShiftRevenue({ ngay, ca, maNV }) {
    let startStr, endStr;
    const date = new Date(ngay);
    const dateStr = date.toISOString().split('T')[0];

    if (ca === 'SANG') {
      startStr = `${dateStr} 06:00:00`;
      endStr = `${dateStr} 14:00:00`;
    } else if (ca === 'CHIEU') {
      startStr = `${dateStr} 14:00:00`;
      endStr = `${dateStr} 22:00:00`;
    } else { // TOI
      startStr = `${dateStr} 22:00:00`;
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      endStr = `${nextDayStr} 06:00:00`;
    }

    const query = `
      SELECT COALESCE(SUM(tongTienTT), 0) as total
      FROM HOA_DON
      WHERE maNVBanHang = $1
        AND ngayTaoHoadon >= $2
        AND ngayTaoHoadon < $3
        AND trangThaiDH != 'Đã hủy'
    `;
    const result = await pool.query(query, [maNV, startStr, endStr]);
    return parseFloat(result.rows[0].total);
  },

  async getRevenueStatistics({ loai, tuNgay, denNgay }) {
    let groupExpr;
    if (loai === 'TUAN') {
      groupExpr = "DATE_TRUNC('week', ngayTaoHoadon)";
    } else if (loai === 'THANG') {
      groupExpr = "DATE_TRUNC('month', ngayTaoHoadon)";
    } else if (loai === 'NAM') {
      groupExpr = "DATE_TRUNC('year', ngayTaoHoadon)";
    } else {
      groupExpr = "DATE(ngayTaoHoadon)";
    }

    let query = `
      SELECT ${groupExpr} as label, COALESCE(SUM(tongTienTT), 0) as value
      FROM HOA_DON
      WHERE trangThaiDH != 'Đã hủy'
    `;
    const params = [];
    let pIndex = 1;

    if (tuNgay) {
      query += ` AND ngayTaoHoadon >= $${pIndex}`;
      params.push(new Date(tuNgay));
      pIndex++;
    }

    if (denNgay) {
      query += ` AND ngayTaoHoadon <= $${pIndex}`;
      params.push(new Date(denNgay));
      pIndex++;
    }

    query += ` GROUP BY label ORDER BY label ASC`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getTopSellingProducts(limit = 10) {
    const query = `
      SELECT maSanpham, SUM(soLuong) as total_sold
      FROM CHI_TIET_HOA_DON
      GROUP BY maSanpham
      ORDER BY total_sold DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
};
