import pool from '../config/db.js';

export const AccountModel = {
  // Find account by username (tenDangnhap)
  async findByUsername(username) {
    const query = `
      SELECT tenDangnhap, matKhau, vaiTro, trangThai, lanDangNhapSai, thoiGianKhoa, ngayTao, buocDauDoiMatKhau
      FROM TAI_KHOAN
      WHERE tenDangnhap = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows[0] || null;
  },

  // Create internal account
  async createAccount(username, passwordHash, role, mustChangePassword = true) {
    const query = `
      INSERT INTO TAI_KHOAN (tenDangnhap, matKhau, vaiTro, trangThai, buocDauDoiMatKhau)
      VALUES ($1, $2, $3, 1, $4)
      RETURNING tenDangnhap, vaiTro, trangThai, buocDauDoiMatKhau
    `;
    const { rows } = await pool.query(query, [username, passwordHash, role, mustChangePassword]);
    return rows[0];
  },

  // Update password
  async updatePassword(username, newPasswordHash) {
    const query = `
      UPDATE TAI_KHOAN
      SET matKhau = $2, buocDauDoiMatKhau = FALSE, lanDangNhapSai = 0, thoiGianKhoa = NULL
      WHERE tenDangnhap = $1
      RETURNING tenDangnhap
    `;
    const { rows } = await pool.query(query, [username, newPasswordHash]);
    return rows[0] || null;
  },

  // Handle failed login count and lock account if needed
  async incrementFailedLogins(username) {
    // 1. Get current failed attempts
    const selectQuery = `SELECT lanDangNhapSai FROM TAI_KHOAN WHERE tenDangnhap = $1`;
    const { rows } = await pool.query(selectQuery, [username]);
    if (rows.length === 0) return null;

    const currentFailed = rows[0].landangnhapsai + 1;
    let lockTime = null;

    // Lock account for 30 minutes if failed >= 5 times
    if (currentFailed >= 5) {
      lockTime = new Date(Date.now() + 30 * 60 * 1000);
      console.log(`Account ${username} locked until ${lockTime.toISOString()}`);
    }

    const updateQuery = `
      UPDATE TAI_KHOAN
      SET lanDangNhapSai = $2, thoiGianKhoa = $3
      WHERE tenDangnhap = $1
      RETURNING lanDangNhapSai, thoiGianKhoa
    `;
    const updateResult = await pool.query(updateQuery, [username, currentFailed, lockTime]);
    return updateResult.rows[0];
  },

  // Reset failed logins
  async resetFailedLogins(username) {
    const query = `
      UPDATE TAI_KHOAN
      SET lanDangNhapSai = 0, thoiGianKhoa = NULL
      WHERE tenDangnhap = $1
    `;
    await pool.query(query, [username]);
  },

  // Fetch roles/permissions for a user
  async getPermissions(username) {
    const query = `
      SELECT vaiTro
      FROM PHAN_QUYEN
      WHERE maNhanVien = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows.map((r) => r.vaitro);
  },

  // Add permission
  async addPermission(username, role) {
    const query = `
      INSERT INTO PHAN_QUYEN (maNhanVien, vaiTro)
      VALUES ($1, $2)
      ON CONFLICT (maNhanVien, vaiTro) DO NOTHING
    `;
    await pool.query(query, [username, role]);
  },

  // Remove permissions
  async clearPermissions(username) {
    const query = `DELETE FROM PHAN_QUYEN WHERE maNhanVien = $1`;
    await pool.query(query, [username]);
  },

  // --- REFRESH TOKEN OPERATIONS ---
  async saveRefreshToken(token, username, expiresAt) {
    const query = `
      INSERT INTO REFRESH_TOKEN (token, tenDangnhap, ngayHetHan, daRevoke)
      VALUES ($1, $2, $3, FALSE)
      RETURNING id
    `;
    const { rows } = await pool.query(query, [token, username, expiresAt]);
    return rows[0];
  },

  async findRefreshToken(token) {
    const query = `
      SELECT id, token, tenDangnhap, ngayHetHan, daRevoke
      FROM REFRESH_TOKEN
      WHERE token = $1
    `;
    const { rows } = await pool.query(query, [token]);
    return rows[0] || null;
  },

  async revokeRefreshToken(token) {
    const query = `
      UPDATE REFRESH_TOKEN
      SET daRevoke = TRUE
      WHERE token = $1
    `;
    await pool.query(query, [token]);
  },

  async revokeAllUserRefreshTokens(username) {
    const query = `
      UPDATE REFRESH_TOKEN
      SET daRevoke = TRUE
      WHERE tenDangnhap = $1
    `;
    await pool.query(query, [username]);
  }
};
