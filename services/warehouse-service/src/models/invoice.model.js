import pool from '../config/db.js';

export const InvoiceModel = {
  async getInvoices({ page = 1, limit = 10, loaiPhieu, trangThaiTT, tuNgay, denNgay }) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM PHIEU_KHO WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM PHIEU_KHO WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (loaiPhieu) {
      query += ` AND loaiPhieu = $${paramIndex}`;
      countQuery += ` AND loaiPhieu = $${paramIndex}`;
      params.push(loaiPhieu);
      paramIndex++;
    }

    if (trangThaiTT) {
      query += ` AND trangThaiTT = $${paramIndex}`;
      countQuery += ` AND trangThaiTT = $${paramIndex}`;
      params.push(trangThaiTT);
      paramIndex++;
    }

    if (tuNgay) {
      query += ` AND ngayLapPhieu >= $${paramIndex}`;
      countQuery += ` AND ngayLapPhieu >= $${paramIndex}`;
      params.push(new Date(tuNgay));
      paramIndex++;
    }

    if (denNgay) {
      query += ` AND ngayLapPhieu <= $${paramIndex}`;
      countQuery += ` AND ngayLapPhieu <= $${paramIndex}`;
      params.push(new Date(denNgay));
      paramIndex++;
    }

    query += ` ORDER BY ngayLapPhieu DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

  async getInvoiceById(id) {
    const query = 'SELECT * FROM PHIEU_KHO WHERE maPhieu = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async getInvoiceItems(maPhieu) {
    const query = 'SELECT * FROM CHI_TIET_PHIEU_KHO WHERE maPhieu = $1';
    const result = await pool.query(query, [maPhieu]);
    return result.rows;
  },

  async getTransactionClient() {
    return await pool.connect();
  },

  async createInvoice({ maPhieu, loaiPhieu, ghiChu, maNVKho, maNCC, chiTiet }, client) {
    const invoiceQuery = `
      INSERT INTO PHIEU_KHO (maPhieu, loaiPhieu, ghiChu, maNVKho, maNCC, trangThaiTT)
      VALUES ($1, $2, $3, $4, $5, 'Chờ thanh toán')
      RETURNING *
    `;
    const invoiceRes = await client.query(invoiceQuery, [
      maPhieu,
      loaiPhieu,
      ghiChu || null,
      maNVKho || null,
      maNCC || null
    ]);
    const newInvoice = invoiceRes.rows[0];

    const itemQuery = `
      INSERT INTO CHI_TIET_PHIEU_KHO (maPhieu, maSanpham, soLuong, donGia, hanSuDung)
      VALUES ($1, $2, $3, $4, $5)
    `;
    for (const item of chiTiet) {
      await client.query(itemQuery, [
        maPhieu,
        item.maSanpham,
        item.soLuong,
        item.donGia,
        item.hanSuDung || null
      ]);
    }

    // Since the database trigger automatically updates tongTien in PHIEU_KHO,
    // we query the invoice again to get the updated tongTien.
    const updatedInvoiceRes = await client.query('SELECT * FROM PHIEU_KHO WHERE maPhieu = $1', [maPhieu]);
    return updatedInvoiceRes.rows[0];
  },

  async updateInvoice(id, { ghiChu, maNCC, chiTiet }, client) {
    const updateInvoiceQuery = `
      UPDATE PHIEU_KHO
      SET ghiChu = COALESCE($1, ghiChu),
          maNCC = COALESCE($2, maNCC),
          ngayCapNhat = NOW()
      WHERE maPhieu = $3
      RETURNING *
    `;
    await client.query(updateInvoiceQuery, [ghiChu || null, maNCC || null, id]);

    // Re-insert items
    await client.query('DELETE FROM CHI_TIET_PHIEU_KHO WHERE maPhieu = $1', [id]);

    const itemQuery = `
      INSERT INTO CHI_TIET_PHIEU_KHO (maPhieu, maSanpham, soLuong, donGia, hanSuDung)
      VALUES ($1, $2, $3, $4, $5)
    `;
    for (const item of chiTiet) {
      await client.query(itemQuery, [
        id,
        item.maSanpham,
        item.soLuong,
        item.donGia,
        item.hanSuDung || null
      ]);
    }

    const updatedInvoiceRes = await client.query('SELECT * FROM PHIEU_KHO WHERE maPhieu = $1', [id]);
    return updatedInvoiceRes.rows[0];
  },

  async deleteInvoice(id, client) {
    const executeQuery = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await executeQuery('DELETE FROM PHIEU_KHO WHERE maPhieu = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  async hasTransactionsForSupplier(supplierId) {
    const result = await pool.query('SELECT 1 FROM PHIEU_KHO WHERE maNCC = $1 LIMIT 1', [supplierId]);
    return result.rowCount > 0;
  }
};
