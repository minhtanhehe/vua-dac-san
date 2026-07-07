-- SQL Schema for order-service
-- Database: order_db

-- Table: KHACH_HANG
CREATE TABLE IF NOT EXISTS KHACH_HANG (
    maKhachHang VARCHAR(20) PRIMARY KEY,
    hoTen VARCHAR(100) NOT NULL,
    sdt VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NULL,
    ngaySinh DATE NULL,
    trangThai INT DEFAULT 1 CHECK (trangThai IN (0, 1)), -- 1: active, 0: inactive
    tenDangnhap VARCHAR(50) UNIQUE NULL, -- reference only to auth-service
    ngayTao TIMESTAMP DEFAULT NOW()
);

-- Table: DIA_CHI_KH
CREATE TABLE IF NOT EXISTS DIA_CHI_KH (
    maDiaChi SERIAL PRIMARY KEY,
    maKhachHang VARCHAR(20) REFERENCES KHACH_HANG(maKhachHang) ON DELETE CASCADE,
    diaChiChiTiet VARCHAR(255) NOT NULL,
    laMacDinh BOOLEAN DEFAULT FALSE
);

-- Table: KHUYEN_MAI
CREATE TABLE IF NOT EXISTS KHUYEN_MAI (
    maKhuyenMai VARCHAR(20) PRIMARY KEY,
    loaiMa VARCHAR(20) NOT NULL CHECK (loaiMa IN ('PHAN_TRAM', 'TRU_TIEN', 'FREESHIP')),
    giaTriGiam DECIMAL(18,2) NOT NULL CHECK (giaTriGiam >= 0),
    donToiThieu DECIMAL(18,2) DEFAULT 0 CHECK (donToiThieu >= 0),
    ngayBatDau TIMESTAMP NOT NULL,
    ngayKetThuc TIMESTAMP NOT NULL,
    soLuongToiDa INT NOT NULL CHECK (soLuongToiDa >= 0),
    daSD INT DEFAULT 0 CHECK (daSD >= 0)
);

-- Table: HOA_DON (đơn hàng)
CREATE TABLE IF NOT EXISTS HOA_DON (
    maHoadon VARCHAR(20) PRIMARY KEY,
    maKhachHang VARCHAR(20) REFERENCES KHACH_HANG(maKhachHang),
    maNVBanHang VARCHAR(20) NULL, -- reference only (user-service NHAN_VIEN)
    maDiaChi INT REFERENCES DIA_CHI_KH(maDiaChi),
    ngayTaoHoadon TIMESTAMP DEFAULT NOW(),
    pThucThanhToan VARCHAR(30) NOT NULL CHECK (pThucThanhToan IN ('COD', 'VNPAY', 'MOMO', 'ZALOPAY', 'QR')),
    maKhuyenMai VARCHAR(20) REFERENCES KHUYEN_MAI(maKhuyenMai) NULL,
    tongTienSP DECIMAL(18,2) NOT NULL CHECK (tongTienSP >= 0),
    phiVanChuyen DECIMAL(18,2) DEFAULT 0 CHECK (phiVanChuyen >= 0),
    tongTienTT DECIMAL(18,2) NOT NULL CHECK (tongTienTT >= 0),
    trangThaiTT VARCHAR(30) DEFAULT 'Chưa thanh toán',
    trangThaiDH VARCHAR(30) DEFAULT 'Chờ xác nhận',
    lyDoHuy VARCHAR(255) NULL,
    ngayCapNhat TIMESTAMP DEFAULT NOW()
);

-- Table: CHI_TIET_HOA_DON
CREATE TABLE IF NOT EXISTS CHI_TIET_HOA_DON (
    maHoadon VARCHAR(20) REFERENCES HOA_DON(maHoadon) ON DELETE CASCADE,
    maSanpham VARCHAR(20) NOT NULL, -- reference only (product-service SAN_PHAM)
    soLuong INT NOT NULL CHECK (soLuong > 0),
    giaBan DECIMAL(18,2) NOT NULL CHECK (giaBan >= 0), -- price at purchasing time
    PRIMARY KEY (maHoadon, maSanpham)
);

-- Table: LICH_SU_DON_HANG
CREATE TABLE IF NOT EXISTS LICH_SU_DON_HANG (
    maLichSu SERIAL PRIMARY KEY,
    maHoadon VARCHAR(20) REFERENCES HOA_DON(maHoadon) ON DELETE CASCADE,
    trangThaiCapNhat VARCHAR(100) NOT NULL,
    ghiChu VARCHAR(255) NULL,
    thoiGian TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hoadon_trangthaidh ON HOA_DON(trangThaiDH);
CREATE INDEX IF NOT EXISTS idx_hoadon_makhachhang ON HOA_DON(maKhachHang);
CREATE INDEX IF NOT EXISTS idx_hoadon_manvbanhang ON HOA_DON(maNVBanHang);
CREATE INDEX IF NOT EXISTS idx_hoadon_ngaytao ON HOA_DON(ngayTaoHoadon);
CREATE INDEX IF NOT EXISTS idx_khuyenmai_ngayketthuc ON KHUYEN_MAI(ngayKetThuc);
CREATE INDEX IF NOT EXISTS idx_chitiethoadon_masanpham ON CHI_TIET_HOA_DON(maSanpham);
