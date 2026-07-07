import amqp from 'amqplib';
import redisClient from './redis.js';
import { sendEmail } from '../utils/mailer.js';
import { templates } from '../utils/templates.js';
import 'dotenv/config';

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@vuadacsan.com';

export async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    console.log('Connected to RabbitMQ in Notification Service');

    // 1. Queue: user.otp.requested
    const otpQueue = 'user.otp.requested';
    await channel.assertQueue(otpQueue, { durable: true });
    channel.consume(otpQueue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received OTP request for email: ${data.email}`);

          const { email, hoTen } = data;
          if (!email) {
            console.error('Email is missing in user.otp.requested payload');
            channel.ack(msg);
            return;
          }

          // Generate 6-digit random OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();

          // Save OTP to Redis with TTL 5 minutes (300 seconds)
          await redisClient.setEx(`otp:${email}`, 300, otp);
          console.log(`[Redis] Stored OTP for ${email} -> ${otp} (TTL 5 mins)`);

          // Send Email
          const htmlContent = templates.otpTemplate(hoTen, otp);
          const textContent = `Xin chào ${hoTen || 'Quý khách'}, mã OTP của bạn là: ${otp}. Hết hạn sau 5 phút.`;

          await sendEmail({
            to: email,
            subject: 'Mã xác thực Vua Đặc Sản',
            html: htmlContent,
            text: textContent
          });

          channel.ack(msg);
        } catch (err) {
          console.error('Error handling user.otp.requested:', err);
          // Requeue message on error
          channel.nack(msg, false, true);
        }
      }
    });

    // 2. Queue: product.expiry.warning
    const expiryQueue = 'product.expiry.warning';
    await channel.assertQueue(expiryQueue, { durable: true });
    channel.consume(expiryQueue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received product expiry warning message`);

          const { danhSachSanPham } = data;
          if (!danhSachSanPham || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
            console.warn('No products in product.expiry.warning payload');
            channel.ack(msg);
            return;
          }

          // Send Email to Admin
          const htmlContent = templates.expiryWarningTemplate(danhSachSanPham);
          const textContent = `Hệ thống cảnh báo có ${danhSachSanPham.length} sản phẩm sắp hết hạn. Vui lòng kiểm tra báo cáo chi tiết trong hòm thư Admin.`;

          await sendEmail({
            to: adminEmail,
            subject: 'Cảnh báo sản phẩm sắp hết hạn - Vua Đặc Sản',
            html: htmlContent,
            text: textContent
          });

          channel.ack(msg);
        } catch (err) {
          console.error('Error handling product.expiry.warning:', err);
          channel.nack(msg, false, true);
        }
      }
    });

    // 3. Queue: employee.account.created
    const employeeQueue = 'employee.account.created';
    await channel.assertQueue(employeeQueue, { durable: true });
    channel.consume(employeeQueue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received employee account creation for email: ${data.email}`);

          const { email, hoTen, matKhauMacDinh } = data;
          if (!email || !matKhauMacDinh) {
            console.error('Email or temporary password missing in employee.account.created payload');
            channel.ack(msg);
            return;
          }

          // Send Welcome Email
          const htmlContent = templates.employeeCreatedTemplate(hoTen, email, matKhauMacDinh);
          const textContent = `Xin chào ${hoTen || 'đồng nghiệp'}, tài khoản nhân viên mới của bạn đã được khởi tạo. Tên đăng nhập: ${email}, Mật khẩu mặc định: ${matKhauMacDinh}.`;

          await sendEmail({
            to: email,
            subject: 'Tài khoản nhân viên mới - Vua Đặc Sản',
            html: htmlContent,
            text: textContent
          });

          channel.ack(msg);
        } catch (err) {
          console.error('Error handling employee.account.created:', err);
          channel.nack(msg, false, true);
        }
      }
    });

  } catch (error) {
    console.error('Failed to connect to RabbitMQ in Notification Service:', error);
    // Retry connection after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
}
