export const templates = {
  otpTemplate(hoTen, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            margin: 0;
            padding: 0;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            overflow: hidden;
            border-top: 5px solid #d4a373;
          }
          .header {
            background-color: #1a1a1a;
            padding: 25px;
            text-align: center;
          }
          .header h1 {
            color: #d4a373;
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .content {
            padding: 35px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .otp-card {
            background-color: #fdf8f4;
            border: 1px dashed #d4a373;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #c97a34;
            letter-spacing: 5px;
            margin: 0;
          }
          .expiry {
            font-size: 13px;
            color: #666;
            margin-top: 10px;
          }
          .footer {
            background-color: #f7f9fc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VUA ĐẶC SẢN</h1>
          </div>
          <div class="content">
            <div class="greeting">Xin chào ${hoTen || 'Quý khách'},</div>
            <p>Chúng tôi nhận được yêu cầu cung cấp mã xác minh (OTP) để thực hiện giao dịch của bạn trên hệ thống <strong>Vua Đặc Sản</strong>.</p>
            <div class="otp-card">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">MÃ XÁC THỰC CỦA BẠN</p>
              <div class="otp-code">${otp}</div>
              <div class="expiry">Có hiệu lực trong vòng 5 phút (Không chia sẻ mã này cho bất kỳ ai)</div>
            </div>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận CSKH để được hỗ trợ.</p>
          </div>
          <div class="footer">
            &copy; 2026 Vua Đặc Sản - Hệ thống Cung cấp Đặc sản Ba Miền Cao cấp.
          </div>
        </div>
      </body>
      </html>
    `;
  },

  expiryWarningTemplate(danhSachSanPham) {
    const rows = (danhSachSanPham || []).map(item => {
      const remainingDays = parseInt(item.soNgayConLai, 10);
      const isCritical = remainingDays <= 7;
      const statusStyle = isCritical 
        ? 'background-color: #ffe3e3; color: #c0392b; font-weight: bold;' 
        : 'background-color: #fff3cd; color: #d35400;';

      return `
        <tr>
          <td>${item.tenSanpham}</td>
          <td align="center">${new Date(item.hanSuDung).toLocaleDateString('vi-VN')}</td>
          <td align="right">${item.soLuongTon}</td>
          <td align="center" style="${statusStyle}">${remainingDays} ngày</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            margin: 0;
            color: #333333;
          }
          .container {
            max-width: 700px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            overflow: hidden;
            border-top: 5px solid #e74c3c;
          }
          .header {
            background-color: #1a1a1a;
            padding: 25px;
            text-align: center;
          }
          .header h1 {
            color: #e74c3c;
            margin: 0;
            font-size: 22px;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #f4f6f8;
            border: 1px solid #dddddd;
            padding: 12px;
            font-weight: 600;
            color: #333;
          }
          td {
            border: 1px solid #dddddd;
            padding: 12px;
            font-size: 14px;
          }
          .footer {
            background-color: #f7f9fc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CẢNH BÁO HẠN SỬ DỤNG SẢN PHẨM</h1>
          </div>
          <div class="content">
            <p>Kính gửi Bộ phận Quản lý Kho / Ban giám đốc,</p>
            <p>Hệ thống Vua Đặc Sản phát hiện các sản phẩm trong kho sắp hết hạn sử dụng. Vui lòng kiểm tra và lên kế hoạch xử lý/khuyến mãi:</p>
            <table>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Hạn sử dụng</th>
                  <th>Số lượng tồn</th>
                  <th>Thời gian còn lại</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <p style="color: #666; font-size: 13px;">* Lưu ý: Các sản phẩm được đánh dấu đỏ còn hạn dưới 7 ngày cần được ưu tiên thanh lý ngay.</p>
          </div>
          <div class="footer">
            &copy; 2026 Vua Đặc Sản - Hệ thống Giám sát & Quản lý Kho Tự động.
          </div>
        </div>
      </body>
      </html>
    `;
  },

  employeeCreatedTemplate(hoTen, email, matKhauMacDinh) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            margin: 0;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            overflow: hidden;
            border-top: 5px solid #d4a373;
          }
          .header {
            background-color: #1a1a1a;
            padding: 25px;
            text-align: center;
          }
          .header h1 {
            color: #d4a373;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 35px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .account-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .account-row {
            margin: 10px 0;
            font-size: 15px;
          }
          .label {
            font-weight: bold;
            color: #666;
            display: inline-block;
            width: 150px;
          }
          .value {
            font-family: monospace;
            color: #333;
            font-weight: bold;
          }
          .footer {
            background-color: #f7f9fc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TÀI KHOẢN NHÂN VIÊN MỚI</h1>
          </div>
          <div class="content">
            <div class="greeting">Chào mừng ${hoTen || 'đồng nghiệp mới'},</div>
            <p>Chào mừng bạn gia nhập đội ngũ nhân sự của <strong>Vua Đặc Sản</strong>. Tài khoản nội bộ của bạn đã được khởi tạo thành công trên hệ thống quản lý ERP.</p>
            <p>Dưới đây là thông tin tài khoản đăng nhập của bạn:</p>
            
            <div class="account-box">
              <div class="account-row">
                <span class="label">Tên đăng nhập (Email):</span>
                <span class="value">${email}</span>
              </div>
              <div class="account-row">
                <span class="label">Mật khẩu mặc định:</span>
                <span class="value">${matKhauMacDinh}</span>
              </div>
            </div>
            
            <p><strong>* Quan trọng:</strong> Nhằm đảm bảo bảo mật thông tin, bạn vui lòng đổi lại mật khẩu ngay trong lần đăng nhập đầu tiên.</p>
          </div>
          <div class="footer">
            &copy; 2026 Vua Đặc Sản - Ban Quản trị Nhân sự & Công nghệ.
          </div>
        </div>
      </body>
      </html>
    `;
  }
};
