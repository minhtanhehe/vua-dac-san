import { ContentModel } from '../models/content.model.js';
import { orderApi } from '../config/axios.js';

export const ContentController = {
  // --- CATEGORIES ---
  async getCategories(req, res) {
    try {
      const cats = await ContentModel.getCategories();
      return res.json(cats);
    } catch (err) {
      console.error('Error getting categories:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  async createCategory(req, res) {
    try {
      const { maDanhMucBV, tenDanhMuc } = req.body;
      if (!maDanhMucBV || !tenDanhMuc) {
        return res.status(400).json({ message: 'Thiếu thông tin maDanhMucBV, tenDanhMuc' });
      }
      const newCat = await ContentModel.createCategory({ maDanhMucBV, tenDanhMuc });
      return res.status(201).json({ message: 'Tạo danh mục bài viết thành công', category: newCat });
    } catch (err) {
      console.error('Error creating category:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // --- PUBLIC POSTS ---
  async getPublicPosts(req, res) {
    try {
      const result = await ContentModel.getPublicPosts(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting public posts:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn bài viết' });
    }
  },

  // --- MANAGE POSTS (Internal) ---
  async getManagePosts(req, res) {
    try {
      const result = await ContentModel.getManagePosts(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting managed posts:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn bài viết quản trị' });
    }
  },

  // --- POST DETAIL ---
  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await ContentModel.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }
      return res.json(post);
    } catch (err) {
      console.error('Error getting post by ID:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // --- POST CREATE ---
  async createPost(req, res) {
    try {
      const { tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV } = req.body;
      if (!tieuDe || !noiDung || !maDanhMucBV) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (tieuDe, noiDung, maDanhMucBV)' });
      }

      const maBaiviet = 'BV' + Date.now();
      const newPost = await ContentModel.createPost({
        maBaiviet,
        tieuDe,
        moTaNgan,
        noiDung,
        hinhAnh,
        maDanhMucBV,
        maNVBanHang: req.user.tenDangnhap
      });

      return res.status(201).json({ message: 'Tạo bài viết thành công. Đang chờ duyệt.', post: newPost });
    } catch (err) {
      console.error('Error creating post:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi tạo bài viết' });
    }
  },

  // --- POST UPDATE ---
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV } = req.body;

      const post = await ContentModel.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }

      const userRoles = req.user.cacQuyen || [req.user.vaiTro];
      const isSales = userRoles.includes('BAN_HANG');
      const isManager = userRoles.includes('QUAN_LY');

      if (isSales && !isManager) {
        if (post.manvbanhang !== req.user.tenDangnhap) {
          return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài viết của người khác' });
        }
        if (post.trangthai !== 'Chờ duyệt') {
          return res.status(400).json({ message: 'Bạn chỉ được chỉnh sửa bài viết ở trạng thái Chờ duyệt' });
        }
      }

      const updated = await ContentModel.updatePost(id, { tieuDe, moTaNgan, noiDung, hinhAnh, maDanhMucBV });
      return res.json({ message: 'Cập nhật bài viết thành công', post: updated });
    } catch (err) {
      console.error('Error updating post:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bài viết' });
    }
  },

  // --- POST STATUS UPDATE (Approve/Hide) ---
  async updatePostStatus(req, res) {
    try {
      const { id } = req.params;
      const { trangThai } = req.body;

      if (!trangThai || !['Công khai', 'Ẩn', 'Chờ duyệt'].includes(trangThai)) {
        return res.status(400).json({ message: 'Trạng thái bài viết không hợp lệ' });
      }

      const post = await ContentModel.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }

      const updated = await ContentModel.updatePostStatus(id, trangThai);
      return res.json({ message: `Đã chuyển trạng thái bài viết sang: ${trangThai}`, post: updated });
    } catch (err) {
      console.error('Error updating post status:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  // --- POST DELETE ---
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const post = await ContentModel.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
      }

      if (post.trangthai !== 'Chờ duyệt' && post.trangthai !== 'Ẩn') {
        return res.status(400).json({ message: 'Chỉ được xóa bài viết ở trạng thái Chờ duyệt hoặc Ẩn' });
      }

      const userRoles = req.user.cacQuyen || [req.user.vaiTro];
      const isSales = userRoles.includes('BAN_HANG');
      const isManager = userRoles.includes('QUAN_LY');

      if (isSales && !isManager) {
        if (post.manvbanhang !== req.user.tenDangnhap) {
          return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết của người khác' });
        }
      }

      await ContentModel.deletePost(id);
      return res.json({ message: 'Xóa bài viết thành công' });
    } catch (err) {
      console.error('Error deleting post:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi xóa bài viết' });
    }
  },

  // --- COMMENTS ---
  async getPendingComments(req, res) {
    try {
      const comments = await ContentModel.getPendingComments();
      return res.json(comments);
    } catch (err) {
      console.error('Error getting pending comments:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  async approveComment(req, res) {
    try {
      const { id } = req.params;
      const comment = await ContentModel.getCommentById(id);
      if (!comment) {
        return res.status(404).json({ message: 'Không tìm thấy bình luận' });
      }

      const updated = await ContentModel.updateCommentStatus(id, 'Đã duyệt', req.user.tenDangnhap);
      return res.json({ message: 'Duyệt bình luận thành công', comment: updated });
    } catch (err) {
      console.error('Error approving comment:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  async hideComment(req, res) {
    try {
      const { id } = req.params;
      const comment = await ContentModel.getCommentById(id);
      if (!comment) {
        return res.status(404).json({ message: 'Không tìm thấy bình luận' });
      }

      const updated = await ContentModel.updateCommentStatus(id, 'Ẩn', req.user.tenDangnhap);
      return res.json({ message: 'Đã ẩn bình luận', comment: updated });
    } catch (err) {
      console.error('Error hiding comment:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },

  async createComment(req, res) {
    try {
      const { maKhachHang, maSanpham, noiDungBL, danhGia } = req.body;
      if (!maKhachHang || !maSanpham || !noiDungBL || !danhGia) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (maKhachHang, maSanpham, noiDungBL, danhGia)' });
      }

      const maBL = 'BL' + Date.now();
      const newComment = await ContentModel.createComment({
        maBL,
        maKhachHang,
        maSanpham,
        noiDungBL,
        danhGia
      });

      return res.status(201).json({ message: 'Gửi bình luận thành công. Đang chờ duyệt.', comment: newComment });
    } catch (err) {
      console.error('Error creating comment:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi gửi bình luận' });
    }
  },

  // --- SUPPORT REQUESTS ---
  async getMySupportRequests(req, res) {
    try {
      // Get customer data from order-service to know their maKhachHang
      const orderRes = await orderApi.get('/customers/me', {
        headers: { Authorization: req.headers['authorization'] }
      });
      const customer = orderRes.data;
      if (!customer || !customer.makhachhang) {
         return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng' });
      }
      
      const result = await ContentModel.getSupportRequests({ maKhachHang: customer.makhachhang });
      return res.json(result);
    } catch (err) {
      console.error('Error getting my support requests:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách yêu cầu hỗ trợ của bạn' });
    }
  },

  async getSupportRequests(req, res) {
    try {
      const result = await ContentModel.getSupportRequests(req.query);
      return res.json(result);
    } catch (err) {
      console.error('Error getting support requests:', err);
      return res.status(500).json({ message: 'Lỗi truy vấn danh sách yêu cầu hỗ trợ' });
    }
  },

  async createSupportRequest(req, res) {
    try {
      const { loaiYeuCau, maKhachHang, maSanpham, maHoaDon, noiDungKH } = req.body;

      if (!loaiYeuCau || !maKhachHang || !noiDungKH) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (loaiYeuCau, maKhachHang, noiDungKH)' });
      }

      if (!['Tư vấn', 'Thắc mắc', 'Khiếu nại'].includes(loaiYeuCau)) {
        return res.status(400).json({ message: 'Loại yêu cầu không hợp lệ (Tư vấn, Thắc mắc, Khiếu nại)' });
      }

      const maYeuCau = 'YC' + Date.now();
      const newRequest = await ContentModel.createSupportRequest({
        maYeuCau,
        loaiYeuCau,
        maKhachHang,
        maSanpham,
        maHoaDon,
        noiDungKH
      });

      return res.status(201).json({ message: 'Gửi yêu cầu hỗ trợ thành công', supportRequest: newRequest });
    } catch (err) {
      console.error('Error creating support request:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi gửi yêu cầu hỗ trợ' });
    }
  },

  async replySupportRequest(req, res) {
    try {
      const { id } = req.params;
      const { noiDungPhanHoi } = req.body;

      if (!noiDungPhanHoi) {
        return res.status(400).json({ message: 'Nội dung phản hồi là bắt buộc' });
      }

      const request = await ContentModel.getSupportRequestById(id);
      if (!request) {
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ' });
      }

      if (request.trangthai === 'Đã xử lý') {
        return res.status(400).json({ message: 'Yêu cầu này đã được xử lý xong từ trước' });
      }

      // If support request is a complaint (Khiếu nại), verify order with order-service
      if (request.loaiyeucau === 'Khiếu nại') {
        if (!request.mahoadon) {
          return res.status(400).json({ message: 'Yêu cầu khiếu nại thiếu mã hóa đơn đi kèm để xác minh' });
        }

        try {
          // Call order-service internal API GET /:id/verify-internal
          const orderRes = await orderApi.get('/' + request.mahoadon + '/verify-internal');
          const order = orderRes.data;

          if (order.makhachhang !== request.makhachhang) {
            return res.status(400).json({ 
              message: `Xác minh thất bại. Hóa đơn ${request.mahoadon} không thuộc về khách hàng khiếu nại.` 
            });
          }
        } catch (orderErr) {
          console.error(`Failed to verify invoice ${request.mahoadon} from order-service:`, orderErr.message);
          if (orderErr.response && orderErr.response.status === 404) {
            return res.status(404).json({ message: `Mã hóa đơn khiếu nại ${request.mahoadon} không tồn tại trên hệ thống` });
          }
          return res.status(500).json({ message: 'Không thể kết nối với dịch vụ đơn hàng để xác minh khiếu nại' });
        }
      }

      const updated = await ContentModel.replySupportRequest(id, {
        noiDungPhanHoi,
        maNVCSKH: req.user.tenDangnhap
      });

      return res.json({ message: 'Phản hồi yêu cầu hỗ trợ thành công', supportRequest: updated });
    } catch (err) {
      console.error('Error replying to support request:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi phản hồi yêu cầu' });
    }
  }
};
