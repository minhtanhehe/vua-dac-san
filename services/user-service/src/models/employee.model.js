import pool from '../config/db.js';

export const EmployeeModel = {
  // Get all employees with pagination and filters
  async getAllEmployees(filters) {
    const { page = 1, limit = 10, trangThai, chucVu, search } = filters;
    const offset = (page - 1) * limit;
    
    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (trangThai !== undefined && trangThai !== '') {
      whereClauses.push(`trangThai = $${paramIndex}`);
      params.push(parseInt(trangThai, 10));
      paramIndex++;
    }

    if (chucVu) {
      whereClauses.push(`chucVu = $${paramIndex}`);
      params.push(chucVu);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(hoTen ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR maNhanVien ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM NHAN_VIEN ${whereString}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT maNhanVien, hoTen, ngaySinh, cccd, sdt, email, chucVu, tenDangnhap, trangThai, ngayTao
      FROM NHAN_VIEN
      ${whereString}
      ORDER BY maNhanVien ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const { rows } = await pool.query(dataQuery, dataParams);

    return {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
      data: rows
    };
  },

  // Find employee by ID
  async findById(maNhanVien) {
    const query = `
      SELECT maNhanVien, hoTen, ngaySinh, cccd, sdt, email, chucVu, tenDangnhap, trangThai, ngayTao
      FROM NHAN_VIEN
      WHERE maNhanVien = $1
    `;
    const { rows } = await pool.query(query, [maNhanVien]);
    return rows[0] || null;
  },

  // Check duplicate email or phone (optionally excluding a specific employee)
  async checkDuplicate(email, sdt, excludeMaNhanVien = null) {
    let query = `
      SELECT maNhanVien, email, sdt
      FROM NHAN_VIEN
      WHERE (email = $1 OR sdt = $2)
    `;
    let params = [email, sdt];

    if (excludeMaNhanVien) {
      query += ` AND maNhanVien <> $3`;
      params.push(excludeMaNhanVien);
    }

    const { rows } = await pool.query(query, params);
    if (rows.length > 0) {
      if (rows[0].email === email) return 'email';
      if (rows[0].sdt === sdt) return 'sdt';
    }
    return null;
  },

  // Create new employee
  async createEmployee(employeeData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Generate auto-increment ID: NV001, NV002
      const idRes = await client.query("SELECT maNhanVien FROM NHAN_VIEN ORDER BY maNhanVien DESC LIMIT 1 FOR UPDATE");
      let nextId = 'NV001';
      if (idRes.rows.length > 0) {
        const lastId = idRes.rows[0].manhanvien;
        const number = parseInt(lastId.replace('NV', ''), 10) + 1;
        nextId = 'NV' + String(number).padStart(3, '0');
      }

      // 2. Insert employee
      const { hoTen, ngaySinh, cccd, sdt, email, chucVu, tenDangnhap } = employeeData;
      const query = `
        INSERT INTO NHAN_VIEN (maNhanVien, hoTen, ngaySinh, cccd, sdt, email, chucVu, tenDangnhap, trangThai)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
        RETURNING maNhanVien, hoTen, sdt, email, chucVu, tenDangnhap
      `;
      const { rows } = await client.query(query, [
        nextId,
        hoTen,
        ngaySinh || null,
        cccd || null,
        sdt,
        email,
        chucVu || null,
        tenDangnhap || null
      ]);

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Update employee details
  async updateEmployee(maNhanVien, updateData) {
    const { hoTen, ngaySinh, cccd, sdt, email, chucVu } = updateData;
    const query = `
      UPDATE NHAN_VIEN
      SET hoTen = $2, ngaySinh = $3, cccd = $4, sdt = $5, email = $6, chucVu = $7
      WHERE maNhanVien = $1
      RETURNING maNhanVien, hoTen, ngaySinh, cccd, sdt, email, chucVu, tenDangnhap, trangThai
    `;
    const { rows } = await pool.query(query, [maNhanVien, hoTen, ngaySinh || null, cccd || null, sdt, email, chucVu || null]);
    return rows[0] || null;
  },

  // Update employee status (lock/unlock)
  async updateStatus(maNhanVien, status) {
    const query = `
      UPDATE NHAN_VIEN
      SET trangThai = $2
      WHERE maNhanVien = $1
      RETURNING maNhanVien, trangThai
    `;
    const { rows } = await pool.query(query, [maNhanVien, status]);
    return rows[0] || null;
  },

  // --- AUDIT LOGS ---
  async addActivityLog(maNhanVien, phanHe, thaoTac, chiTietThayDoi) {
    const query = `
      INSERT INTO LICH_SU_HOATDONG (maNhanVien, phanHe, thaoTac, chiTietThayDoi)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [maNhanVien, phanHe, thaoTac, JSON.stringify(chiTietThayDoi)]);
  },

  async getActivityLogs(maNhanVien) {
    const query = `
      SELECT maLog, thoiGian, phanHe, thaoTac, chiTietThayDoi
      FROM LICH_SU_HOATDONG
      WHERE maNhanVien = $1
      ORDER BY thoiGian DESC
      LIMIT 100
    `;
    const { rows } = await pool.query(query, [maNhanVien]);
    return rows;
  },

  // --- SCHEDULES ---
  async getSchedule(maNhanVien, filter) {
    const { tuanHienTai, tuThu, denThu } = filter;
    let query = `
      SELECT maLich, maNhanVien, ngayLam, caLam, nhiemVu
      FROM LICH_LAMNVIEC
      WHERE maNhanVien = $1
    `;
    let params = [maNhanVien];
    let paramIndex = 2;

    if (tuanHienTai === 'true' || tuanHienTai === true) {
      query += ` AND ngayLam >= DATE_TRUNC('week', CURRENT_DATE) AND ngayLam < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'`;
    } else if (tuThu && denThu) {
      query += ` AND ngayLam >= $${paramIndex} AND ngayLam <= $${paramIndex + 1}`;
      params.push(tuThu, denThu);
    }

    query += ` ORDER BY ngayLam ASC, caLam ASC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }
};
