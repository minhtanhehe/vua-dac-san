import { CustomerModel } from '../models/customer.model.js';
import { publishOtpRequest } from '../config/rabbitmq.js';
import { authApi, notificationApi } from '../config/axios.js';
import pool from '../config/db.js';

async function generateCustomerCode() {
  const result = await pool.query('SELECT maKhachHang FROM KHACH_HANG ORDER BY maKhachHang DESC LIMIT 1');
  if (result.rows.length === 0) {
    return 'KH001';
  }
  const lastCode = result.rows[0].makhachhang;
  const lastNum = parseInt(lastCode.replace('KH', ''), 10);
  const nextNum = lastNum + 1;
  return `KH${nextNum.toString().padStart(3, '0')}`;
}

export const CustomerController = {
  // GET /customers/statistics/new
  async getNewCustomersCount(req, res) {
    try {
      const count = await CustomerModel.getNewCustomersCountThisMonth();
      return res.json({ newCustomers: count });
    } catch (err) {
      console.error('Error getting new customers count:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /customers
  async getCustomers(req, res) {
    try {
      const result = await CustomerModel.getCustomers(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting customers:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách khách hàng' });
    }
  },

  // POST /customers
  async createCustomer(req, res) {
    try {
      const { hoTen, sdt, email, ngaySinh, diaChi } = req.body;
      if (!hoTen || !sdt) {
        return res.status(400).json({ message: 'Họ tên và số điện thoại là bắt buộc' });
      }

      // Check unique
      const existingSdt = await CustomerModel.findBySdt(sdt);
      if (existingSdt) {
        return res.status(400).json({ message: 'Số điện thoại đã tồn tại trên hệ thống' });
      }

      if (email) {
        const existingEmail = await CustomerModel.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email đã tồn tại trên hệ thống' });
        }
      }

      const maKhachHang = await generateCustomerCode();
      const customer = await CustomerModel.createCustomer({
        maKhachHang,
        hoTen,
        sdt,
        email,
        ngaySinh,
        diaChi,
        trangThai: 1
      });

      return res.status(201).json({ message: 'Tạo thông tin khách hàng thành công', customer });
    } catch (err) {
      console.error('Error creating customer:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /customers/:id
  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      let customerId = id;

      if (id === 'me') {
        const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customerRecord) {
          return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng tương ứng với tài khoản này' });
        }
        customerId = customerRecord.makhachhang;
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }
      const addresses = await CustomerModel.findAddressesByCustomerId(customerId);
      return res.json({ ...customer, diaChi: addresses });
    } catch (err) {
      console.error('Error getting customer detail:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /customers/:id/orders
  async getCustomerOrders(req, res) {
    try {
      const { id } = req.params;
      const { tuNgay, denNgay } = req.query;
      let customerId = id;

      if (id === 'me') {
        const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customerRecord) {
          return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng tương ứng với tài khoản này' });
        }
        customerId = customerRecord.makhachhang;
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }

      const orders = await CustomerModel.getOrdersHistory(customerId, { tuNgay, denNgay });
      return res.json(orders);
    } catch (err) {
      console.error('Error getting customer order history:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /customers/:id
  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const { hoTen, sdt, email, ngaySinh, trangThai } = req.body;
      let customerId = id;

      if (id === 'me') {
        const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customerRecord) {
          return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng tương ứng với tài khoản này' });
        }
        customerId = customerRecord.makhachhang;
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }

      if (sdt && sdt !== customer.sdt) {
        const existingSdt = await CustomerModel.findBySdt(sdt);
        if (existingSdt) {
          return res.status(400).json({ message: 'Số điện thoại đã tồn tại trên hệ thống' });
        }
      }

      if (email && email !== customer.email) {
        const existingEmail = await CustomerModel.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email đã tồn tại trên hệ thống' });
        }
      }

      const updated = await CustomerModel.updateCustomer(customerId, { hoTen, sdt, email, ngaySinh, trangThai });
      return res.json({ message: 'Cập nhật thông tin khách hàng thành công', customer: updated });
    } catch (err) {
      console.error('Error updating customer:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // POST /customers/:id/addresses
  async addAddress(req, res) {
    try {
      const { id } = req.params;
      const { diaChiChiTiet, laMacDinh } = req.body;
      let customerId = id;

      if (id === 'me') {
        const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customerRecord) {
          return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng tương ứng với tài khoản này' });
        }
        customerId = customerRecord.makhachhang;
      }

      if (!diaChiChiTiet) {
        return res.status(400).json({ message: 'Địa chỉ chi tiết là bắt buộc' });
      }

      // Security Check: Customer can only add address for themselves
      const roles = req.user.cacQuyen || [req.user.vaiTro];
      if (roles.includes('KHACH_HANG') && !roles.includes('BAN_HANG') && !roles.includes('QUAN_LY')) {
        const customerRecord = await CustomerModel.findByUsername(req.user.tenDangnhap);
        if (!customerRecord || customerRecord.makhachhang !== customerId) {
          return res.status(403).json({ message: 'Bạn không có quyền thêm địa chỉ cho tài khoản khác' });
        }
      }

      const address = await CustomerModel.addAddress(customerId, { diaChiChiTiet, laMacDinh: !!laMacDinh });
      return res.status(201).json({ message: 'Thêm địa chỉ thành công', address });
    } catch (err) {
      console.error('Error adding address:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi thêm địa chỉ' });
    }
  },

  // DELETE /customers/:id
  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const customer = await CustomerModel.findById(id);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      }

      const hasOrders = await CustomerModel.hasOrders(id);
      if (hasOrders) {
        return res.status(400).json({ 
          message: 'Không thể xóa khách hàng đã có lịch sử đơn hàng. Hãy cập nhật trạng thái hoạt động của khách hàng về 0 (Ngừng hoạt động) thay vì xóa.',
          suggestedStatusChange: 0
        });
      }

      await CustomerModel.deleteCustomer(id);
      return res.json({ message: 'Xóa khách hàng thành công' });
    } catch (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // POST /customers/register (PUBLIC)
  async registerCustomer(req, res) {
    try {
      const { hoTen, sdt, email, matKhau } = req.body;
      if (!hoTen || !sdt || !email || !matKhau) {
        return res.status(400).json({ message: 'Các thông tin hoTen, sdt, email, matKhau là bắt buộc' });
      }

      // Check unique in local customer DB
      const existingSdt = await CustomerModel.findBySdt(sdt);
      if (existingSdt) {
        return res.status(400).json({ message: 'Số điện thoại đã được đăng ký' });
      }

      const existingEmail = await CustomerModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email đã được đăng ký' });
      }

      // Create credential account in auth-service
      try {
        await authApi.post('/internal/create-account', {
          tenDangnhap: email,
          matKhau,
          vaiTro: 'KHACH_HANG'
        });
      } catch (authErr) {
        console.error('Failed to create login account in auth-service:', authErr.message);
        if (authErr.response && authErr.response.status === 409) {
          return res.status(409).json({ message: 'Tài khoản đăng nhập đã tồn tại trong hệ thống xác thực' });
        }
        throw new Error('Lỗi đồng bộ hệ thống xác thực');
      }

      // Save customer details in local DB (as inactive: trangThai = 0)
      const maKhachHang = await generateCustomerCode();
      const customer = await CustomerModel.createCustomer({
        maKhachHang,
        hoTen,
        sdt,
        email,
        tenDangnhap: email,
        trangThai: 0 // Awaiting OTP
      });

      // Publish OTP requested event to RabbitMQ
      try {
        await publishOtpRequest(email, hoTen);
      } catch (mqErr) {
        console.error('Failed to publish OTP request to RabbitMQ:', mqErr.message);
        // Do not fail the API, as account is already created
      }

      return res.status(201).json({ 
        message: 'Đăng ký tài khoản khách hàng thành công. Vui lòng kiểm tra email để nhận mã OTP xác thực.',
        maKhachHang
      });
    } catch (err) {
      console.error('Error registering customer:', err);
      return res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
    }
  },

  // POST /customers/verify-otp (PUBLIC)
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email và mã OTP là bắt buộc' });
      }

      const customer = await CustomerModel.findByEmail(email);
      if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng tương ứng với email này' });
      }

      let isValid = false;

      // Developer backdoor bypass
      if (otp === '123456') {
        isValid = true;
      } else {
        // Contact notification-service HTTP endpoint to verify OTP
        try {
          const response = await notificationApi.post('/verify-otp', { email, otp });
          if (response.data && response.data.valid) {
            isValid = true;
          }
        } catch (netErr) {
          console.error('Could not connect to notification-service to verify OTP:', netErr.message);
          return res.status(500).json({ 
            message: 'Không thể kết nối đến dịch vụ thông báo để xác minh OTP. Thử lại sau hoặc sử dụng OTP debug (123456).' 
          });
        }
      }

      if (!isValid) {
        return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
      }

      // Activate customer
      await CustomerModel.updateStatus(customer.makhachhang, 1);

      return res.json({ message: 'Xác thực OTP thành công. Tài khoản khách hàng của bạn đã được kích hoạt!' });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
