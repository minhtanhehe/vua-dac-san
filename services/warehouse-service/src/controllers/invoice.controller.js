import { InvoiceModel } from '../models/invoice.model.js';
import { productApi } from '../config/axios.js';
import { publishStockUpdate, publishInvoiceCreated } from '../config/rabbitmq.js';
import pool from '../config/db.js';

async function generateInvoiceCode(loaiPhieu) {
  const year = new Date().getFullYear();
  const prefix = loaiPhieu === 'NHAP' ? `NK${year}` : `XK${year}`;
  const result = await pool.query(
    'SELECT maPhieu FROM PHIEU_KHO WHERE maPhieu LIKE $1 ORDER BY maPhieu DESC LIMIT 1',
    [`${prefix}%`]
  );
  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }
  const lastCode = result.rows[0].maphieu;
  const lastNum = parseInt(lastCode.replace(prefix, ''), 10);
  const nextNum = lastNum + 1;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

export const InvoiceController = {
  // GET /warehouse/invoices
  async getInvoices(req, res) {
    try {
      const result = await InvoiceModel.getInvoices(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting warehouse invoices:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách phiếu kho' });
    }
  },

  // GET /warehouse/invoices/:id
  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu kho' });
      }

      const items = await InvoiceModel.getInvoiceItems(id);
      
      // Fetch latest names from product service if possible (non-blocking)
      const itemsWithDetail = await Promise.all(items.map(async (item) => {
        try {
          const prodRes = await productApi.get(`/${item.masanpham}`);
          return { ...item, tenSanpham: prodRes.data.tensanpham };
        } catch (e) {
          return { ...item, tenSanpham: 'Sản phẩm ' + item.masanpham };
        }
      }));

      return res.json({ ...invoice, chiTiet: itemsWithDetail });
    } catch (err) {
      console.error('Error getting invoice details:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // POST /warehouse/invoices/import (Tạo phiếu nhập kho)
  async createImportInvoice(req, res) {
    try {
      const { maNCC, ghiChu, chiTiet } = req.body;

      if (!maNCC || !chiTiet || !Array.isArray(chiTiet) || chiTiet.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (maNCC, chiTiet)' });
      }

      // Verify each product exists
      for (const item of chiTiet) {
        if (!item.maSanpham || !item.soLuong || item.soLuong <= 0 || !item.donGia || item.donGia < 0) {
          return res.status(400).json({ message: 'Thông tin sản phẩm, số lượng, hoặc đơn giá trong chi tiết không hợp lệ' });
        }

        try {
          await productApi.get(`/${item.maSanpham}`);
        } catch (prodErr) {
          console.error(`Failed to verify product ${item.maSanpham} from product-service:`, prodErr.message);
          return res.status(404).json({ message: `Sản phẩm ${item.maSanpham} không tồn tại trên hệ thống` });
        }
      }

      const maPhieu = await generateInvoiceCode('NHAP');

      const client = await InvoiceModel.getTransactionClient();
      try {
        await client.query('BEGIN');

        const newInvoice = await InvoiceModel.createInvoice({
          maPhieu,
          loaiPhieu: 'NHAP',
          ghiChu,
          maNVKho: req.user.tenDangnhap,
          maNCC,
          chiTiet
        }, client);

        await client.query('COMMIT');

        // Publish events asynchronously
        for (const item of chiTiet) {
          publishStockUpdate(item.maSanpham, item.soLuong).catch((err) => {
            console.error(`Failed to publish stock update event for product ${item.maSanpham}:`, err.message);
          });
        }

        publishInvoiceCreated(maPhieu, parseFloat(newInvoice.tongtien), maNCC).catch((err) => {
          console.error(`Failed to publish invoice created event for ${maPhieu}:`, err.message);
        });

        return res.status(201).json({ message: 'Tạo phiếu nhập kho thành công', invoice: newInvoice });

      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error creating import invoice:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi tạo phiếu nhập kho' });
    }
  },

  // POST /warehouse/invoices/export (Tạo phiếu xuất kho)
  async createExportInvoice(req, res) {
    try {
      const { ghiChu, chiTiet } = req.body;

      if (!chiTiet || !Array.isArray(chiTiet) || chiTiet.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin chi tiết hàng hóa xuất (chiTiet)' });
      }

      // Verify each product exists and check stock
      for (const item of chiTiet) {
        if (!item.maSanpham || !item.soLuong || item.soLuong <= 0 || !item.donGia || item.donGia < 0) {
          return res.status(400).json({ message: 'Thông tin sản phẩm, số lượng, hoặc đơn giá trong chi tiết không hợp lệ' });
        }

        try {
          const response = await productApi.get(`/${item.maSanpham}`);
          const product = response.data;
          
          if (product.soluongton < item.soLuong) {
            return res.status(400).json({ 
              message: `Không đủ hàng tồn kho cho sản phẩm [${product.tensanpham}]. (Còn lại: ${product.soluongton}, yêu cầu xuất: ${item.soLuong})` 
            });
          }
        } catch (prodErr) {
          console.error(`Failed to verify product ${item.maSanpham} from product-service:`, prodErr.message);
          if (prodErr.response && prodErr.response.status === 404) {
            return res.status(404).json({ message: `Sản phẩm ${item.maSanpham} không tồn tại trên hệ thống` });
          }
          return res.status(500).json({ message: 'Không thể kết nối với dịch vụ sản phẩm để kiểm tra tồn kho' });
        }
      }

      const maPhieu = await generateInvoiceCode('XUAT');

      const client = await InvoiceModel.getTransactionClient();
      try {
        await client.query('BEGIN');

        const newInvoice = await InvoiceModel.createInvoice({
          maPhieu,
          loaiPhieu: 'XUAT',
          ghiChu,
          maNVKho: req.user.tenDangnhap,
          maNCC: null,
          chiTiet
        }, client);

        await client.query('COMMIT');

        // Publish events asynchronously
        for (const item of chiTiet) {
          publishStockUpdate(item.maSanpham, -item.soLuong).catch((err) => {
            console.error(`Failed to publish stock update event for product ${item.maSanpham}:`, err.message);
          });
        }

        return res.status(201).json({ message: 'Tạo phiếu xuất kho thành công', invoice: newInvoice });

      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error creating export invoice:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi tạo phiếu xuất kho' });
    }
  },

  // PUT /warehouse/invoices/:id
  async updateInvoice(req, res) {
    try {
      const { id } = req.params;
      const { ghiChu, maNCC, chiTiet } = req.body;

      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu kho' });
      }

      if (invoice.trangthaitt !== 'Chờ thanh toán') {
        return res.status(400).json({ message: 'Chỉ được chỉnh sửa phiếu kho ở trạng thái Chờ thanh toán' });
      }

      if (chiTiet && (!Array.isArray(chiTiet) || chiTiet.length === 0)) {
        return res.status(400).json({ message: 'Chi tiết hàng hóa cập nhật không hợp lệ' });
      }

      // Verify products if chiTiet is provided
      if (chiTiet) {
        for (const item of chiTiet) {
          if (!item.maSanpham || !item.soLuong || item.soLuong <= 0 || !item.donGia || item.donGia < 0) {
            return res.status(400).json({ message: 'Chi tiết sản phẩm cập nhật không hợp lệ' });
          }

          try {
            await productApi.get(`/${item.maSanpham}`);
          } catch (e) {
            return res.status(404).json({ message: `Sản phẩm ${item.maSanpham} không tồn tại trên hệ thống` });
          }
        }
      }

      const client = await InvoiceModel.getTransactionClient();
      try {
        await client.query('BEGIN');

        // Fetch old items to compute stock differences if it is updated (or just rollback previous and apply new)
        // For simplicity: we require the user to delete and recreate if stock updates are massive, 
        // but let's implement basic update logic. 
        // (Usually, editing invoice items that have already changed stocks requires a full diff rollback).
        // Let's implement stock update diff rollback:
        const oldItems = await InvoiceModel.getInvoiceItems(id);
        
        const updatedInvoice = await InvoiceModel.updateInvoice(id, { ghiChu, maNCC, chiTiet }, client);
        
        await client.query('COMMIT');

        // Compensate stocks: Revert old items and Apply new items
        if (chiTiet) {
          const factor = invoice.loaiphieu === 'NHAP' ? 1 : -1;

          // Revert old items (invert factor)
          for (const item of oldItems) {
            publishStockUpdate(item.masanpham, -item.soluong * factor).catch((err) => {
              console.error(`Failed to rollback stock for old item ${item.masanpham}:`, err.message);
            });
          }

          // Apply new items (using factor)
          for (const item of chiTiet) {
            publishStockUpdate(item.maSanpham, item.soLuong * factor).catch((err) => {
              console.error(`Failed to apply stock for new item ${item.maSanpham}:`, err.message);
            });
          }
        }

        return res.json({ message: 'Cập nhật phiếu kho thành công', invoice: updatedInvoice });

      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error updating invoice:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật phiếu kho' });
    }
  },

  // DELETE /warehouse/invoices/:id
  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu kho' });
      }

      if (invoice.trangthaitt !== 'Chờ thanh toán') {
        return res.status(400).json({ message: 'Chỉ được xóa phiếu kho ở trạng thái Chờ thanh toán' });
      }

      const items = await InvoiceModel.getInvoiceItems(id);

      const client = await InvoiceModel.getTransactionClient();
      try {
        await client.query('BEGIN');

        await InvoiceModel.deleteInvoice(id, client);

        await client.query('COMMIT');

        // Rollback stocks on deletion
        const factor = invoice.loaiphieu === 'NHAP' ? 1 : -1;
        for (const item of items) {
          // Revert: so multiply by -1
          publishStockUpdate(item.masanpham, -item.soluong * factor).catch((err) => {
            console.error(`Failed to rollback stock for deleted item ${item.masanpham}:`, err.message);
          });
        }

        return res.json({ message: 'Xóa phiếu kho thành công và đã hoàn trả tồn kho tương ứng' });

      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr;
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Error deleting invoice:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi xóa phiếu kho' });
    }
  },

  // GET /suppliers/:id/has-transactions (Internal API)
  async hasTransactions(req, res) {
    try {
      const { id } = req.params;
      const result = await InvoiceModel.hasTransactionsForSupplier(id);
      return res.json({ hasTransactions: result });
    } catch (err) {
      console.error('Error checking supplier transactions:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PATCH /invoices/:id/payment-status (Internal API)
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThaiTT } = req.body;
      if (!trangThaiTT) {
        return res.status(400).json({ message: 'Trạng thái thanh toán mới là bắt buộc' });
      }

      const result = await pool.query(
        'UPDATE PHIEU_KHO SET trangThaiTT = $1, ngayCapNhat = NOW() WHERE maPhieu = $2 RETURNING *',
        [trangThaiTT, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu kho' });
      }

      return res.json({ message: 'Cập nhật trạng thái thanh toán thành công', invoice: result.rows[0] });
    } catch (err) {
      console.error('Error updating payment status in warehouse service:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};
