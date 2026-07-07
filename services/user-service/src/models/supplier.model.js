import pool from '../config/db.js';

export const SupplierModel = {
  // Get all suppliers
  async getAllSuppliers(filters) {
    const { page = 1, limit = 10, search, trangThai } = filters;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (trangThai) {
      whereClauses.push(`trangThai = $${paramIndex}`);
      params.push(trangThai);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(tenNCC ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR maNCC ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM NHA_CUNG_CAP ${whereString}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT maNCC, tenNCC, sdt, email, diaChi, trangThai
      FROM NHA_CUNG_CAP
      ${whereString}
      ORDER BY maNCC DESC
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

  // Find supplier by ID
  async findById(maNCC) {
    const query = `
      SELECT maNCC, tenNCC, sdt, email, diaChi, trangThai
      FROM NHA_CUNG_CAP
      WHERE maNCC = $1
    `;
    const { rows } = await pool.query(query, [maNCC]);
    return rows[0] || null;
  },

  // Check duplicate sdt or email
  async checkDuplicate(email, sdt, excludeMaNCC = null) {
    let query = `
      SELECT maNCC, email, sdt
      FROM NHA_CUNG_CAP
      WHERE (email = $1 OR sdt = $2)
    `;
    let params = [email, sdt];

    if (excludeMaNCC) {
      query += ` AND maNCC <> $3`;
      params.push(excludeMaNCC);
    }

    const { rows } = await pool.query(query, params);
    if (rows.length > 0) {
      if (rows[0].email === email) return 'email';
      if (rows[0].sdt === sdt) return 'sdt';
    }
    return null;
  },

  // Create new supplier
  async createSupplier(supplierData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate next ID: NCC001, NCC002
      const idRes = await client.query("SELECT maNCC FROM NHA_CUNG_CAP ORDER BY maNCC DESC LIMIT 1 FOR UPDATE");
      let nextId = 'NCC001';
      if (idRes.rows.length > 0) {
        const lastId = idRes.rows[0].mancc;
        const number = parseInt(lastId.replace('NCC', ''), 10) + 1;
        nextId = 'NCC' + String(number).padStart(3, '0');
      }

      const { tenNCC, sdt, email, diaChi } = supplierData;
      const query = `
        INSERT INTO NHA_CUNG_CAP (maNCC, tenNCC, sdt, email, diaChi, trangThai)
        VALUES ($1, $2, $3, $4, $5, 'Đang hợp tác')
        RETURNING maNCC, tenNCC, sdt, email, diaChi, trangThai
      `;
      const { rows } = await client.query(query, [nextId, tenNCC, sdt, email || null, diaChi || null]);

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Update supplier
  async updateSupplier(maNCC, updateData) {
    const { tenNCC, sdt, email, diaChi, trangThai } = updateData;
    const query = `
      UPDATE NHA_CUNG_CAP
      SET tenNCC = $2, sdt = $3, email = $4, diaChi = $5, trangThai = COALESCE($6, trangThai)
      WHERE maNCC = $1
      RETURNING maNCC, tenNCC, sdt, email, diaChi, trangThai
    `;
    const { rows } = await pool.query(query, [maNCC, tenNCC, sdt, email || null, diaChi || null, trangThai || null]);
    return rows[0] || null;
  },

  // Update status (e.g. change to 'Ngừng hợp tác')
  async updateStatus(maNCC, status) {
    const query = `
      UPDATE NHA_CUNG_CAP
      SET trangThai = $2
      WHERE maNCC = $1
      RETURNING maNCC, trangThai
    `;
    const { rows } = await pool.query(query, [maNCC, status]);
    return rows[0] || null;
  },

  // Delete supplier (hard delete)
  async deleteSupplier(maNCC) {
    const query = `
      DELETE FROM NHA_CUNG_CAP
      WHERE maNCC = $1
    `;
    await pool.query(query, [maNCC]);
  }
};
