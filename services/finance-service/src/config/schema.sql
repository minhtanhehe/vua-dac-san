-- SQL Schema for finance-service
-- Database: finance_db

-- Table: BANG_LUONG
CREATE TABLE IF NOT EXISTS BANG_LUONG (
    maBangLuong SERIAL PRIMARY KEY,
    thang INT NOT NULL CHECK (thang BETWEEN 1 AND 12),
    nam INT NOT NULL CHECK (nam > 2000),
    luongCoBan DECIMAL(18,2) NOT NULL CHECK (luongCoBan >= 0),
    tongPhuCap DECIMAL(18,2) DEFAULT 0 CHECK (tongPhuCap >= 0),
    tongKhauTru DECIMAL(18,2) DEFAULT 0 CHECK (tongKhauTru >= 0),
    tongLuong DECIMAL(18,2) DEFAULT 0 CHECK (tongLuong >= 0),
    maNhanVien VARCHAR(20) NOT NULL, -- reference only (user-service NHAN_VIEN)
    maNVKeToan VARCHAR(20) NOT NULL, -- reference only
    trangThai VARCHAR(30) DEFAULT 'Chưa chốt',
    ngayLap TIMESTAMP DEFAULT NOW(),
    UNIQUE (maNhanVien, thang, nam)
);

-- Table: QUYET_TOAN_CA
CREATE TABLE IF NOT EXISTS QUYET_TOAN_CA (
    maQuyetToan SERIAL PRIMARY KEY,
    ngayQuyetToan DATE NOT NULL,
    caLam VARCHAR(20) CHECK (caLam IN ('SANG', 'CHIEU', 'TOI')),
    doanhThuThucTe DECIMAL(18,2) NOT NULL CHECK (doanhThuThucTe >= 0),
    doanhThuHeThong DECIMAL(18,2) NOT NULL CHECK (doanhThuHeThong >= 0),
    chenhLech DECIMAL(18,2) GENERATED ALWAYS AS (doanhThuThucTe - doanhThuHeThong) STORED,
    ghiChu VARCHAR(255) NULL,
    maNVBanHang VARCHAR(20) NOT NULL, -- reference only
    maNVKeToan VARCHAR(20) NULL, -- reference only
    trangThai VARCHAR(30) DEFAULT 'Chờ chốt',
    ngayTao TIMESTAMP DEFAULT NOW()
);

-- Table: THANH_TOAN_HOA_DON_KHO
CREATE TABLE IF NOT EXISTS THANH_TOAN_HOA_DON_KHO (
    maThanhToan SERIAL PRIMARY KEY,
    maPhieuKho VARCHAR(20) NOT NULL, -- reference only (warehouse-service PHIEU_KHO)
    soTien DECIMAL(18,2) NOT NULL CHECK (soTien >= 0),
    phuongThuc VARCHAR(30) NULL,
    ngayThanhToan TIMESTAMP DEFAULT NOW(),
    maNVKeToan VARCHAR(20) NULL, -- reference only
    ghiChu VARCHAR(255) NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bangluong_nhanvien ON BANG_LUONG(maNhanVien, thang, nam);
CREATE INDEX IF NOT EXISTS idx_quyettoanca_ngay ON QUYET_TOAN_CA(ngayQuyetToan);
CREATE INDEX IF NOT EXISTS idx_thanhtoankho_maphieukho ON THANH_TOAN_HOA_DON_KHO(maPhieuKho);

-- Trigger function to calculate tongLuong
CREATE OR REPLACE FUNCTION calculate_tong_luong()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tongLuong := NEW.luongCoBan + COALESCE(NEW.tongPhuCap, 0) - COALESCE(NEW.tongKhauTru, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automate calculations
CREATE OR REPLACE TRIGGER trg_calculate_tong_luong
BEFORE INSERT OR UPDATE ON BANG_LUONG
FOR EACH ROW
EXECUTE FUNCTION calculate_tong_luong();
