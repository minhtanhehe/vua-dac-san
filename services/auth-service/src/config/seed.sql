-- Seed data for auth-service
-- Initial admin account (username: admin, password: Admin@123456)
-- Bcrypt hash with salt rounds = 12: $2b$12$Yr03LSJwDwMunvMIZmgzyuOX.5GBBSdf3F19EeP.gBMSXIdQDJ0Ga

INSERT INTO TAI_KHOAN (tenDangnhap, matKhau, vaiTro, trangThai, buocDauDoiMatKhau)
VALUES ('admin', '$2b$12$Yr03LSJwDwMunvMIZmgzyuOX.5GBBSdf3F19EeP.gBMSXIdQDJ0Ga', 'QUAN_LY', 1, FALSE)
ON CONFLICT (tenDangnhap) DO NOTHING;
