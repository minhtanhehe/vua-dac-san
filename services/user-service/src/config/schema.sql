-- SQL Schema for user-service
-- Database: user_db

-- Table: NHAN_VIEN
CREATE TABLE IF NOT EXISTS NHAN_VIEN (
    maNhanVien VARCHAR(20) PRIMARY KEY, -- format: NV001, NV002,...
    hoTen VARCHAR(100) NOT NULL,
    ngaySinh DATE NULL,
    cccd VARCHAR(12) UNIQUE NULL,
    sdt VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    chucVu VARCHAR(50) NULL,
    tenDangnhap VARCHAR(50) UNIQUE NULL, -- reference only (auth-service)
    trangThai INT DEFAULT 1 CHECK (trangThai IN (0, 1)), -- 1: active, 0: locked
    ngayTao TIMESTAMP DEFAULT NOW()
);

-- Table: LICH_LAMNVIEC
CREATE TABLE IF NOT EXISTS LICH_LAMNVIEC (
    maLich SERIAL PRIMARY KEY,
    maNhanVien VARCHAR(20) REFERENCES NHAN_VIEN(maNhanVien) ON DELETE CASCADE,
    ngayLam DATE NOT NULL,
    caLam VARCHAR(20) CHECK (caLam IN ('SANG', 'CHIEU', 'TOI')),
    nhiemVu VARCHAR(255) NULL
);

-- Table: LICH_SU_HOATDONG (audit log)
CREATE TABLE IF NOT EXISTS LICH_SU_HOATDONG (
    maLog SERIAL PRIMARY KEY,
    thoiGian TIMESTAMP DEFAULT NOW(),
    maNhanVien VARCHAR(20) REFERENCES NHAN_VIEN(maNhanVien) ON DELETE SET NULL,
    phanHe VARCHAR(50) NOT NULL,
    thaoTac VARCHAR(50) NOT NULL,
    chiTietThayDoi JSONB NULL -- stores differences/details
);

-- Table: NHA_CUNG_CAP
CREATE TABLE IF NOT EXISTS NHA_CUNG_CAP (
    maNCC VARCHAR(20) PRIMARY KEY,
    tenNCC VARCHAR(100) NOT NULL,
    sdt VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NULL,
    diaChi VARCHAR(255) NULL,
    trangThai VARCHAR(30) DEFAULT 'Đang hợp tác'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nhanvien_sdt ON NHAN_VIEN(sdt);
CREATE INDEX IF NOT EXISTS idx_nhanvien_email ON NHAN_VIEN(email);
CREATE INDEX IF NOT EXISTS idx_nhanvien_tendangnhap ON NHAN_VIEN(tenDangnhap);
CREATE INDEX IF NOT EXISTS idx_lichlamviec_ngaylam ON LICH_LAMNVIEC(ngayLam);
CREATE INDEX IF NOT EXISTS idx_lichsuhoatdong_thoigian ON LICH_SU_HOATDONG(thoiGian);
CREATE INDEX IF NOT EXISTS idx_nhacungcap_tenncc ON NHA_CUNG_CAP(tenNCC);
