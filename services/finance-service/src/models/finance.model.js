import pool from '../config/db.js';

export const FinanceModel = {
  // --- PAYROLL (BANG_LUONG) ---
  async getPayroll({ thang, nam, maNhanVien }) {
    let query = `SELECT * FROM BANG_LUONG WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (thang) {
      query += ` AND thang = $${paramIndex}`;
      params.push(parseInt(thang, 10));
      paramIndex++;
    }
    if (nam) {
      query += ` AND nam = $${paramIndex}`;
      params.push(parseInt(nam, 10));
      paramIndex++;
    }
    if (maNhanVien) {
      query += ` AND maNhanVien = $${paramIndex}`;
      params.push(maNhanVien);
      paramIndex++;
    }

    query += ` ORDER BY nam DESC, thang DESC, maNhanVien ASC`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async createPayroll({ thang, nam, luongCoBan, tongPhuCap = 0, tongKhauTru = 0, maNhanVien, maNVKeToan }) {
    const query = `
      INSERT INTO BANG_LUONG (thang, nam, luongCoBan, tongPhuCap, tongKhauTru, maNhanVien, maNVKeToan, trangThai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Chưa chốt')
      RETURNING *
    `;
    const result = await pool.query(query, [
      parseInt(thang, 10),
      parseInt(nam, 10),
      luongCoBan,
      tongPhuCap,
      tongKhauTru,
      maNhanVien,
      maNVKeToan
    ]);
    return result.rows[0];
  },

  async confirmPayroll(maBangLuong) {
    const query = `
      UPDATE BANG_LUONG
      SET trangThai = 'Đã chốt'
      WHERE maBangLuong = $1
      RETURNING *
    `;
    const result = await pool.query(query, [maBangLuong]);
    return result.rows[0];
  },

  async getPayrollById(maBangLuong) {
    const result = await pool.query('SELECT * FROM BANG_LUONG WHERE maBangLuong = $1', [maBangLuong]);
    return result.rows[0];
  },

  // --- SHIFT SETTLEMENT (QUYET_TOAN_CA) ---
  async settleShift({ ngayQuyetToan, caLam, doanhThuThucTe, doanhThuHeThong, maNVBanHang, maNVKeToan, ghiChu }) {
    const query = `
      INSERT INTO QUYET_TOAN_CA (ngayQuyetToan, caLam, doanhThuThucTe, doanhThuHeThong, maNVBanHang, maNVKeToan, trangThai)
      VALUES ($1, $2, $3, $4, $5, $6, 'Đã chốt')
      RETURNING *
    `;
    const result = await pool.query(query, [
      ngayQuyetToan,
      caLam,
      doanhThuThucTe,
      doanhThuHeThong,
      maNVBanHang,
      maNVKeToan
    ]);
    return result.rows[0];
  },

  async getShiftSettlements({ page = 1, limit = 10, ngay, caLam, maNV }) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM QUYET_TOAN_CA WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM QUYET_TOAN_CA WHERE 1=1`;
    const params = [];
    let pIndex = 1;

    if (ngay) {
      query += ` AND ngayQuyetToan = $${pIndex}`;
      countQuery += ` AND ngayQuyetToan = $${pIndex}`;
      params.push(ngay);
      pIndex++;
    }
    if (caLam) {
      query += ` AND caLam = $${pIndex}`;
      countQuery += ` AND caLam = $${pIndex}`;
      params.push(caLam);
      pIndex++;
    }
    if (maNV) {
      query += ` AND maNVBanHang = $${pIndex}`;
      countQuery += ` AND maNVBanHang = $${pIndex}`;
      params.push(maNV);
      pIndex++;
    }

    query += ` ORDER BY ngayQuyetToan DESC, ngayTao DESC LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
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

  // --- WAREHOUSE PAYMENTS (THANH_TOAN_HOA_DON_KHO) ---
  async getWarehousePayments() {
    // List all payments, showing pending ones first
    const query = `
      SELECT * FROM THANH_TOAN_HOA_DON_KHO 
      ORDER BY CASE WHEN phuongThuc IS NULL THEN 0 ELSE 1 END, ngayThanhToan DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getPaymentById(maThanhToan) {
    const query = 'SELECT * FROM THANH_TOAN_HOA_DON_KHO WHERE maThanhToan = $1';
    const result = await pool.query(query, [maThanhToan]);
    return result.rows[0];
  },

  async payWarehouseInvoice(maThanhToan, { phuongThuc, maNVKeToan, ghiChu }) {
    const query = `
      UPDATE THANH_TOAN_HOA_DON_KHO
      SET phuongThuc = $1,
          maNVKeToan = $2,
          ghiChu = COALESCE($3, ghiChu),
          ngayThanhToan = NOW()
      WHERE maThanhToan = $4
      RETURNING *
    `;
    const result = await pool.query(query, [phuongThuc, maNVKeToan, ghiChu || null, maThanhToan]);
    return result.rows[0];
  }
};
