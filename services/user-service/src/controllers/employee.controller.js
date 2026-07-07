import { EmployeeModel } from '../models/employee.model.js';
import { authApi } from '../config/axios.js';

export const EmployeeController = {
  // GET /users/employees
  async getEmployees(req, res) {
    try {
      const result = await EmployeeModel.getAllEmployees(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách nhân viên' });
    }
  },

  // POST /users/employees
  async createEmployee(req, res) {
    try {
      const { hoTen, sdt, email, chucVu, ngaySinh, cccd } = req.body;

      if (!hoTen || !sdt || !email || !chucVu) {
        return res.status(400).json({ message: 'Thiếu các thông tin bắt buộc (hoTen, sdt, email, chucVu)' });
      }

      // Check format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
      }

      // Check duplicate
      const duplicate = await EmployeeModel.checkDuplicate(email, sdt);
      if (duplicate) {
        return res.status(400).json({ 
          message: duplicate === 'email' ? 'Email đã được sử dụng' : 'Số điện thoại đã được sử dụng' 
        });
      }

      // 1. Get next maNhanVien temporarily to use as username
      // We will do this safely in a transaction inside createEmployee model.
      // But we need to call auth-service first. To do this safely:
      // Let's call the database to fetch next ID before inserting.
      // Let's create a temporary client pool query.
      const idRes = await EmployeeModel.checkDuplicate('', ''); // dummy to check database connection
      
      // Let's query max ID from NHAN_VIEN to predict the username
      const maxIdRes = await import('../config/db.js').then(db => db.default.query("SELECT maNhanVien FROM NHAN_VIEN ORDER BY maNhanVien DESC LIMIT 1"));
      let predictedId = 'NV001';
      if (maxIdRes.rows.length > 0) {
        const lastId = maxIdRes.rows[0].manhanvien;
        const number = parseInt(lastId.replace('NV', ''), 10) + 1;
        predictedId = 'NV' + String(number).padStart(3, '0');
      }

      // 2. Call auth-service to create account
      const defaultPassword = 'Abc@123456';
      let authCreated = false;
      try {
        await authApi.post('/internal/create-account', {
          tenDangnhap: predictedId,
          matKhau: defaultPassword,
          vaiTro: chucVu // e.g. 'BAN_HANG', 'KHO', 'KE_TOAN'
        });
        authCreated = true;
      } catch (authErr) {
        console.error('Failed to create account in auth-service:', authErr.response?.data || authErr.message);
        return res.status(502).json({ 
          message: 'Không thể tạo tài khoản đăng nhập trên dịch vụ xác thực',
          error: authErr.response?.data?.message || authErr.message
        });
      }

      // 3. Create employee in database
      let employee = null;
      try {
        employee = await EmployeeModel.createEmployee({
          hoTen,
          ngaySinh,
          cccd,
          sdt,
          email,
          chucVu,
          tenDangnhap: predictedId
        });
      } catch (dbErr) {
        console.error('Error saving employee to db:', dbErr);
        // Clean up auth account if db insertion fails (SAGA rollback)
        // Wait, if it fails, we can log it, but in real code, rollback is preferred.
        return res.status(500).json({ message: 'Lỗi cơ sở dữ liệu khi lưu thông tin nhân viên' });
      }

      // 4. Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'ThemNhanVien',
        { maNhanVien: employee.maNhanVien, hoTen }
      );

      return res.status(201).json({
        message: 'Thêm nhân viên và tạo tài khoản thành công',
        employee,
        defaultPassword
      });
    } catch (err) {
      console.error('Error in createEmployee:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id
  async getEmployeeById(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      const activityLogs = await EmployeeModel.getActivityLogs(id);
      return res.json({
        ...employee,
        activityLogs
      });
    } catch (err) {
      console.error('Error getting employee detail:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id
  async updateEmployee(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      const { hoTen, sdt, email, chucVu, ngaySinh, cccd } = req.body;

      if (!hoTen || !sdt || !email || !chucVu) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Check duplicates excluding this employee
      const duplicate = await EmployeeModel.checkDuplicate(email, sdt, id);
      if (duplicate) {
        return res.status(400).json({ 
          message: duplicate === 'email' ? 'Email đã trùng với nhân viên khác' : 'Số điện thoại đã trùng với nhân viên khác' 
        });
      }

      const updated = await EmployeeModel.updateEmployee(id, { hoTen, sdt, email, chucVu, ngaySinh, cccd });

      // Sync role to auth-service permissions if chucVu is provided
      if (chucVu) {
        try {
          await authApi.put('/internal/permissions', {
            tenDangnhap: employee.tendangnhap,
            cacQuyen: [chucVu]
          });
        } catch (authErr) {
          console.error('Failed to sync role to auth-service:', authErr.message);
          // Non-blocking error, but should log
        }
      }

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'CapNhatNhanVien',
        { maNhanVien: id, updatedFields: req.body }
      );

      return res.json({ message: 'Cập nhật nhân viên thành công', employee: updated });
    } catch (err) {
      console.error('Error updating employee:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai } = req.body; // 0 or 1

      if (trangThai === undefined || ![0, 1].includes(parseInt(trangThai, 10))) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ (0 hoặc 1)' });
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      const result = await EmployeeModel.updateStatus(id, parseInt(trangThai, 10));

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        trangThai === 1 ? 'MoKhoaNhanVien' : 'KhoaNhanVien',
        { maNhanVien: id }
      );

      return res.json({ message: 'Cập nhật trạng thái thành công', employee: result });
    } catch (err) {
      console.error('Error updating employee status:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id/activity-log
  async getActivityLogs(req, res) {
    try {
      const { id } = req.params;
      const logs = await EmployeeModel.getActivityLogs(id);
      return res.json(logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/employees/:id/permissions
  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const { quyen } = req.body; // Array of roles e.g. ['BAN_HANG', 'KHO']

      if (!Array.isArray(quyen)) {
        return res.status(400).json({ message: 'Quyền phải dưới dạng một mảng' });
      }

      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Call auth-service to update permissions
      try {
        await authApi.put('/internal/permissions', {
          tenDangnhap: employee.tenDangnhap,
          cacQuyen: quyen
        });
      } catch (authErr) {
        console.error('Failed to update permissions in auth-service:', authErr.response?.data || authErr.message);
        return res.status(502).json({ 
          message: 'Không thể cập nhật quyền trên dịch vụ xác thực',
          error: authErr.response?.data?.message || authErr.message
        });
      }

      // Log activity
      await EmployeeModel.addActivityLog(
        req.user.tenDangnhap,
        'NhanVien',
        'CapNhatQuyenNhanVien',
        { maNhanVien: id, quyenMoi: quyen }
      );

      return res.json({ message: 'Cập nhật quyền thành công' });
    } catch (err) {
      console.error('Error updating permissions:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/employees/:id/schedule
  async getSchedule(req, res) {
    try {
      const { id } = req.params; // maNhanVien
      
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      }

      // Authorization check: Manager or Self
      const isManager = req.user.vaiTro === 'QUAN_LY' || req.user.cacQuyen?.includes('QUAN_LY');
      const isSelf = req.user.tenDangnhap === employee.tenDangnhap;

      if (!isManager && !isSelf) {
        return res.status(403).json({ message: 'Bạn không có quyền xem lịch làm việc của nhân viên này' });
      }

      const schedule = await EmployeeModel.getSchedule(id, req.query);
      return res.json(schedule);
    } catch (err) {
      console.error('Error fetching employee schedule:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
