import { SupplierModel } from '../models/supplier.model.js';
import { warehouseApi } from '../config/axios.js';

export const SupplierController = {
  // GET /users/suppliers
  async getSuppliers(req, res) {
    try {
      const result = await SupplierModel.getAllSuppliers(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách nhà cung cấp' });
    }
  },

  // POST /users/suppliers
  async createSupplier(req, res) {
    try {
      const { tenNCC, sdt, email, diaChi } = req.body;

      if (!tenNCC || !sdt) {
        return res.status(400).json({ message: 'Thiếu tên nhà cung cấp hoặc số điện thoại' });
      }

      // Check duplicates
      const duplicate = await SupplierModel.checkDuplicate(email, sdt);
      if (duplicate) {
        return res.status(400).json({
          message: duplicate === 'email' ? 'Email nhà cung cấp đã tồn tại' : 'Số điện thoại nhà cung cấp đã tồn tại'
        });
      }

      const supplier = await SupplierModel.createSupplier({ tenNCC, sdt, email, diaChi });
      return res.status(201).json({ message: 'Tạo nhà cung cấp thành công', supplier });
    } catch (err) {
      console.error('Error creating supplier:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /users/suppliers/:id
  async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      const supplier = await SupplierModel.findById(id);
      if (!supplier) {
        return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      }
      return res.json(supplier);
    } catch (err) {
      console.error('Error getting supplier:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /users/suppliers/:id
  async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const { tenNCC, sdt, email, diaChi, trangThai } = req.body;

      if (!tenNCC || !sdt) {
        return res.status(400).json({ message: 'Thiếu tên nhà cung cấp hoặc số điện thoại' });
      }

      const supplier = await SupplierModel.findById(id);
      if (!supplier) {
        return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      }

      // Check duplicates
      const duplicate = await SupplierModel.checkDuplicate(email, sdt, id);
      if (duplicate) {
        return res.status(400).json({
          message: duplicate === 'email' ? 'Email nhà cung cấp đã trùng với đối tác khác' : 'Số điện thoại nhà cung cấp đã trùng với đối tác khác'
        });
      }

      const updated = await SupplierModel.updateSupplier(id, { tenNCC, sdt, email, diaChi, trangThai });
      return res.json({ message: 'Cập nhật nhà cung cấp thành công', supplier: updated });
    } catch (err) {
      console.error('Error updating supplier:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // DELETE /users/suppliers/:id
  async deleteSupplier(req, res) {
    try {
      const { id } = req.params; // maNCC

      const supplier = await SupplierModel.findById(id);
      if (!supplier) {
        return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      }

      // Check with warehouse-service if supplier has transactions
      let hasTransactions = false;
      try {
        const response = await warehouseApi.get(`/warehouse/suppliers/${id}/has-transactions`);
        if (response.data && response.data.hasTransactions) {
          hasTransactions = true;
        }
      } catch (err) {
        // If warehouse-service is not available or returns 404/error, assume no transactions or fail safe
        console.warn(`Could not verify supplier transactions with warehouse-service: ${err.message}. Proceeding to delete...`);
      }

      if (hasTransactions) {
        // Has transactions, soft delete (change status to 'Ngừng hợp tác')
        const updated = await SupplierModel.updateStatus(id, 'Ngừng hợp tác');
        return res.json({
          message: 'Nhà cung cấp đã có giao dịch phát sinh. Chuyển trạng thái sang Ngừng hợp tác.',
          supplier: updated
        });
      } else {
        // No transactions, hard delete
        await SupplierModel.deleteSupplier(id);
        return res.json({ message: 'Xóa nhà cung cấp thành công' });
      }
    } catch (err) {
      console.error('Error deleting supplier:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
