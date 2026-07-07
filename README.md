🏪 Vua Đặc Sản — Hệ thống Microservice
> Tài liệu này chứa **prompt chi tiết cho từng bước** xây dựng dự án từ đầu đến cuối.
> Copy prompt vào Claude (hoặc Cursor / GitHub Copilot) để nhận code cụ thể ngay lập tức.
---
📋 Thông tin dự án
Mục	Chi tiết
Tên hệ thống	Vua Đặc Sản — Giới thiệu và bán đặc sản ba miền
Kiến trúc	Microservice
Backend	Node.js + Express.js
Frontend	React.js (Vite)
Database	PostgreSQL (mỗi service một DB riêng)
Cache	Redis
Message Queue	RabbitMQ
Container	Docker + Docker Compose
API Gateway	Nginx
Auth	JWT (Access Token + Refresh Token)
---
🗂️ Danh sách Microservice
Service	Port	Database	Chức năng
`auth-service`	8001	`auth_db`	Đăng nhập, phân quyền, JWT
`user-service`	8002	`user_db`	Nhân viên, nhà cung cấp, phân quyền
`product-service`	8003	`product_db`	Hàng hóa, danh mục, hạn sử dụng
`order-service`	8004	`order_db`	Đơn hàng, giỏ hàng, hóa đơn, khách hàng
`warehouse-service`	8005	`warehouse_db`	Phiếu nhập/xuất kho
`finance-service`	8006	`finance_db`	Bảng lương, quyết toán, thống kê
`content-service`	8007	`content_db`	Bài viết, bình luận, yêu cầu CSKH
`notification-service`	8008	—	OTP email, cảnh báo hạn sử dụng
`api-gateway`	80	—	Nginx routing, auth middleware
`frontend`	3000	—	React.js SPA
---
🚀 Hướng dẫn sử dụng Prompt
Mỗi mục bên dưới là một prompt độc lập.
Copy nguyên văn vào Claude/AI để nhận code hoàn chỉnh.
---
BƯỚC 1 — Cài đặt môi trường & Cấu trúc dự án
Prompt 1.1 — Khởi tạo cấu trúc thư mục toàn bộ dự án
```
Tạo cho tôi cấu trúc thư mục đầy đủ cho dự án microservice "Vua Đặc Sản" bao gồm:

- Monorepo chứa 8 service: auth-service, user-service, product-service, order-service, warehouse-service, finance-service, content-service, notification-service
- Mỗi service có cấu trúc: src/controllers, src/routes, src/models, src/middlewares, src/services, src/config
- Thư mục api-gateway chứa nginx.conf
- Thư mục frontend (React Vite)
- File docker-compose.yml ở root
- File .env.example ở root và mỗi service
- File .gitignore

Liệt kê toàn bộ cây thư mục và tạo các file cơ bản (package.json, Dockerfile, index.js) cho mỗi service bằng Node.js + Express.
```
Prompt 1.2 — File docker-compose.yml hoàn chỉnh
```
Viết file docker-compose.yml đầy đủ cho dự án microservice "Vua Đặc Sản" gồm các service sau:

Services ứng dụng (mỗi cái một Dockerfile riêng):
- auth-service (port 8001)
- user-service (port 8002)
- product-service (port 8003)
- order-service (port 8004)
- warehouse-service (port 8005)
- finance-service (port 8006)
- content-service (port 8007)
- notification-service (port 8008)
- api-gateway Nginx (port 80)
- frontend React (port 3000)

Services hạ tầng:
- postgres-auth (DB riêng cho auth-service, port 5433)
- postgres-user (DB riêng cho user-service, port 5434)
- postgres-product (DB riêng cho product-service, port 5435)
- postgres-order (DB riêng cho order-service, port 5436)
- postgres-warehouse (DB riêng cho warehouse-service, port 5437)
- postgres-finance (DB riêng cho finance-service, port 5438)
- postgres-content (DB riêng cho content-service, port 5439)
- redis (port 6379)
- rabbitmq (port 5672, management UI port 15672)

Yêu cầu:
- Mỗi app service phụ thuộc (depends_on) vào DB của nó và rabbitmq
- Có volume cho tất cả DB để data không bị mất khi restart
- Có network chung "vua-dac-san-network"
- Biến môi trường đọc từ file .env
- Thêm healthcheck cho PostgreSQL và RabbitMQ
```
Prompt 1.3 — Cấu hình Nginx API Gateway
```
Viết file nginx.conf cho API Gateway của dự án microservice "Vua Đặc Sản".

Yêu cầu routing:
- /api/auth/* → auth-service:8001
- /api/users/* → user-service:8002
- /api/products/* → product-service:8003
- /api/orders/* → order-service:8004
- /api/warehouse/* → warehouse-service:8005
- /api/finance/* → finance-service:8006
- /api/content/* → content-service:8007
- /api/notifications/* → notification-service:8008
- /* → frontend:3000 (serve React SPA)

Yêu cầu kỹ thuật:
- Cấu hình CORS header cho phép frontend gọi API
- Rate limiting: 100 request/phút mỗi IP
- Timeout: proxy_read_timeout 60s
- Gzip compression cho response
- Log format JSON để dễ parse
- Kích thước body tối đa 10MB (cho upload ảnh)
```
---
BƯỚC 2 — Database Schema
Prompt 2.1 — Schema cho auth-service
```
Viết SQL migration file cho auth-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng sau:

1. Bảng TAI_KHOAN:
   - tenDangnhap VARCHAR(50) PRIMARY KEY
   - matKhau VARCHAR(255) NOT NULL (bcrypt hash)
   - vaiTro VARCHAR(20) — 'QUAN_LY', 'BAN_HANG', 'KHO', 'KE_TOAN', 'CSKH', 'KHACH_HANG'
   - trangThai INT DEFAULT 1 — 1: active, 0: locked
   - lanDangNhapSai INT DEFAULT 0
   - thoiGianKhoa TIMESTAMP NULL
   - ngayTao TIMESTAMP DEFAULT NOW()
   - buocDauDoiMatKhau BOOLEAN DEFAULT TRUE

2. Bảng PHAN_QUYEN (bảng phân quyền nhiều role cho một nhân viên):
   - maNhanVien VARCHAR(20)
   - vaiTro VARCHAR(20)
   - ngayGan TIMESTAMP DEFAULT NOW()
   - PRIMARY KEY (maNhanVien, vaiTro)

3. Bảng REFRESH_TOKEN:
   - id SERIAL PRIMARY KEY
   - token TEXT UNIQUE NOT NULL
   - tenDangnhap VARCHAR(50) REFERENCES TAI_KHOAN
   - ngayHetHan TIMESTAMP NOT NULL
   - daRevoke BOOLEAN DEFAULT FALSE

Thêm indexes phù hợp cho các cột thường query.
Viết thêm file seed.sql tạo tài khoản admin mặc định (username: admin, password: Admin@123456).
```
Prompt 2.2 — Schema cho user-service
```
Viết SQL migration file cho user-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. NHAN_VIEN:
   - maNhanVien VARCHAR(20) PRIMARY KEY (format: NV001, NV002,...)
   - hoTen NVARCHAR(100) NOT NULL
   - ngaySinh DATE
   - cccd VARCHAR(12) UNIQUE
   - sdt VARCHAR(15) UNIQUE NOT NULL
   - email VARCHAR(100) UNIQUE NOT NULL
   - chucVu NVARCHAR(50)
   - tenDangnhap VARCHAR(50) UNIQUE (FK sang auth-service — chỉ lưu reference, không join thật)
   - trangThai INT DEFAULT 1 — 1: active, 0: locked
   - ngayTao TIMESTAMP DEFAULT NOW()

2. LICH_LAMNVIEC:
   - maLich SERIAL PRIMARY KEY
   - maNhanVien VARCHAR(20) REFERENCES NHAN_VIEN
   - ngayLam DATE NOT NULL
   - caLam VARCHAR(20) — 'SANG', 'CHIEU', 'TOI'
   - nhiemVu NVARCHAR(255)

3. LICH_SU_HOATDONG (audit log):
   - maLog SERIAL PRIMARY KEY
   - thoiGian TIMESTAMP DEFAULT NOW()
   - maNhanVien VARCHAR(20) REFERENCES NHAN_VIEN
   - phanHe NVARCHAR(50)
   - thaoTac NVARCHAR(50)
   - chiTietThayDoi TEXT — JSON format

4. NHA_CUNG_CAP:
   - maNCC VARCHAR(20) PRIMARY KEY
   - tenNCC NVARCHAR(100) NOT NULL
   - sdt VARCHAR(15) UNIQUE NOT NULL
   - email VARCHAR(100) UNIQUE
   - diaChi NVARCHAR(255)
   - trangThai NVARCHAR(30) DEFAULT 'Đang hợp tác'

Thêm indexes và constraints phù hợp.
```
Prompt 2.3 — Schema cho product-service
```
Viết SQL migration file cho product-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. DANH_MUC_SP (danh mục sản phẩm theo vùng miền):
   - maDanhMuc VARCHAR(20) PRIMARY KEY
   - tenDanhMuc NVARCHAR(100) NOT NULL
   - moTa TEXT
   - vungMien VARCHAR(10) — 'BAC', 'TRUNG', 'NAM'
   - trangThai BOOLEAN DEFAULT TRUE

2. SAN_PHAM:
   - maSanpham VARCHAR(20) PRIMARY KEY
   - tenSanpham NVARCHAR(150) NOT NULL
   - maDanhMuc VARCHAR(20) REFERENCES DANH_MUC_SP
   - hinhAnh VARCHAR(255)
   - motaSanpham TEXT
   - donViTinh NVARCHAR(20)
   - giaDon DECIMAL(18,2) NOT NULL
   - soLuongTon INT DEFAULT 0
   - hanSuDung DATE
   - trangThai NVARCHAR(30) DEFAULT 'Còn hàng'
   - maNCC VARCHAR(20) — reference sang user-service (lưu ID thôi)
   - ngayTao TIMESTAMP DEFAULT NOW()
   - ngayCapNhat TIMESTAMP DEFAULT NOW()

Thêm:
- Index trên hanSuDung để query cảnh báo hạn sử dụng nhanh
- Index trên maDanhMuc để filter theo vùng miền nhanh
- Trigger tự động cập nhật ngayCapNhat khi UPDATE
- Function/View hiển thị sản phẩm sắp hết hạn (trong vòng 30 ngày)
```
Prompt 2.4 — Schema cho order-service
```
Viết SQL migration file cho order-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. KHACH_HANG:
   - maKhachHang VARCHAR(20) PRIMARY KEY
   - hoTen NVARCHAR(100) NOT NULL
   - sdt VARCHAR(15) UNIQUE NOT NULL
   - email VARCHAR(100) UNIQUE
   - ngaySinh DATE
   - trangThai INT DEFAULT 1
   - tenDangnhap VARCHAR(50) UNIQUE (reference sang auth-service)
   - ngayTao TIMESTAMP DEFAULT NOW()

2. DIA_CHI_KH:
   - maDiaChi SERIAL PRIMARY KEY
   - maKhachHang VARCHAR(20) REFERENCES KHACH_HANG
   - diaChiChiTiet NVARCHAR(255) NOT NULL
   - laMacDinh BOOLEAN DEFAULT FALSE

3. KHUYEN_MAI:
   - maKhuyenMai VARCHAR(20) PRIMARY KEY
   - loaiMa VARCHAR(20) — 'PHAN_TRAM', 'TRU_TIEN', 'FREESHIP'
   - giaTriGiam DECIMAL(18,2)
   - donToiThieu DECIMAL(18,2) DEFAULT 0
   - ngayBatDau TIMESTAMP
   - ngayKetThuc TIMESTAMP
   - soLuongToiDa INT
   - daSD INT DEFAULT 0

4. HOA_DON (đơn hàng):
   - maHoadon VARCHAR(20) PRIMARY KEY
   - maKhachHang VARCHAR(20) REFERENCES KHACH_HANG
   - maNVBanHang VARCHAR(20) — reference sang user-service
   - maDiaChi INT REFERENCES DIA_CHI_KH
   - ngayTaoHoadon TIMESTAMP DEFAULT NOW()
   - pThucThanhToan VARCHAR(30) — 'COD', 'VNPAY', 'MOMO', 'ZALOPAY', 'QR'
   - maKhuyenMai VARCHAR(20) REFERENCES KHUYEN_MAI NULL
   - tongTienSP DECIMAL(18,2) NOT NULL
   - phiVanChuyen DECIMAL(18,2) DEFAULT 0
   - tongTienTT DECIMAL(18,2) NOT NULL
   - trangThaiTT NVARCHAR(30) DEFAULT 'Chưa thanh toán'
   - trangThaiDH NVARCHAR(30) DEFAULT 'Chờ xác nhận'
   - lyDoHuy NVARCHAR(255) NULL
   - ngayCapNhat TIMESTAMP DEFAULT NOW()

5. CHI_TIET_HOA_DON:
   - maHoadon VARCHAR(20) REFERENCES HOA_DON
   - maSanpham VARCHAR(20) — reference sang product-service
   - soLuong INT NOT NULL CHECK (soLuong > 0)
   - giaBan DECIMAL(18,2) NOT NULL — giá chốt tại thời điểm mua
   - PRIMARY KEY (maHoadon, maSanpham)

6. LICH_SU_DON_HANG:
   - maLichSu SERIAL PRIMARY KEY
   - maHoadon VARCHAR(20) REFERENCES HOA_DON
   - trangThaiCapNhat NVARCHAR(100)
   - ghiChu NVARCHAR(255)
   - thoiGian TIMESTAMP DEFAULT NOW()

Thêm indexes trên trangThaiDH, maKhachHang, maNVBanHang để query nhanh.
```
Prompt 2.5 — Schema cho warehouse-service
```
Viết SQL migration file cho warehouse-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. PHIEU_KHO:
   - maPhieu VARCHAR(20) PRIMARY KEY (format: NK001 nhập kho, XK001 xuất kho)
   - loaiPhieu VARCHAR(10) NOT NULL CHECK (loaiPhieu IN ('NHAP', 'XUAT'))
   - ngayLapPhieu TIMESTAMP DEFAULT NOW()
   - tongTien DECIMAL(18,2)
   - ghiChu NVARCHAR(255)
   - maNVKho VARCHAR(20) — reference sang user-service
   - maNCC VARCHAR(20) — reference sang user-service (chỉ cho phiếu nhập)
   - trangThaiTT NVARCHAR(30) DEFAULT 'Chờ thanh toán'
   - ngayCapNhat TIMESTAMP DEFAULT NOW()

2. CHI_TIET_PHIEU_KHO:
   - maPhieu VARCHAR(20) REFERENCES PHIEU_KHO
   - maSanpham VARCHAR(20) — reference sang product-service
   - soLuong INT NOT NULL CHECK (soLuong > 0)
   - donGia DECIMAL(18,2) NOT NULL
   - hanSuDung DATE — ghi nhận hạn cho lô hàng này
   - PRIMARY KEY (maPhieu, maSanpham)

Sau khi tạo phiếu nhập/xuất thành công, service sẽ:
- Publish event lên RabbitMQ queue 'warehouse.stock.updated' để product-service cập nhật soLuongTon
- Publish event lên RabbitMQ queue 'warehouse.invoice.created' để finance-service nhận thanh toán

Viết thêm stored procedure tính tổng tiền phiếu kho tự động từ chi tiết.
```
Prompt 2.6 — Schema cho finance-service
```
Viết SQL migration file cho finance-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. BANG_LUONG:
   - maBangLuong SERIAL PRIMARY KEY
   - thang INT NOT NULL
   - nam INT NOT NULL
   - luongCoBan DECIMAL(18,2)
   - tongPhuCap DECIMAL(18,2) DEFAULT 0
   - tongKhauTru DECIMAL(18,2) DEFAULT 0
   - tongLuong DECIMAL(18,2) — computed: luongCoBan + tongPhuCap - tongKhauTru
   - maNhanVien VARCHAR(20) — reference sang user-service
   - maNVKeToan VARCHAR(20) — kế toán lập
   - trangThai NVARCHAR(30) DEFAULT 'Chưa chốt'
   - ngayLap TIMESTAMP DEFAULT NOW()
   - UNIQUE (maNhanVien, thang, nam)

2. QUYET_TOAN_CA:
   - maQuyetToan SERIAL PRIMARY KEY
   - ngayQuyetToan DATE NOT NULL
   - caLam VARCHAR(20) — 'SANG', 'CHIEU', 'TOI'
   - doanhThuThucTe DECIMAL(18,2)
   - doanhThuHeThong DECIMAL(18,2)
   - chenhLech DECIMAL(18,2) GENERATED ALWAYS AS (doanhThuThucTe - doanhThuHeThong) STORED
   - ghiChu NVARCHAR(255)
   - maNVBanHang VARCHAR(20)
   - maNVKeToan VARCHAR(20)
   - trangThai NVARCHAR(30) DEFAULT 'Chờ chốt'
   - ngayTao TIMESTAMP DEFAULT NOW()

3. THANH_TOAN_HOA_DON_KHO (theo dõi thanh toán cho nhà cung cấp):
   - maThanhToan SERIAL PRIMARY KEY
   - maPhieuKho VARCHAR(20) — reference sang warehouse-service
   - soTien DECIMAL(18,2) NOT NULL
   - phuongThuc VARCHAR(30)
   - ngayThanhToan TIMESTAMP DEFAULT NOW()
   - maNVKeToan VARCHAR(20)
   - ghiChu NVARCHAR(255)

Viết trigger tự động tính tongLuong khi insert/update BANG_LUONG.
```
Prompt 2.7 — Schema cho content-service
```
Viết SQL migration file cho content-service của dự án "Vua Đặc Sản" dùng PostgreSQL.

Tạo các bảng:

1. DANH_MUC_BAI_VIET:
   - maDanhMucBV VARCHAR(20) PRIMARY KEY
   - tenDanhMuc NVARCHAR(100) NOT NULL
   - trangThai BOOLEAN DEFAULT TRUE

2. BAI_VIET:
   - maBaiviet VARCHAR(20) PRIMARY KEY
   - tieuDe NVARCHAR(255) NOT NULL
   - moTaNgan NVARCHAR(500)
   - noiDung TEXT NOT NULL
   - hinhAnh VARCHAR(255)
   - maDanhMucBV VARCHAR(20) REFERENCES DANH_MUC_BAI_VIET
   - maNVBanHang VARCHAR(20) — reference sang user-service
   - ngayTao TIMESTAMP DEFAULT NOW()
   - ngayCapNhat TIMESTAMP DEFAULT NOW()
   - trangThai NVARCHAR(30) DEFAULT 'Chờ duyệt'
   - luotXem INT DEFAULT 0

3. BINH_LUAN:
   - maBL VARCHAR(20) PRIMARY KEY
   - maKhachHang VARCHAR(20) — reference sang order-service
   - maSanpham VARCHAR(20) — reference sang product-service
   - noiDungBL TEXT NOT NULL
   - danhGia INT CHECK (danhGia BETWEEN 1 AND 5)
   - trangThai NVARCHAR(30) DEFAULT 'Chờ duyệt'
   - maNVCSKH VARCHAR(20) NULL
   - ngayTao TIMESTAMP DEFAULT NOW()

4. YEU_CAU_HO_TRO:
   - maYeuCau VARCHAR(20) PRIMARY KEY
   - loaiYeuCau NVARCHAR(50) — 'Tư vấn', 'Thắc mắc', 'Khiếu nại'
   - maKhachHang VARCHAR(20)
   - maSanpham VARCHAR(20) NULL
   - maHoaDon VARCHAR(20) NULL — để xác minh đơn hàng thật
   - noiDungKH TEXT NOT NULL
   - noiDungPhanHoi TEXT NULL
   - trangThai NVARCHAR(30) DEFAULT 'Chờ xử lý'
   - maNVCSKH VARCHAR(20) NULL
   - ngayTao TIMESTAMP DEFAULT NOW()
   - ngayXuLy TIMESTAMP NULL

Thêm full-text search index trên tieuDe và noiDung của bảng BAI_VIET.
```
---
BƯỚC 3 — Auth Service (Làm đầu tiên)
Prompt 3.1 — Toàn bộ Auth Service
```
Viết hoàn chỉnh auth-service cho dự án "Vua Đặc Sản" bằng Node.js + Express + PostgreSQL.

Cấu trúc file cần tạo:
- src/config/db.js — kết nối PostgreSQL dùng pg pool
- src/config/rabbitmq.js — kết nối RabbitMQ dùng amqplib
- src/models/account.model.js — query CRUD bảng TAI_KHOAN
- src/middlewares/auth.middleware.js — verify JWT token
- src/controllers/auth.controller.js
- src/routes/auth.routes.js
- index.js — khởi động server

Các API endpoint cần implement:
POST /auth/login
  - Input: { email_hoac_sdt, matKhau }
  - Kiểm tra tài khoản tồn tại và mật khẩu (bcrypt)
  - Nếu sai quá 5 lần → khóa tài khoản 30 phút
  - Trả về: { accessToken, refreshToken, user: { tenDangnhap, vaiTro, cacQuyen[] } }
  - accessToken hết hạn sau 15 phút, refreshToken sau 7 ngày

POST /auth/refresh
  - Input: { refreshToken }
  - Verify refreshToken còn hạn và chưa bị revoke
  - Trả về accessToken mới

POST /auth/logout
  - Revoke refreshToken hiện tại

GET /auth/verify
  - Header: Authorization: Bearer <accessToken>
  - Endpoint này dùng cho Nginx (auth_request) hoặc các service khác gọi để verify token
  - Trả về: { valid: true, user: { tenDangnhap, vaiTro, cacQuyen[] } }

POST /auth/change-password
  - Input: { matKhauCu, matKhauMoi }
  - Validate: matKhauMoi >= 8 ký tự, có chữ hoa, chữ thường, số

Yêu cầu bảo mật:
- Dùng bcrypt saltRounds=12 để hash mật khẩu
- JWT_SECRET đọc từ biến môi trường
- Rate limit: 10 request/phút trên endpoint /auth/login
- Log mọi lần đăng nhập thất bại

Viết đầy đủ code cho tất cả file trên.
```
---
BƯỚC 4 — User Service
Prompt 4.1 — Quản lý nhân viên (FR-06, FR-07)
```
Viết user-service cho dự án "Vua Đặc Sản" phần quản lý nhân viên, bằng Node.js + Express + PostgreSQL.

Middleware bắt buộc cho mọi route:
- Gọi GET http://auth-service:8001/auth/verify để xác thực JWT
- Kiểm tra role phù hợp (chỉ QUAN_LY mới được truy cập các route này)

Implement các API sau:

GET /users/employees
  - Query params: page, limit, trangThai, chucVu, search (tên/SĐT/mã)
  - Trả về danh sách nhân viên có phân trang

POST /users/employees
  - Body: { hoTen, sdt, email, chucVu, ngaySinh? }
  - Validate: email unique, sdt unique, format hợp lệ
  - Tự sinh maNhanVien (NV001, NV002,...)
  - Gọi POST http://auth-service:8001/auth/internal/create-account để tạo tài khoản đăng nhập
  - Mật khẩu mặc định: Abc@123456, buocDauDoiMatKhau=true

GET /users/employees/:id
  - Trả về thông tin chi tiết + lịch sử hoạt động gần nhất

PUT /users/employees/:id
  - Cập nhật thông tin (không cho sửa maNhanVien)
  - Kiểm tra trùng sdt/email với nhân viên khác

PUT /users/employees/:id/status
  - Body: { trangThai: 0 | 1 }
  - Khóa/mở tài khoản (không cho xóa cứng)

GET /users/employees/:id/activity-log
  - Trả về lịch sử thao tác của nhân viên

PUT /users/employees/:id/permissions
  - Body: { quyen: ['BAN_HANG', 'KHO', 'KE_TOAN', 'CSKH'] }
  - Gọi auth-service để cập nhật bảng PHAN_QUYEN

GET /users/employees/:id/schedule
  - Nhân viên xem lịch làm việc của chính mình
  - Query params: tuanHienTai=true hoặc tuThu, denThu

Viết đầy đủ controllers, models, routes, và middleware xác thực quyền.
```
Prompt 4.2 — Quản lý nhà cung cấp (FR-05)
```
Viết phần quản lý nhà cung cấp trong user-service cho dự án "Vua Đặc Sản".

Implement các API:

GET /users/suppliers
  - Query params: page, limit, search (tên/mã/SĐT), trangThai
  - Mặc định sắp xếp mới lên đầu

POST /users/suppliers
  - Body: { tenNCC, sdt, email, diaChi }
  - Validate: sdt unique, email unique

GET /users/suppliers/:id
  - Chi tiết nhà cung cấp

PUT /users/suppliers/:id
  - Cập nhật thông tin (vẫn kiểm tra ràng buộc unique)

DELETE /users/suppliers/:id
  - Nếu chưa có giao dịch: xóa thật
  - Nếu đã có phiếu kho: chuyển trangThai = 'Ngừng hợp tác', không xóa thật
  - Kiểm tra bằng cách gọi GET http://warehouse-service:8005/warehouse/suppliers/:id/has-transactions

Tất cả route yêu cầu role QUAN_LY.
Viết đầy đủ code.
```
---
BƯỚC 5 — Product Service
Prompt 5.1 — Quản lý hàng hóa và cảnh báo hạn sử dụng (FR-12, FR-13)
```
Viết hoàn chỉnh product-service cho dự án "Vua Đặc Sản" bằng Node.js + Express + PostgreSQL + RabbitMQ.

Implement các API:

GET /products
  - Query params: page, limit, search, maDanhMuc, vungMien, trangThai
  - Filter theo vùng miền (Bắc/Trung/Nam) cho website khách hàng
  - Trả về danh sách sản phẩm có phân trang

POST /products
  - Body: { tenSanpham, maDanhMuc, giaDon, donViTinh, hanSuDung, maNCC, motaSanpham, hinhAnh? }
  - Tự sinh maSanpham
  - Yêu cầu role KHO

GET /products/:id
  - Chi tiết sản phẩm

PUT /products/:id
  - Cập nhật thông tin sản phẩm
  - Yêu cầu role KHO

DELETE /products/:id
  - Chỉ xóa được nếu soLuongTon = 0 và không có đơn hàng đang xử lý

GET /products/expiry-warning
  - Trả về danh sách hàng sắp hết hạn (trong 30 ngày) và đã hết hạn
  - Yêu cầu role KHO

PATCH /products/:id/stock
  - Internal API (chỉ gọi từ các service khác, không expose ra ngoài)
  - Body: { soLuongThayDoi: -5 } (âm = trừ, dương = cộng)
  - Dùng transaction để đảm bảo không âm tồn kho

GET /products/categories
  - Danh mục sản phẩm theo vùng miền

RabbitMQ Consumer:
  - Lắng nghe queue 'warehouse.stock.updated'
  - Khi nhận event, cập nhật soLuongTon cho sản phẩm

Cron job (chạy mỗi ngày lúc 7:00 sáng):
  - Quét sản phẩm hanSuDung <= NOW() + 30 days
  - Publish event lên queue 'product.expiry.warning' với danh sách sản phẩm cần xử lý
  - Notification service sẽ lắng nghe event này và gửi email cảnh báo

Viết đầy đủ code bao gồm cả cron job với thư viện node-cron.
```
---
BƯỚC 6 — Order Service
Prompt 6.1 — Quản lý đơn hàng (FR-10)
```
Viết order-service cho dự án "Vua Đặc Sản", phần quản lý đơn hàng, bằng Node.js + Express + PostgreSQL.

Implement các API:

GET /orders
  - Query params: page, limit, trangThaiDH, search (mã đơn/tên KH), tuNgay, denNgay
  - Role BAN_HANG xem đơn của mình, QUAN_LY xem tất cả

POST /orders
  - Body: {
      maKhachHang,
      maDiaChi,
      sanPham: [{ maSanpham, soLuong }],
      maKhuyenMai?,
      pThucThanhToan
    }
  - Validate:
    + Sản phẩm còn hàng: gọi GET http://product-service:8003/products/:id để check soLuongTon
    + Tính tổng tiền tự động
    + Áp dụng mã giảm giá nếu có (kiểm tra điều kiện donToiThieu, ngayKetThuc, soLuongToiDa)
  - Sau khi tạo thành công:
    + Gọi PATCH http://product-service:8003/products/:id/stock để trừ tồn kho (dùng Promise.all)
    + Lưu LICH_SU_DON_HANG với trạng thái 'Chờ xác nhận'
  - Tự sinh maHoadon (format: HD20240001)
  - Yêu cầu role BAN_HANG hoặc KHACH_HANG (mua online)

GET /orders/:id
  - Chi tiết đơn hàng kèm danh sách sản phẩm

PATCH /orders/:id/status
  - Body: { trangThaiMoi, ghiChu? }
  - Luồng trạng thái: Chờ xác nhận → Đã xác nhận → Bàn giao vận chuyển → Đang giao → Giao thành công / Giao thất bại
  - Không cho update nếu đã ở trạng thái cuối (Giao thành công / Đã hủy)
  - Lưu lịch sử thay đổi trạng thái

DELETE /orders/:id/cancel
  - Body: { lyDoHuy }
  - Chỉ hủy được khi chưa 'Bàn giao vận chuyển'
  - Sau khi hủy: hoàn tồn kho bằng cách gọi PATCH /products/:id/stock với số dương

GET /orders/:id/invoice
  - Tạo và trả về file PDF hóa đơn
  - Nội dung: mã đơn, thông tin KH, danh sách SP, đơn giá, tổng tiền, ngày lập
  - Dùng thư viện pdfkit hoặc puppeteer

Xử lý lỗi quan trọng:
  - Nếu trừ tồn kho thất bại sau khi đã tạo đơn → rollback đơn hàng
  - Dùng database transaction cho toàn bộ quá trình tạo đơn

Viết đầy đủ code.
```
Prompt 6.2 — Quản lý khách hàng (FR-11)
```
Viết phần quản lý khách hàng trong order-service cho dự án "Vua Đặc Sản".

Implement các API:

GET /customers
  - Query params: page, limit, search (tên/SĐT/email)
  - Sắp xếp theo ngày đăng ký mới nhất

POST /customers
  - Body: { hoTen, sdt, email, ngaySinh?, diaChi? }
  - Validate unique sdt và email
  - Yêu cầu role BAN_HANG

GET /customers/:id
  - Chi tiết khách hàng

GET /customers/:id/orders
  - Lịch sử mua hàng: danh sách đơn hàng, lọc được theo khoảng thời gian
  - Trả về: maHoadon, ngayMua, tongTienTT, trangThaiDH, danhSachSP

DELETE /customers/:id
  - Chỉ xóa nếu chưa có đơn hàng nào
  - Nếu đã có đơn: trả về lỗi và gợi ý chuyển trangThai = 0 (Không hoạt động)

PUT /customers/:id
  - Cập nhật thông tin (validate unique)

POST /customers/register (PUBLIC — không cần JWT)
  - Khách hàng tự đăng ký tài khoản online
  - Body: { hoTen, sdt, email, matKhau }
  - Gọi notification-service để gửi OTP qua email
  - Tài khoản ở trạng thái 'Chờ xác thực' cho đến khi nhập OTP đúng

POST /customers/verify-otp (PUBLIC)
  - Body: { email, otp }
  - Verify OTP, kích hoạt tài khoản khách hàng

Viết đầy đủ code.
```
---
BƯỚC 7 — Warehouse Service
Prompt 7.1 — Quản lý hóa đơn kho (FR-14)
```
Viết hoàn chỉnh warehouse-service cho dự án "Vua Đặc Sản" bằng Node.js + Express + PostgreSQL + RabbitMQ.

Implement các API:

GET /warehouse/invoices
  - Query params: page, limit, loaiPhieu ('NHAP'/'XUAT'), trangThaiTT, tuNgay, denNgay
  - Yêu cầu role KHO

POST /warehouse/invoices/import (Tạo phiếu nhập kho)
  - Body: {
      maNCC,
      ghiChu?,
      chiTiet: [{ maSanpham, soLuong, donGia, hanSuDung }]
    }
  - Tự sinh maPhieu (format: NK20240001)
  - Tính tongTien = SUM(soLuong * donGia)
  - Sau khi lưu thành công:
    + Publish event 'warehouse.stock.updated' → product-service cộng soLuongTon
    + Publish event 'warehouse.invoice.created' → finance-service nhận để thanh toán

POST /warehouse/invoices/export (Tạo phiếu xuất kho)
  - Body: {
      ghiChu?,
      chiTiet: [{ maSanpham, soLuong, donGia }]
    }
  - Validate: kiểm tra soLuongTon đủ trước khi xuất
  - Publish event 'warehouse.stock.updated' với số âm

GET /warehouse/invoices/:id
  - Chi tiết phiếu kho kèm danh sách hàng hóa

PUT /warehouse/invoices/:id
  - Chỉ update được phiếu ở trạng thái 'Chờ thanh toán'

DELETE /warehouse/invoices/:id
  - Chỉ xóa được phiếu 'Chờ thanh toán'
  - Rollback: cộng lại tồn kho nếu là phiếu nhập đã cập nhật stock

GET /warehouse/suppliers/:id/has-transactions
  - Internal API: kiểm tra NCC có phiếu kho không (dùng bởi user-service)

RabbitMQ Publisher:
  - Setup channel và declare queues khi khởi động
  - Hàm publishStockUpdate(maSanpham, soLuongThayDoi, loaiPhieu)
  - Hàm publishInvoiceCreated(maPhieu, tongTien, maNCC)

Viết đầy đủ code bao gồm xử lý lỗi khi RabbitMQ không available (retry mechanism).
```
---
BƯỚC 8 — Finance Service
Prompt 8.1 — Kế toán, bảng lương, quyết toán (FR-17, FR-18, FR-19, FR-20)
```
Viết hoàn chỉnh finance-service cho dự án "Vua Đặc Sản" bằng Node.js + Express + PostgreSQL + RabbitMQ.

RabbitMQ Consumer (khởi động cùng service):
  - Lắng nghe queue 'warehouse.invoice.created'
  - Tự động tạo bản ghi THANH_TOAN_HOA_DON_KHO với trạng thái 'Chờ thanh toán'
  - Lắng nghe queue 'order.completed' từ order-service để ghi nhận doanh thu

Implement các API:

--- Bảng lương ---
GET /finance/payroll
  - Query params: thang, nam, maNhanVien
  - Yêu cầu role KE_TOAN

POST /finance/payroll
  - Body: { maNhanVien, thang, nam, luongCoBan, tongPhuCap?, tongKhauTru? }
  - Tự tính tongLuong
  - Yêu cầu role KE_TOAN

PUT /finance/payroll/:id/confirm
  - Chốt bảng lương (trangThai = 'Đã chốt')

--- Quyết toán ca ---
POST /finance/shift-settlement
  - Body: { ngayQuyetToan, caLam, doanhThuThucTe, maNVBanHang, ghiChu? }
  - Hệ thống tự lấy doanhThuHeThong bằng cách gọi GET http://order-service:8004/orders/revenue?ngay=...&ca=...&maNV=...
  - Tính chênh lệch
  - Yêu cầu role KE_TOAN

GET /finance/shift-settlement
  - Danh sách quyết toán có filter

--- Thống kê ---
GET /finance/statistics/revenue
  - Query params: loai ('NGAY'/'TUAN'/'THANG'/'NAM'), tuNgay, denNgay
  - Gọi order-service để lấy dữ liệu doanh thu
  - Trả về dữ liệu dạng series cho biểu đồ

GET /finance/statistics/export
  - Query params: loai, tuNgay, denNgay
  - Xuất Excel với thư viện exceljs
  - Sheet 1: Doanh thu theo ngày
  - Sheet 2: Top sản phẩm bán chạy
  - Sheet 3: Bảng lương tháng
  - Trả về file .xlsx

--- Thanh toán hóa đơn kho ---
GET /finance/warehouse-payments
  - Danh sách phiếu kho chờ thanh toán

PUT /finance/warehouse-payments/:id/pay
  - Body: { phuongThuc, ghiChu? }
  - Cập nhật trangThaiTT = 'Đã thanh toán'
  - Notify warehouse-service cập nhật lại trạng thái phiếu

Viết đầy đủ code.
```
---
BƯỚC 9 — Content Service
Prompt 9.1 — Bài viết, bình luận, CSKH (FR-09, FR-15, FR-16)
```
Viết hoàn chỉnh content-service cho dự án "Vua Đặc Sản" bằng Node.js + Express + PostgreSQL.

Implement các API:

--- Bài viết ---
GET /content/posts (PUBLIC)
  - Chỉ trả về bài trangThai = 'Công khai'
  - Query params: page, limit, maDanhMucBV, search
  - Sắp xếp mới nhất lên đầu

GET /content/posts/manage (Nội bộ)
  - Trả về tất cả bài kể cả 'Chờ duyệt', 'Ẩn'
  - Yêu cầu role BAN_HANG hoặc QUAN_LY

POST /content/posts
  - Body: { tieuDe, moTaNgan, noiDung, hinhAnh?, maDanhMucBV }
  - trangThai mặc định 'Chờ duyệt'
  - Yêu cầu role BAN_HANG

PUT /content/posts/:id
  - Nhân viên chỉ sửa được bài của mình ở trạng thái 'Chờ duyệt'
  - QUAN_LY sửa được tất cả

PATCH /content/posts/:id/status
  - Body: { trangThai: 'Công khai' | 'Ẩn' | 'Chờ duyệt' }
  - Chỉ QUAN_LY được duyệt (chuyển sang 'Công khai')

DELETE /content/posts/:id
  - Chỉ xóa được bài 'Chờ duyệt' hoặc 'Ẩn'

--- Bình luận ---
GET /content/comments/pending
  - Danh sách bình luận 'Chờ duyệt'
  - Yêu cầu role CSKH

PATCH /content/comments/:id/approve
  - Duyệt bình luận (trangThai = 'Đã duyệt')

PATCH /content/comments/:id/hide
  - Ẩn bình luận

POST /content/comments (PUBLIC — khách hàng gửi)
  - Body: { maKhachHang, maSanpham, noiDungBL, danhGia }
  - trangThai mặc định 'Chờ duyệt'

--- Yêu cầu hỗ trợ ---
GET /content/support-requests
  - Query params: trangThai, loaiYeuCau
  - Yêu cầu role CSKH

POST /content/support-requests (PUBLIC)
  - Khách gửi yêu cầu hỗ trợ
  - Body: { loaiYeuCau, maKhachHang, maSanpham?, maHoaDon?, noiDungKH }

PUT /content/support-requests/:id/reply
  - Body: { noiDungPhanHoi }
  - Trước khi trả lời khiếu nại: gọi GET http://order-service:8004/orders?maKH=...&maHD=... để xác minh đơn hàng
  - Yêu cầu role CSKH

Viết đầy đủ code.
```
---
BƯỚC 10 — Notification Service
Prompt 10.1 — Gửi OTP và cảnh báo hạn sử dụng
```
Viết hoàn chỉnh notification-service cho dự án "Vua Đặc Sản" bằng Node.js + RabbitMQ + Nodemailer.

Service này KHÔNG có REST API public, chỉ lắng nghe events từ RabbitMQ và gửi thông báo.

Setup Nodemailer:
  - Dùng Gmail SMTP hoặc SendGrid
  - Config đọc từ .env: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS

Lưu trữ OTP:
  - Dùng Redis để lưu OTP với TTL 5 phút
  - Key format: otp:{email} = {otp_6_so}

RabbitMQ Consumers:

1. Queue 'user.otp.requested':
  - Nhận: { email, hoTen }
  - Sinh OTP 6 số ngẫu nhiên
  - Lưu vào Redis với TTL 5 phút
  - Gửi email với template HTML đẹp:
    + Tiêu đề: "Mã xác thực Vua Đặc Sản"
    + Nội dung: "Xin chào [hoTen], mã OTP của bạn là: [OTP]. Hết hạn sau 5 phút."

2. Queue 'product.expiry.warning':
  - Nhận: { danhSachSanPham: [{ tenSanpham, hanSuDung, soLuongTon, soNgayConLai }] }
  - Gửi email tổng hợp đến địa chỉ admin (ADMIN_EMAIL trong .env)
  - Template HTML dạng bảng liệt kê sản phẩm sắp hết hạn

3. Queue 'employee.account.created':
  - Nhận: { email, hoTen, matKhauMacDinh }
  - Gửi email thông báo tài khoản được tạo kèm mật khẩu mặc định

REST API nội bộ (chỉ các service khác gọi):
POST /notifications/verify-otp
  - Body: { email, otp }
  - Kiểm tra OTP trong Redis
  - Trả về: { valid: true/false }
  - Nếu đúng: xóa OTP khỏi Redis

Viết đầy đủ code bao gồm email templates HTML.
```
---
BƯỚC 11 — Frontend React
Prompt 11.1 — Setup và cấu trúc Frontend
```
Tạo project frontend cho dự án "Vua Đặc Sản" bằng React + Vite + TypeScript + TailwindCSS.

Cài đặt các thư viện:
- react-router-dom v6 (routing)
- axios (gọi API)
- zustand (state management — lưu JWT và thông tin user)
- react-query (TanStack Query — fetch data + cache)
- recharts (biểu đồ thống kê cho dashboard)
- react-hook-form + zod (form validation)
- react-toastify (notifications)
- @headlessui/react (modal, dropdown)

Tạo cấu trúc thư mục:
src/
  api/          — axios instance và các API functions
  components/   — UI components dùng chung (Button, Modal, Table, Pagination)
  hooks/        — custom hooks
  layouts/      — AdminLayout, CustomerLayout, AuthLayout
  pages/        — các trang (Login, Dashboard, Orders, Products,...)
  store/        — zustand store (auth store)
  types/        — TypeScript types
  utils/        — helper functions

Setup Axios:
  - Base URL = http://localhost/api (qua Nginx gateway)
  - Interceptor tự động thêm Authorization: Bearer {token} vào mọi request
  - Interceptor xử lý 401: tự động gọi /auth/refresh để lấy token mới, retry request gốc
  - Nếu refresh thất bại: logout, redirect về /login

Setup React Router với role-based routing:
  - Route / → CustomerLayout (website mua hàng public)
  - Route /login → AuthLayout
  - Route /admin/* → AdminLayout (yêu cầu đăng nhập, check role)
    + /admin/dashboard (QUAN_LY)
    + /admin/orders (BAN_HANG)
    + /admin/products (KHO)
    + /admin/warehouse (KHO)
    + /admin/customers (BAN_HANG)
    + /admin/posts (BAN_HANG)
    + /admin/support (CSKH)
    + /admin/finance (KE_TOAN)
    + /admin/employees (QUAN_LY)
    + /admin/suppliers (QUAN_LY)

ProtectedRoute component: redirect về /login nếu chưa đăng nhập, redirect 403 nếu không đủ quyền.

Viết đầy đủ code setup.
```
Prompt 11.2 — Trang Dashboard thống kê (FR-08)
```
Viết trang Dashboard cho Admin trong dự án "Vua Đặc Sản" bằng React + Recharts.

Gọi các API:
- GET /api/finance/statistics/revenue?loai=THANG (biểu đồ doanh thu)
- GET /api/products/expiry-warning (cảnh báo hạn sử dụng)
- GET /api/orders?trangThaiDH=Chờ xác nhận&limit=5 (đơn hàng mới)

Layout trang Dashboard gồm:
1. Hàng thẻ KPI (4 thẻ):
   - Tổng doanh thu tháng này
   - Số đơn hàng hôm nay
   - Số sản phẩm sắp hết hạn
   - Số khách hàng mới tháng này

2. Biểu đồ doanh thu (LineChart của Recharts):
   - X-axis: ngày trong tháng
   - Y-axis: doanh thu (VND)
   - Có nút chọn: Tuần này / Tháng này / 3 tháng
   - Nút Export Excel gọi GET /api/finance/statistics/export

3. Bảng đơn hàng mới nhất (5 đơn gần nhất):
   - Cột: Mã đơn, Khách hàng, Tổng tiền, Trạng thái, Ngày tạo
   - Badge màu theo trạng thái

4. Danh sách cảnh báo hạn sử dụng (nếu có):
   - Hiển thị dạng alert đỏ/vàng

Responsive: hiển thị tốt trên màn hình 1280px.
Dùng TailwindCSS cho styling.
Viết đầy đủ component.
```
Prompt 11.3 — Trang quản lý đơn hàng (FR-10)
```
Viết trang quản lý đơn hàng cho Nhân viên bán hàng trong dự án "Vua Đặc Sản" bằng React.

Trang OrdersPage gồm:

1. Header: tiêu đề + nút "Tạo đơn hàng mới"

2. Bộ lọc:
   - Dropdown filter trạng thái: Tất cả / Chờ xác nhận / Đã xác nhận / Đang giao / Giao thành công / Đã hủy
   - Ô tìm kiếm theo mã đơn hoặc tên khách
   - Bộ lọc ngày (DateRangePicker)

3. Bảng đơn hàng (Table component):
   - Cột: Mã đơn | Khách hàng | Tổng tiền | Phương thức TT | Trạng thái | Ngày tạo | Thao tác
   - Badge màu theo trạng thái đơn
   - Phân trang

4. Modal xem chi tiết đơn hàng:
   - Thông tin khách hàng + địa chỉ giao
   - Bảng sản phẩm trong đơn
   - Timeline lịch sử trạng thái
   - Nút cập nhật trạng thái (dropdown)
   - Nút In hóa đơn (gọi /orders/:id/invoice, mở file PDF)
   - Nút Hủy đơn (chỉ hiện khi chưa bàn giao vận chuyển)

5. Modal tạo đơn hàng mới:
   - Bước 1: Chọn khách hàng (search autocomplete, hoặc tạo mới inline)
   - Bước 2: Chọn sản phẩm (search + thêm vào giỏ, hiện số lượng tồn)
   - Bước 3: Xác nhận (địa chỉ giao, phương thức TT, mã giảm giá, tổng tiền)
   - Submit gọi POST /api/orders

Dùng react-query để fetch và invalidate cache sau khi tạo/cập nhật.
Dùng react-hook-form + zod để validate form.
Viết đầy đủ component.
```
Prompt 11.4 — Website bán hàng cho khách hàng (FR-21, FR-22)
```
Viết trang website bán hàng public cho khách hàng trong dự án "Vua Đặc Sản" bằng React.

Các trang cần tạo:

1. Trang chủ (HomePage):
   - Banner hero
   - Lọc sản phẩm theo vùng miền: Tab "Miền Bắc / Miền Trung / Miền Nam"
   - Grid sản phẩm (6 sản phẩm/trang, load more)
   - Section bài viết mới nhất

2. Trang chi tiết sản phẩm:
   - Hình ảnh, tên, giá, mô tả
   - Nút "Thêm vào giỏ hàng"
   - Section bình luận + đánh giá (chỉ hiển thị đã duyệt)
   - Form gửi bình luận (yêu cầu đăng nhập)

3. Giỏ hàng (CartPage):
   - Danh sách sản phẩm trong giỏ
   - Tăng/giảm số lượng, xóa
   - Ô nhập mã giảm giá
   - Tổng tiền
   - Nút "Đặt hàng"

4. Trang đặt hàng (CheckoutPage):
   - Chọn địa chỉ giao hàng (hoặc thêm mới)
   - Chọn phương thức thanh toán (COD, VNPAY, MoMo, ZaloPay)
   - Xác nhận đơn hàng → gọi POST /api/orders

5. Trang đăng ký (RegisterPage — PUBLIC):
   - Form: Họ tên, SĐT, Email, Mật khẩu
   - Sau khi submit → server gửi OTP
   - Chuyển sang bước nhập OTP
   - Nhập OTP đúng → tài khoản kích hoạt → tự động đăng nhập

6. Trang đăng nhập (LoginPage — PUBLIC)

7. Trang đơn hàng của tôi:
   - Lịch sử đơn hàng của khách
   - Xem chi tiết từng đơn

Lưu giỏ hàng trong Zustand store (không cần gọi API, lưu local).
Viết đầy đủ code.
```
---
BƯỚC 12 — Tích hợp thanh toán
Prompt 12.1 — Tích hợp VNPAY
```
Viết module tích hợp thanh toán VNPAY cho order-service của dự án "Vua Đặc Sản" bằng Node.js.

Implement:

POST /orders/:id/payment/vnpay
  - Tạo URL thanh toán VNPAY
  - Params: vnp_TmnCode, vnp_HashSecret từ .env
  - vnp_ReturnUrl = http://localhost/payment/vnpay-return
  - Trả về { paymentUrl } để frontend redirect

GET /payment/vnpay-return (endpoint này expose qua Nginx, không cần auth)
  - VNPAY redirect về đây sau khi thanh toán
  - Verify chữ ký hash
  - Nếu thành công (vnp_ResponseCode = '00'):
    + Cập nhật trangThaiTT = 'Đã thanh toán' cho đơn hàng
    + Redirect về http://localhost/orders/:id?payment=success
  - Nếu thất bại: redirect về http://localhost/orders/:id?payment=failed

Hàm helper createVnpayHash(params, secretKey):
  - Sort params theo alphabet
  - Tạo queryString
  - HMAC-SHA512 với secretKey
  - Trả về hash

Viết đầy đủ code, bao gồm xử lý IPN callback từ VNPAY.
```
---
BƯỚC 13 — Testing
Prompt 13.1 — Viết test cases cho Auth Service
```
Viết unit test và integration test cho auth-service của dự án "Vua Đặc Sản" dùng Jest + Supertest.

Test cases cần viết (dựa trên tài liệu kiểm thử):

--- Unit tests (src/__tests__/auth.unit.test.js) ---
Test hàm hashPassword và comparePassword (bcrypt)
Test hàm generateToken và verifyToken (JWT)
Test hàm validatePassword format (>=8 ký tự, có hoa/thường/số)

--- Integration tests (src/__tests__/auth.integration.test.js) ---

Describe 'POST /auth/login':
  TC_LOGIN_01: Đăng nhập thành công với tài khoản hợp lệ
    → Status 200, có accessToken và refreshToken

  TC_LOGIN_02: Sai mật khẩu
    → Status 401, message 'Sai thông tin đăng nhập'

  TC_LOGIN_03: Bỏ trống email và password
    → Status 400, message validation error

  TC_LOGIN_04: Tài khoản không tồn tại
    → Status 401

  TC_LOGIN_05: Sai mật khẩu 5 lần liên tiếp → tài khoản bị khóa
    → Lần thứ 5: Status 403, message 'Tài khoản đã bị khóa'

Describe 'POST /auth/change-password':
  TC_PASS_01: Đổi mật khẩu thành công
  TC_PASS_02: Mật khẩu mới trùng mật khẩu cũ → lỗi
  TC_PASS_03: Mật khẩu mới không đúng format → lỗi
  TC_PASS_04: Mật khẩu hiện tại sai → lỗi
  TC_PASS_05: Bỏ trống các trường → lỗi

Describe 'GET /auth/verify':
  Test với token hợp lệ → 200
  Test với token hết hạn → 401
  Test không có token → 401

Setup: dùng database test riêng (test_auth_db), seed data trước mỗi test, cleanup sau.
Mock Nodemailer trong tests.
Viết đầy đủ test code.
```
---
BƯỚC 14 — Deploy
Prompt 14.1 — Chuẩn bị deploy lên VPS
```
Hướng dẫn và viết các file cấu hình để deploy dự án "Vua Đặc Sản" lên VPS Ubuntu 22.04.

Tạo các file:

1. docker-compose.prod.yml
   - Giống docker-compose.yml nhưng:
   - Không expose ports của DB và RabbitMQ ra ngoài (chỉ trong docker network nội bộ)
   - Thêm restart: unless-stopped cho tất cả service
   - Build image từ Dockerfile với NODE_ENV=production
   - Nginx expose port 80 và 443

2. .env.production.example
   - Các biến môi trường cần thiết cho production (không có giá trị thật)
   - JWT_SECRET (phải đủ dài và random)
   - DB passwords (mạnh)
   - RABBITMQ credentials
   - MAIL config
   - VNPAY credentials
   - DOMAIN name

3. Dockerfile tối ưu cho production (multi-stage build):
   - Stage 1: builder — npm install + build
   - Stage 2: runner — chỉ copy node_modules production + dist
   - Chạy với user non-root
   - Health check

4. Script deploy.sh:
   - Pull code mới từ git
   - Build images mới
   - docker-compose down → up với zero-downtime (rolling update)
   - Chạy migration database nếu có file mới

5. Nginx config cho production:
   - Redirect HTTP → HTTPS
   - SSL certificate (hỗ trợ Let's Encrypt với Certbot)
   - Gzip, security headers (X-Frame-Options, CSP,...)

6. Hướng dẫn từng bước trên VPS:
   - Cài Docker + Docker Compose
   - Clone repo
   - Tạo file .env từ .env.production.example
   - Lấy SSL cert với Certbot
   - Chạy docker-compose up

Viết đầy đủ tất cả file trên.
```
---
📌 Ghi chú quan trọng khi dùng Prompt
Nguyên tắc giao tiếp với AI hiệu quả
Luôn cung cấp context: Nếu paste prompt, nên thêm "Đây là dự án microservice Node.js + PostgreSQL + Docker, phía trên là các service đã làm trước đó."
Yêu cầu code đầy đủ: Thêm vào cuối mỗi prompt: "Viết đầy đủ tất cả file, không bỏ qua phần nào. Nếu file dài, chia thành nhiều phần."
Debug lỗi: Khi gặp lỗi, paste cả error message + đoạn code liên quan:
```
   Tôi gặp lỗi này khi chạy auth-service:
   [paste error]
   
   Đây là file liên quan:
   [paste code]
   
   Hãy tìm nguyên nhân và fix cho tôi.
   ```
Hỏi từng bước: Không nên hỏi tất cả cùng lúc. Làm xong bước 1 → test → mới sang bước 2.
Yêu cầu giải thích: Thêm "Giải thích ngắn gọn tại sao code hoạt động như vậy" để học được từ code.
---
🔗 Thứ tự làm dự án (Roadmap)
```
Tuần 1-2:   Bước 1 (Cài môi trường) + Bước 2 (Database schema)
Tuần 3:     Bước 3 (Auth Service) + test kỹ
Tuần 4:     Bước 4 (User Service) + Bước 5 (Product Service)
Tuần 5:     Bước 6 (Order Service)
Tuần 6:     Bước 7 (Warehouse) + Bước 8 (Finance) + Bước 10 (Notification)
Tuần 7:     Bước 9 (Content Service)
Tuần 8:     Bước 11 (Frontend — internal)
Tuần 9:     Bước 11 (Frontend — website khách hàng)
Tuần 10:    Bước 12 (Thanh toán) + Bước 13 (Testing)
Tuần 11:    Bước 14 (Deploy)
Tuần 12:    Buffer — fix bug + polish
```
