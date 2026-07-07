import pool from '../config/db.js';

export const ContentModel = {
  // --- DANH_MUC_BAI_VIET ---
  async getCategories() {
    const result = await pool.query('SELECT * FROM DANH_MUC_BAI_VIET ORDER BY tenDanhMuc ASC');
    return result.rows;
  },

  async createCategory({ maDanhMucBV, tenDanhMuc }) {
    const query = `
      INSERT INTO DANH_MUC_BAI_VIET (maDanhMucBV, tenDanhMuc, trangThai)
      VALUES ($1, $2, true)
      RETURNING *
    `;
    const result = await pool.query(query, [maDanhMucBV, tenDanhMuc]);
    return result.rows[0];
  },

  // --- BAI_VIET ---
  async getPublicPosts({ page = 1, limit = 10, maDanhMucBV, search }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, b.moTaNgan AS tomtat, d.tenDanhMuc AS tenchuyenmuc 
      FROM BAI_VIET b
      LEFT JOIN DANH_MUC_BAI_VIET d ON b.maDanhMucBV = d.maDanhMucBV
      WHERE b.trangThai = 'Công khai'
    `;
    let countQuery = `SELECT COUNT(*) FROM BAI_VIET b WHERE b.trangThai = 'Công khai'`;
    const params = [];
    let pIndex = 1;

    if (maDanhMucBV) {
      query += ` AND b.maDanhMucBV = $${pIndex}`;
      countQuery += ` AND b.maDanhMucBV = $${pIndex}`;
      params.push(maDanhMucBV);
      pIndex++;
    }

    if (search) {
      query += ` AND to_tsvector('simple', COALESCE(b.tieuDe, '') || ' ' || COALESCE(b.noiDung, '')) @@ plainto_tsquery('simple', $${pIndex})`;
      countQuery += ` AND to_tsvector('simple', COALESCE(b.tieuDe, '') || ' ' || COALESCE(b.noiDung, '')) @@ plainto_tsquery('simple', $${pIndex})`;
      params.push(search);
      pIndex++;
    }

    query += ` ORDER BY b.ngayTao DESC LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
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

  async getManagePosts({ page = 1, limit = 10, maDanhMucBV, search }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, b.moTaNgan AS tomtat, d.tenDanhMuc AS tenchuyenmuc 
      FROM BAI_VIET b
      LEFT JOIN DANH_MUC_BAI_VIET d ON b.maDanhMucBV = d.maDanhMucBV
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) FROM BAI_VIET b WHERE 1=1`;
    const params = [];
    let pIndex = 1;

    if (maDanhMucBV) {
      query += ` AND b.maDanhMucBV = $${pIndex}`;
      countQuery += ` AND b.maDanhMucBV = $${pIndex}`;
      params.push(maDanhMucBV);
      pIndex++;
    }

    if (search) {
      query += ` AND to_tsvector('simple', COALESCE(b.tieuDe, '') || ' ' || COALESCE(b.noiDung, '')) @@ plainto_tsquery('simple', $${pIndex})`;
      countQuery += ` AND to_tsvector('simple', COALESCE(b.tieuDe, '') || ' ' || COALESCE(b.noiDung, '')) @@ plainto_tsquery('simple', $${pIndex})`;
      params.push(search);
      pIndex++;
    }

    query += ` ORDER BY b.ngayTao DESC LIMIT $${pIndex} OFFSET $${pIndex + 1}`;
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

  async getPostById(id) {
    const query = `
      SELECT b.*, b.moTaNgan AS tomtat, d.tenDanhMuc AS tenchuyenmuc 
      FROM BAI_VIET b
      LEFT JOIN DANH_MUC_BAI_VIET d ON b.maDanhMucBV = d.maDanhMucBV
      WHERE b.maBaiviet = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async createPost({ maBaiviet, tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV, maNVBanHang }) {
    const query = `
      INSERT INTO BAI_VIET (maBaiviet, tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV, maNVBanHang, trangThai, luotXem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Chờ duyệt', 0)
      RETURNING *
    `;
    const result = await pool.query(query, [
      maBaiviet,
      tieuDe,
      moTaNgan || null,
      noiDung,
      hinhAnh || null,
      maDanhMucBV,
      maNVBanHang
    ]);
    return result.rows[0];
  },

  async updatePost(id, { tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV }) {
    const query = `
      UPDATE BAI_VIET
      SET tieuDe = COALESCE($1, tieuDe),
          moTaNgan = COALESCE($2, moTaNgan),
          noiDung = COALESCE($3, noiDung),
          hinhAnh = COALESCE($4, hinhAnh),
          maDanhMucBV = COALESCE($5, maDanhMucBV),
          ngayCapNhat = NOW()
      WHERE maBaiviet = $6
      RETURNING *
    `;
    const result = await pool.query(query, [tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV, id]);
    return result.rows[0];
  },

  async updatePostStatus(id, trangThai) {
    const query = `
      UPDATE BAI_VIET
      SET trangThai = $1, ngayCapNhat = NOW()
      WHERE maBaiviet = $2
      RETURNING *
    `;
    const result = await pool.query(query, [trangThai, id]);
    return result.rows[0];
  },

  async deletePost(id) {
    const result = await pool.query('DELETE FROM BAI_VIET WHERE maBaiviet = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  // --- BINH_LUAN ---
  async getPendingComments() {
    const result = await pool.query("SELECT * FROM BINH_LUAN WHERE trangThai = 'Chờ duyệt' ORDER BY ngayTao ASC");
    return result.rows;
  },

  async getCommentById(id) {
    const result = await pool.query('SELECT * FROM BINH_LUAN WHERE maBL = $1', [id]);
    return result.rows[0];
  },

  async updateCommentStatus(id, trangThai, maNVCSKH) {
    const query = `
      UPDATE BINH_LUAN
      SET trangThai = $1, maNVCSKH = $2
      WHERE maBL = $3
      RETURNING *
    `;
    const result = await pool.query(query, [trangThai, maNVCSKH, id]);
    return result.rows[0];
  },

  async createComment({ maBL, maKhachHang, maSanpham, noiDungBL, danhGia }) {
    const query = `
      INSERT INTO BINH_LUAN (maBL, maKhachHang, maSanpham, noiDungBL, danhGia, trangThai)
      VALUES ($1, $2, $3, $4, $5, 'Chờ duyệt')
      RETURNING *
    `;
    const result = await pool.query(query, [maBL, maKhachHang, maSanpham, noiDungBL, danhGia]);
    return result.rows[0];
  },

  // --- YEU_CAU_HO_TRO ---
  async getSupportRequests({ trangThai, loaiYeuCau, maKhachHang }) {
    let query = 'SELECT * FROM YEU_CAU_HO_TRO WHERE 1=1';
    const params = [];
    let pIndex = 1;

    if (trangThai) {
      query += ` AND trangThai = $${pIndex}`;
      params.push(trangThai);
      pIndex++;
    }
    if (loaiYeuCau) {
      query += ` AND loaiYeuCau = $${pIndex}`;
      params.push(loaiYeuCau);
      pIndex++;
    }
    if (maKhachHang) {
      query += ` AND maKhachHang = $${pIndex}`;
      params.push(maKhachHang);
      pIndex++;
    }

    query += ' ORDER BY ngayTao DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getSupportRequestById(id) {
    const result = await pool.query('SELECT * FROM YEU_CAU_HO_TRO WHERE maYeuCau = $1', [id]);
    return result.rows[0];
  },

  async createSupportRequest({ maYeuCau, loaiYeuCau, maKhachHang, maSanpham, maHoaDon, noiDungKH }) {
    const query = `
      INSERT INTO YEU_CAU_HO_TRO (maYeuCau, loaiYeuCau, maKhachHang, maSanpham, maHoaDon, noiDungKH, trangThai)
      VALUES ($1, $2, $3, $4, $5, $6, 'Chờ xử lý')
      RETURNING *
    `;
    const result = await pool.query(query, [
      maYeuCau,
      loaiYeuCau,
      maKhachHang,
      maSanpham || null,
      maHoaDon || null,
      noiDungKH
    ]);
    return result.rows[0];
  },

  async replySupportRequest(id, { noiDungPhanHoi, maNVCSKH }) {
    const query = `
      UPDATE YEU_CAU_HO_TRO
      SET noiDungPhanHoi = $1,
          maNVCSKH = $2,
          trangThai = 'Đã xử lý',
          ngayXuLy = NOW()
      WHERE maYeuCau = $3
      RETURNING *
    `;
    const result = await pool.query(query, [noiDungPhanHoi, maNVCSKH, id]);
    return result.rows[0];
  }
};
