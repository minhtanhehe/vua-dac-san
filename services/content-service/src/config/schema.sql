-- SQL Schema for content-service
-- Database: content_db

-- Table: DANH_MUC_BAI_VIET
CREATE TABLE IF NOT EXISTS DANH_MUC_BAI_VIET (
    maDanhMucBV VARCHAR(20) PRIMARY KEY,
    tenDanhMuc VARCHAR(100) NOT NULL,
    trangThai BOOLEAN DEFAULT TRUE
);

-- Table: BAI_VIET
CREATE TABLE IF NOT EXISTS BAI_VIET (
    maBaiviet VARCHAR(20) PRIMARY KEY,
    tieuDe VARCHAR(255) NOT NULL,
    moTaNgan VARCHAR(500) NULL,
    noiDung TEXT NOT NULL,
    hinhAnh VARCHAR(255) NULL,
    maDanhMucBV VARCHAR(20) REFERENCES DANH_MUC_BAI_VIET(maDanhMucBV),
    maNVBanHang VARCHAR(20) NULL, -- reference only (user-service NHAN_VIEN)
    ngayTao TIMESTAMP DEFAULT NOW(),
    ngayCapNhat TIMESTAMP DEFAULT NOW(),
    trangThai VARCHAR(30) DEFAULT 'Chờ duyệt',
    luotXem INT DEFAULT 0 CHECK (luotXem >= 0)
);

-- Table: BINH_LUAN
CREATE TABLE IF NOT EXISTS BINH_LUAN (
    maBL VARCHAR(20) PRIMARY KEY,
    maKhachHang VARCHAR(20) NOT NULL, -- reference only (order-service KHACH_HANG)
    maSanpham VARCHAR(20) NOT NULL, -- reference only (product-service SAN_PHAM)
    noiDungBL TEXT NOT NULL,
    danhGia INT CHECK (danhGia BETWEEN 1 AND 5),
    trangThai VARCHAR(30) DEFAULT 'Chờ duyệt',
    maNVCSKH VARCHAR(20) NULL, -- reference only (user-service NHAN_VIEN)
    ngayTao TIMESTAMP DEFAULT NOW()
);

-- Table: YEU_CAU_HO_TRO
CREATE TABLE IF NOT EXISTS YEU_CAU_HO_TRO (
    maYeuCau VARCHAR(20) PRIMARY KEY,
    loaiYeuCau VARCHAR(50) NOT NULL CHECK (loaiYeuCau IN ('Tư vấn', 'Thắc mắc', 'Khiếu nại')),
    maKhachHang VARCHAR(20) NOT NULL, -- reference only (order-service KHACH_HANG)
    maSanpham VARCHAR(20) NULL, -- reference only (product-service SAN_PHAM)
    maHoaDon VARCHAR(20) NULL, -- reference only (order-service HOA_DON)
    noiDungKH TEXT NOT NULL,
    noiDungPhanHoi TEXT NULL,
    trangThai VARCHAR(30) DEFAULT 'Chờ xử lý',
    maNVCSKH VARCHAR(20) NULL, -- reference only (user-service NHAN_VIEN)
    ngayTao TIMESTAMP DEFAULT NOW(),
    ngayXuLy TIMESTAMP NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_baiviet_madanhmuc ON BAI_VIET(maDanhMucBV);
CREATE INDEX IF NOT EXISTS idx_baiviet_trangthai ON BAI_VIET(trangThai);
CREATE INDEX IF NOT EXISTS idx_binhluan_masanpham ON BINH_LUAN(maSanpham);
CREATE INDEX IF NOT EXISTS idx_binhluan_trangthai ON BINH_LUAN(trangThai);
CREATE INDEX IF NOT EXISTS idx_yeucau_trangthai ON YEU_CAU_HO_TRO(trangThai);

-- Full-text search index on tieuDe and noiDung using 'simple' search config for Vietnamese
CREATE INDEX IF NOT EXISTS idx_baiviet_fts ON BAI_VIET USING gin(to_tsvector('simple', COALESCE(tieuDe, '') || ' ' || COALESCE(noiDung, '')));
