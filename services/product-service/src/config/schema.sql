-- SQL Schema for product-service
-- Database: product_db

-- Table: DANH_MUC_SP
CREATE TABLE IF NOT EXISTS DANH_MUC_SP (
    maDanhMuc VARCHAR(20) PRIMARY KEY,
    tenDanhMuc VARCHAR(100) NOT NULL,
    moTa TEXT NULL,
    vungMien VARCHAR(20) CHECK (vungMien IN ('Miền Bắc', 'Miền Trung', 'Miền Nam')),
    trangThai BOOLEAN DEFAULT TRUE
);

-- Table: SAN_PHAM
CREATE TABLE IF NOT EXISTS SAN_PHAM (
    maSanpham VARCHAR(20) PRIMARY KEY,
    tenSanpham VARCHAR(150) NOT NULL,
    maDanhMuc VARCHAR(20) REFERENCES DANH_MUC_SP(maDanhMuc),
    hinhAnh VARCHAR(255) NULL,
    motaSanpham TEXT NULL,
    donViTinh VARCHAR(20) NULL,
    giaDon DECIMAL(18,2) NOT NULL CHECK (giaDon >= 0),
    soLuongTon INT DEFAULT 0 CHECK (soLuongTon >= 0),
    hanSuDung DATE NULL,
    trangThai VARCHAR(30) DEFAULT 'Còn hàng',
    maNCC VARCHAR(20) NULL, -- reference only to user-service (NHA_CUNG_CAP)
    ngayTao TIMESTAMP DEFAULT NOW(),
    ngayCapNhat TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sanpham_hansudung ON SAN_PHAM(hanSuDung);
CREATE INDEX IF NOT EXISTS idx_sanpham_madanhmuc ON SAN_PHAM(maDanhMuc);
CREATE INDEX IF NOT EXISTS idx_sanpham_trangthai ON SAN_PHAM(trangThai);

-- Trigger for updating ngayCapNhat
CREATE OR REPLACE FUNCTION update_ngaycapnhat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngayCapNhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_sanpham_ngaycapnhat
BEFORE UPDATE ON SAN_PHAM
FOR EACH ROW
EXECUTE FUNCTION update_ngaycapnhat_column();

-- View for products expiring within 30 days
CREATE OR REPLACE VIEW view_sanpham_sap_het_han AS
SELECT 
    maSanpham,
    tenSanpham,
    maDanhMuc,
    soLuongTon,
    hanSuDung,
    (hanSuDung - CURRENT_DATE) AS soNgayConLai
FROM 
    SAN_PHAM
WHERE 
    hanSuDung IS NOT NULL 
    AND hanSuDung <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY 
    hanSuDung ASC;
