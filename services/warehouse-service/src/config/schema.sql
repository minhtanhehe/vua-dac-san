-- SQL Schema for warehouse-service
-- Database: warehouse_db

-- Table: PHIEU_KHO
CREATE TABLE IF NOT EXISTS PHIEU_KHO (
    maPhieu VARCHAR(20) PRIMARY KEY, -- format: NK001 (nhập kho), XK001 (xuất kho)
    loaiPhieu VARCHAR(10) NOT NULL CHECK (loaiPhieu IN ('NHAP', 'XUAT')),
    ngayLapPhieu TIMESTAMP DEFAULT NOW(),
    tongTien DECIMAL(18,2) DEFAULT 0 CHECK (tongTien >= 0),
    ghiChu VARCHAR(255) NULL,
    maNVKho VARCHAR(20) NULL, -- reference only (user-service NHAN_VIEN)
    maNCC VARCHAR(20) NULL, -- reference only (user-service NHA_CUNG_CAP, for NHAP)
    trangThaiTT VARCHAR(30) DEFAULT 'Chờ thanh toán',
    ngayCapNhat TIMESTAMP DEFAULT NOW()
);

-- Table: CHI_TIET_PHIEU_KHO
CREATE TABLE IF NOT EXISTS CHI_TIET_PHIEU_KHO (
    maPhieu VARCHAR(20) REFERENCES PHIEU_KHO(maPhieu) ON DELETE CASCADE,
    maSanpham VARCHAR(20) NOT NULL, -- reference only (product-service SAN_PHAM)
    soLuong INT NOT NULL CHECK (soLuong > 0),
    donGia DECIMAL(18,2) NOT NULL CHECK (donGia >= 0),
    hanSuDung DATE NULL, -- record expiry date for this batch
    PRIMARY KEY (maPhieu, maSanpham)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phieukho_loaiphieu ON PHIEU_KHO(loaiPhieu);
CREATE INDEX IF NOT EXISTS idx_phieukho_manvkho ON PHIEU_KHO(maNVKho);
CREATE INDEX IF NOT EXISTS idx_phieukho_mancc ON PHIEU_KHO(maNCC);
CREATE INDEX IF NOT EXISTS idx_phieukho_ngaylapphieu ON PHIEU_KHO(ngayLapPhieu);

-- Function to recalculate tongTien of PHIEU_KHO
CREATE OR REPLACE FUNCTION update_phieu_kho_total()
RETURNS TRIGGER AS $$
DECLARE
    target_ma_phieu VARCHAR(20);
    new_total DECIMAL(18,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_ma_phieu := OLD.maPhieu;
    ELSE
        target_ma_phieu := NEW.maPhieu;
    END IF;

    -- Calculate sum
    SELECT COALESCE(SUM(soLuong * donGia), 0)
    INTO new_total
    FROM CHI_TIET_PHIEU_KHO
    WHERE maPhieu = target_ma_phieu;

    -- Update PHIEU_KHO
    UPDATE PHIEU_KHO
    SET tongTien = new_total,
        ngayCapNhat = NOW()
    WHERE maPhieu = target_ma_phieu;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automate calculation
CREATE OR REPLACE TRIGGER trg_update_phieu_kho_total
AFTER INSERT OR UPDATE OR DELETE ON CHI_TIET_PHIEU_KHO
FOR EACH ROW
EXECUTE FUNCTION update_phieu_kho_total();
