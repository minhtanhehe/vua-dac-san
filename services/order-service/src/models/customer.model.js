import pool from '../config/db.js';

export const CustomerModel = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM KHACH_HANG WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findBySdt(sdt) {
    const result = await pool.query('SELECT * FROM KHACH_HANG WHERE sdt = $1', [sdt]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM KHACH_HANG WHERE maKhachHang = $1', [id]);
    return result.rows[0];
  },

  async getNewCustomersCountThisMonth() {
    const query = `
      SELECT COUNT(*) as count 
      FROM KHACH_HANG 
      WHERE DATE_TRUNC('month', ngayTao) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  },

  async findByUsername(tenDangnhap) {
    const result = await pool.query('SELECT * FROM KHACH_HANG WHERE tenDangnhap = $1', [tenDangnhap]);
    return result.rows[0];
  },

  async findAddressesByCustomerId(customerId) {
    const result = await pool.query('SELECT * FROM DIA_CHI_KH WHERE maKhachHang = $1 ORDER BY laMacDinh DESC, maDiaChi ASC', [customerId]);
    return result.rows;
  },

  async getAddressById(addressId) {
    const result = await pool.query('SELECT * FROM DIA_CHI_KH WHERE maDiaChi = $1', [addressId]);
    return result.rows[0];
  },

  async createCustomer({ maKhachHang, hoTen, sdt, email, ngaySinh, diaChi, tenDangnhap, trangThai = 1 }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const customerQuery = `
        INSERT INTO KHACH_HANG (maKhachHang, hoTen, sdt, email, ngaySinh, tenDangnhap, trangThai)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const customerRes = await client.query(customerQuery, [
        maKhachHang,
        hoTen,
        sdt,
        email || null,
        ngaySinh || null,
        tenDangnhap || null,
        trangThai
      ]);
      const newCustomer = customerRes.rows[0];

      let newAddress = null;
      if (diaChi) {
        const addressQuery = `
          INSERT INTO DIA_CHI_KH (maKhachHang, diaChiChiTiet, laMacDinh)
          VALUES ($1, $2, TRUE)
          RETURNING *
        `;
        const addressRes = await client.query(addressQuery, [maKhachHang, diaChi]);
        newAddress = addressRes.rows[0];
      }

      await client.query('COMMIT');
      return { ...newCustomer, diaChi: newAddress };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateCustomer(id, { hoTen, sdt, email, ngaySinh, trangThai }) {
    const query = `
      UPDATE KHACH_HANG 
      SET hoTen = COALESCE($1, hoTen),
          sdt = COALESCE($2, sdt),
          email = COALESCE($3, email),
          ngaySinh = COALESCE($4, ngaySinh),
          trangThai = COALESCE($5, trangThai)
      WHERE maKhachHang = $6
      RETURNING *
    `;
    const result = await pool.query(query, [hoTen, sdt, email, ngaySinh, trangThai, id]);
    return result.rows[0];
  },

  async deleteCustomer(id) {
    const result = await pool.query('DELETE FROM KHACH_HANG WHERE maKhachHang = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  async hasOrders(id) {
    const result = await pool.query('SELECT 1 FROM HOA_DON WHERE maKhachHang = $1 LIMIT 1', [id]);
    return result.rowCount > 0;
  },

  async getOrdersHistory(id, { tuNgay, denNgay }) {
    let query = `
      SELECT h.maHoadon, h.ngayTaoHoadon as ngayMua, h.tongTienTT, h.trangThaiDH, h.pThucThanhToan, h.trangThaiTT,
             json_agg(json_build_object('maSanpham', c.maSanpham, 'soLuong', c.soLuong, 'giaBan', c.giaBan)) as danhSachSP
      FROM HOA_DON h
      JOIN CHI_TIET_HOA_DON c ON h.maHoadon = c.maHoadon
      WHERE h.maKhachHang = $1
    `;
    const params = [id];
    let paramIndex = 2;

    if (tuNgay) {
      query += ` AND h.ngayTaoHoadon >= $${paramIndex}`;
      params.push(new Date(tuNgay));
      paramIndex++;
    }
    if (denNgay) {
      query += ` AND h.ngayTaoHoadon <= $${paramIndex}`;
      params.push(new Date(denNgay));
      paramIndex++;
    }

    query += ` GROUP BY h.maHoadon ORDER BY h.ngayTaoHoadon DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getCustomers({ page = 1, limit = 10, search }) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM KHACH_HANG WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM KHACH_HANG WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (hoTen ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR maKhachHang ILIKE $${paramIndex})`;
      countQuery += ` AND (hoTen ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR maKhachHang ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ngayTao DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const countParams = [...params];
    params.push(limit, offset);

    const countRes = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(query, params);
    
    // Add default addresses to each customer
    const data = await Promise.all(dataRes.rows.map(async (customer) => {
      const addresses = await this.findAddressesByCustomerId(customer.makhachhang);
      return { ...customer, diaChi: addresses };
    }));

    return {
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page, 10),
    };
  },

  async addAddress(customerId, { diaChiChiTiet, laMacDinh = false }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (laMacDinh) {
        await client.query('UPDATE DIA_CHI_KH SET laMacDinh = FALSE WHERE maKhachHang = $1', [customerId]);
      }

      const query = `
        INSERT INTO DIA_CHI_KH (maKhachHang, diaChiChiTiet, laMacDinh)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await client.query(query, [customerId, diaChiChiTiet, laMacDinh]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, trangThai) {
    const query = 'UPDATE KHACH_HANG SET trangThai = $1 WHERE maKhachHang = $2 RETURNING *';
    const result = await pool.query(query, [trangThai, id]);
    return result.rows[0];
  }
};
