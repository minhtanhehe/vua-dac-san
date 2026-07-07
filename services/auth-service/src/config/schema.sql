-- SQL Schema for auth-service
-- Database: auth_db

-- Table: TAI_KHOAN
CREATE TABLE IF NOT EXISTS TAI_KHOAN (
    tenDangnhap VARCHAR(50) PRIMARY KEY,
    matKhau VARCHAR(255) NOT NULL, -- bcrypt hash
    vaiTro VARCHAR(20) NOT NULL CHECK (vaiTro IN ('QUAN_LY', 'BAN_HANG', 'KHO', 'KE_TOAN', 'CSKH', 'KHACH_HANG')),
    trangThai INT DEFAULT 1 CHECK (trangThai IN (0, 1)), -- 1: active, 0: locked
    lanDangNhapSai INT DEFAULT 0,
    thoiGianKhoa TIMESTAMP NULL,
    ngayTao TIMESTAMP DEFAULT NOW(),
    buocDauDoiMatKhau BOOLEAN DEFAULT TRUE
);

-- Table: PHAN_QUYEN (bảng phân quyền nhiều role cho một nhân viên)
CREATE TABLE IF NOT EXISTS PHAN_QUYEN (
    maNhanVien VARCHAR(20) NOT NULL,
    vaiTro VARCHAR(20) NOT NULL CHECK (vaiTro IN ('QUAN_LY', 'BAN_HANG', 'KHO', 'KE_TOAN', 'CSKH', 'KHACH_HANG')),
    ngayGan TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (maNhanVien, vaiTro)
);

-- Table: REFRESH_TOKEN
CREATE TABLE IF NOT EXISTS REFRESH_TOKEN (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    tenDangnhap VARCHAR(50) REFERENCES TAI_KHOAN(tenDangnhap) ON DELETE CASCADE,
    ngayHetHan TIMESTAMP NOT NULL,
    daRevoke BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_taikhoan_vaitro ON TAI_KHOAN(vaiTro);
CREATE INDEX IF NOT EXISTS idx_taikhoan_trangthai ON TAI_KHOAN(trangThai);
CREATE INDEX IF NOT EXISTS idx_refreshtoken_token ON REFRESH_TOKEN(token);
CREATE INDEX IF NOT EXISTS idx_refreshtoken_tendangnhap ON REFRESH_TOKEN(tenDangnhap);
CREATE INDEX IF NOT EXISTS idx_phanquyen_manhanvien ON PHAN_QUYEN(maNhanVien);
