import pool from '../config/db.js';

export const ProductModel = {
  // Get all products with filters and pagination
  async getAllProducts(filters) {
    const { page = 1, limit = 10, search, maDanhMuc, vungMien, trangThai } = filters;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (maDanhMuc) {
      whereClauses.push(`p.maDanhMuc = $${paramIndex}`);
      params.push(maDanhMuc);
      paramIndex++;
    }

    if (trangThai) {
      whereClauses.push(`p.trangThai = $${paramIndex}`);
      params.push(trangThai);
      paramIndex++;
    }

    if (vungMien) {
      whereClauses.push(`c.vungMien = $${paramIndex}`);
      params.push(vungMien);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(p.tenSanpham ILIKE $${paramIndex} OR p.maSanpham ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM SAN_PHAM p
      LEFT JOIN DANH_MUC_SP c ON p.maDanhMuc = c.maDanhMuc
      ${whereString}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT p.maSanpham, p.tenSanpham, p.maDanhMuc, c.tenDanhMuc, c.vungMien, p.hinhAnh, p.motaSanpham, p.donViTinh, p.giaDon, p.soLuongTon, p.hanSuDung, p.trangThai, p.maNCC
      FROM SAN_PHAM p
      LEFT JOIN DANH_MUC_SP c ON p.maDanhMuc = c.maDanhMuc
      ${whereString}
      ORDER BY p.maSanpham DESC
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

  // Find product by ID
  async findById(maSanpham) {
    const query = `
      SELECT p.maSanpham, p.tenSanpham, p.maDanhMuc, c.tenDanhMuc, c.vungMien, p.hinhAnh, p.motaSanpham, p.donViTinh, p.giaDon, p.soLuongTon, p.hanSuDung, p.trangThai, p.maNCC, p.ngayTao
      FROM SAN_PHAM p
      LEFT JOIN DANH_MUC_SP c ON p.maDanhMuc = c.maDanhMuc
      WHERE p.maSanpham = $1
    `;
    const { rows } = await pool.query(query, [maSanpham]);
    return rows[0] || null;
  },

  // Create new product
  async createProduct(productData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate ID: SP001, SP002
      const idRes = await client.query("SELECT maSanpham FROM SAN_PHAM ORDER BY maSanpham DESC LIMIT 1 FOR UPDATE");
      let nextId = 'SP001';
      if (idRes.rows.length > 0) {
        const lastId = idRes.rows[0].masanpham;
        const number = parseInt(lastId.replace('SP', ''), 10) + 1;
        nextId = 'SP' + String(number).padStart(3, '0');
      }

      const { tenSanpham, maDanhMuc, hinhAnh, motaSanpham, donViTinh, giaDon, hanSuDung, maNCC } = productData;
      const query = `
        INSERT INTO SAN_PHAM (maSanpham, tenSanpham, maDanhMuc, hinhAnh, motaSanpham, donViTinh, giaDon, soLuongTon, hanSuDung, trangThai, maNCC)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'Còn hàng', $9)
        RETURNING *
      `;
      const { rows } = await client.query(query, [
        nextId,
        tenSanpham,
        maDanhMuc,
        hinhAnh || null,
        motaSanpham || null,
        donViTinh || null,
        giaDon,
        hanSuDung || null,
        maNCC || null
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

  // Update product details
  async updateProduct(maSanpham, updateData) {
    const { tenSanpham, maDanhMuc, hinhAnh, motaSanpham, donViTinh, giaDon, hanSuDung, trangThai, maNCC } = updateData;
    const query = `
      UPDATE SAN_PHAM
      SET tenSanpham = $2, maDanhMuc = $3, hinhAnh = $4, motaSanpham = $5, donViTinh = $6, giaDon = $7, hanSuDung = $8, trangThai = $9, maNCC = $10
      WHERE maSanpham = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      maSanpham,
      tenSanpham,
      maDanhMuc,
      hinhAnh || null,
      motaSanpham || null,
      donViTinh || null,
      giaDon,
      hanSuDung || null,
      trangThai,
      maNCC || null
    ]);
    return rows[0] || null;
  },

  // Delete product
  async deleteProduct(maSanpham) {
    const query = `DELETE FROM SAN_PHAM WHERE maSanpham = $1`;
    await pool.query(query, [maSanpham]);
  },

  // Get expiring products within warning threshold
  async getExpiringProducts(days = 30) {
    // Queries the custom database view view_sanpham_sap_het_han
    const query = `
      SELECT maSanpham, tenSanpham, maDanhMuc, soLuongTon, hanSuDung, soNgayConLai
      FROM view_sanpham_sap_het_han
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Internal function to update stock level (deduct/add)
  // Handles transaction safety and prevents negative stock levels
  async updateStockInternal(maSanpham, soLuongThayDoi) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch current stock with Row Lock for safety
      const getStockQuery = `SELECT soLuongTon, tenSanpham FROM SAN_PHAM WHERE maSanpham = $1 FOR UPDATE`;
      const stockRes = await client.query(getStockQuery, [maSanpham]);
      
      if (stockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const currentStock = stockRes.rows[0].soluongton;
      const newStock = currentStock + soLuongThayDoi;

      if (newStock < 0) {
        throw new Error(`Sản phẩm [${stockRes.rows[0].tensanpham}] không đủ hàng tồn kho (Còn lại: ${currentStock}, yêu cầu giảm: ${Math.abs(soLuongThayDoi)})`);
      }

      // 2. Update stock level and automatically change trangThai status if out of stock
      const newStatus = newStock === 0 ? 'Hết hàng' : 'Còn hàng';
      const updateStockQuery = `
        UPDATE SAN_PHAM
        SET soLuongTon = $2, trangThai = $3
        WHERE maSanpham = $1
        RETURNING maSanpham, soLuongTon, trangThai
      `;
      const { rows } = await client.query(updateStockQuery, [maSanpham, newStock, newStatus]);

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Internal function to reserve stock for multiple items atomically
  async reserveStockInternal(items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Extract product IDs
      const productIds = items.map(i => i.maSanpham);
      
      // Fetch all required products with Row Lock
      // Ordering by maSanpham to prevent deadlocks between concurrent transactions
      const getStockQuery = `
        SELECT maSanpham, tenSanpham, soLuongTon 
        FROM SAN_PHAM 
        WHERE maSanpham = ANY($1) 
        ORDER BY maSanpham
        FOR UPDATE
      `;
      const stockRes = await client.query(getStockQuery, [productIds]);
      
      const productMap = {};
      stockRes.rows.forEach(row => {
        productMap[row.masanpham] = row;
      });

      // Verify and deduct stock
      const updatePromises = [];
      for (const item of items) {
        const product = productMap[item.maSanpham];
        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm mã ${item.maSanpham}`);
        }
        
        const currentStock = product.soluongton;
        const newStock = currentStock - item.soLuong;
        
        if (newStock < 0) {
          throw new Error(`Sản phẩm [${product.tensanpham}] không đủ hàng tồn kho (Còn lại: ${currentStock}, yêu cầu: ${item.soLuong})`);
        }
        
        const newStatus = newStock === 0 ? 'Hết hàng' : 'Còn hàng';
        const updateStockQuery = `
          UPDATE SAN_PHAM
          SET soLuongTon = $2, trangThai = $3
          WHERE maSanpham = $1
        `;
        updatePromises.push(client.query(updateStockQuery, [item.maSanpham, newStock, newStatus]));
      }

      await Promise.all(updatePromises);
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // --- CATEGORIES ---
  async getCategories() {
    const query = `
      SELECT maDanhMuc, tenDanhMuc, moTa, vungMien, trangThai
      FROM DANH_MUC_SP
      WHERE trangThai = TRUE
      ORDER BY maDanhMuc ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};
