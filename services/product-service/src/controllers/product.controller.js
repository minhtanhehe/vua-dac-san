import { ProductModel } from '../models/product.model.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';

export const ProductController = {
  // POST /products/upload
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không tìm thấy file' });
      }

      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from('products')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(filePath);

      return res.json({ url: publicUrl });
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      return res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
    }
  },

  // GET /products
  async getProducts(req, res) {
    try {
      const result = await ProductModel.getAllProducts(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting products:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn sản phẩm' });
    }
  },

  // POST /products
  async createProduct(req, res) {
    try {
      const { tenSanpham, maDanhMuc, giaDon, donViTinh } = req.body;
      if (!tenSanpham || !maDanhMuc || giaDon === undefined || !donViTinh) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      if (parseFloat(giaDon) < 0) {
        return res.status(400).json({ message: 'Giá sản phẩm không được nhỏ hơn 0' });
      }

      const product = await ProductModel.createProduct(req.body);
      return res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
    } catch (err) {
      console.error('Error creating product:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /products/:id
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      return res.json(product);
    } catch (err) {
      console.error('Error getting product detail:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PUT /products/:id
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { tenSanpham, maDanhMuc, giaDon, donViTinh, trangThai } = req.body;

      if (!tenSanpham || !maDanhMuc || giaDon === undefined || !donViTinh || !trangThai) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      const updated = await ProductModel.updateProduct(id, req.body);
      return res.json({ message: 'Cập nhật sản phẩm thành công', product: updated });
    } catch (err) {
      console.error('Error updating product:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // DELETE /products/:id
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      if (product.soluongton > 0) {
        return res.status(400).json({ message: 'Không thể xóa sản phẩm còn số lượng tồn kho > 0' });
      }

      await ProductModel.deleteProduct(id);
      return res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // GET /products/expiry-warning
  async getExpiryWarning(req, res) {
    try {
      const expiring = await ProductModel.getExpiringProducts(30);
      return res.json(expiring);
    } catch (err) {
      console.error('Error fetching expiry warning products:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // PATCH /products/:id/stock (Internal API)
  async updateStock(req, res) {
    try {
      const { id } = req.params; // maSanpham
      const { soLuongThayDoi } = req.body; // positive (add) or negative (deduct)

      if (soLuongThayDoi === undefined || typeof soLuongThayDoi !== 'number') {
        return res.status(400).json({ message: 'soLuongThayDoi phải là một số' });
      }

      const updated = await ProductModel.updateStockInternal(id, soLuongThayDoi);
      if (!updated) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      return res.json({ message: 'Cập nhật tồn kho thành công', product: updated });
    } catch (err) {
      console.error('Error during internal stock update:', err.message);
      // Return 400 Bad Request on stock deficiency
      if (err.message.includes('không đủ hàng tồn kho')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật tồn kho' });
    }
  },

  // POST /products/reserve-stock (Internal API)
  async reserveStock(req, res) {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Danh sách sản phẩm không hợp lệ' });
      }
      
      await ProductModel.reserveStockInternal(items);
      
      return res.json({ message: 'Giữ kho thành công' });
    } catch (err) {
      console.error('Error during internal stock reservation:', err.message);
      if (err.message.includes('không đủ hàng tồn kho') || err.message.includes('Không tìm thấy sản phẩm')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Lỗi máy chủ khi giữ kho' });
    }
  },

  // GET /products/categories
  async getCategories(req, res) {
    try {
      const categories = await ProductModel.getCategories();
      return res.json(categories);
    } catch (err) {
      console.error('Error getting categories:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh mục' });
    }
  }
};
