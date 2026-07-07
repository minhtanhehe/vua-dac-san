import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../api/contentApi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  Search, Plus, Loader2, X, Pencil, Trash2, Eye, BookOpen, Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle
} from 'lucide-react';

const STATUS_COLOR = {
  'Công khai': 'bg-green-100 text-green-700',
  'Chờ duyệt': 'bg-yellow-100 text-yellow-700',
  'Ẩn': 'bg-gray-100 text-gray-600',
};

// ===== POST FORM MODAL =====
function PostFormModal({ post, categories, onClose, onSave, isSaving }) {
  const isEdit = !!post;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      tieuDe: post.tieude,
      moTaNgan: post.motangan || '',
      noiDung: post.noidung || '',
      hinhAnh: post.hinhanh || '',
      maDanhMucBV: post.madanhmucbv,
    } : {
      tieuDe: '',
      moTaNgan: '',
      noiDung: '',
      hinhAnh: '',
      maDanhMucBV: '',
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-heading text-brand-dark">
            {isEdit ? 'Chỉnh sửa Bài viết' : 'Viết Bài mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              {...register('tieuDe', { required: 'Vui lòng nhập tiêu đề' })}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="VD: Cẩm nang thưởng thức dừa sáp Trà Vinh"
            />
            {errors.tieuDe && <p className="text-red-500 text-xs mt-1">{errors.tieuDe.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Danh mục bài viết <span className="text-red-500">*</span></label>
              <select
                {...register('maDanhMucBV', { required: 'Vui lòng chọn danh mục' })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.madanhmucbv} value={c.madanhmucbv}>{c.tendanhmuc}</option>
                ))}
              </select>
              {errors.maDanhMucBV && <p className="text-red-500 text-xs mt-1">{errors.maDanhMucBV.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Hình ảnh minh họa (URL)</label>
              <input
                {...register('hinhAnh')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="http://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Mô tả ngắn</label>
            <textarea
              {...register('moTaNgan')}
              rows={2}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              placeholder="Tóm tắt nội dung bài viết..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nội dung bài viết <span className="text-red-500">*</span></label>
            <textarea
              {...register('noiDung', { required: 'Nội dung bài viết không được để trống' })}
              rows={8}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none font-sans"
              placeholder="Nhập nội dung bài viết chi tiết..."
            />
            {errors.noiDung && <p className="text-red-500 text-xs mt-1">{errors.noiDung.message}</p>}
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              {isEdit ? 'Cập nhật' : 'Đăng bài (Chờ duyệt)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN POSTS PAGE =====
export default function PostsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Fetch managed posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['managePosts', page, search],
    queryFn: async () => {
      try {
        const res = await contentApi.getManagePosts({ page, limit: 10, search: search || undefined });
        const raw = res.data;
        if (raw && raw.data && raw.total !== undefined) return raw;
        const arr = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        return { data: arr, totalPages: Math.ceil(arr.length / 10) || 1, page: 1 };
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài viết:', err);
        return { data: [], totalPages: 1, page: 1 };
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['postCategories'],
    queryFn: async () => {
      try {
        const res = await contentApi.getCategories();
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('Lỗi khi lấy danh mục:', err);
        return [];
      }
    }
  });

  const posts = postsData?.data || [];
  const totalPages = postsData?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data) => contentApi.createPost(data),
    onSuccess: () => {
      toast.success('Đăng bài viết thành công, đang chờ Quản lý duyệt!');
      queryClient.invalidateQueries({ queryKey: ['managePosts'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi đăng bài viết')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contentApi.updatePost(id, data),
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công!');
      queryClient.invalidateQueries({ queryKey: ['managePosts'] });
      setEditPost(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật bài viết')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => contentApi.deletePost(id),
    onSuccess: () => {
      toast.success('Xóa bài viết thành công!');
      queryClient.invalidateQueries({ queryKey: ['managePosts'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa bài viết (Lưu ý: Chỉ bài viết Chờ duyệt hoặc Ẩn mới có thể xóa)')
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, trangThai }) => contentApi.updatePostStatus(id, { trangThai }),
    onSuccess: () => {
      toast.success('Thay đổi trạng thái bài viết thành công!');
      queryClient.invalidateQueries({ queryKey: ['managePosts'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi thay đổi trạng thái')
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Quản lý Bài viết</h1>
          <p className="text-sm text-gray-500">Viết tin tức ẩm thực vùng miền, cẩm nang và quản lý trạng thái hiển thị</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm">
          <Plus size={18} /> Viết bài mới
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tiêu đề, người viết..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-light/50 border-b border-brand-light">
                <tr className="text-xs uppercase text-gray-400 font-bold">
                  <th className="px-6 py-4">Bài viết</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Người đăng</th>
                  <th className="px-6 py-4 text-center">Ngày tạo</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Duyệt nhanh</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                      <p>Không có bài viết nào phù hợp</p>
                    </td>
                  </tr>
                )}
                {posts.map((p) => (
                  <tr key={p.mabaiviet} className="hover:bg-brand-bg/50 transition">
                    <td className="px-6 py-4 max-w-sm">
                      <div>
                        <div className="font-bold text-brand-dark line-clamp-1">{p.tieude}</div>
                        <div className="text-xs text-gray-400">{p.mabaiviet}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.tendanhmuc || p.madanhmucbv}</td>
                    <td className="px-6 py-4 text-gray-600">{p.manvbanhang}</td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {p.ngaytao ? new Date(p.ngaytao).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[p.trangthai] || 'bg-gray-100 text-gray-600'}`}>
                        {p.trangthai}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.trangthai === 'Chờ duyệt' && (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => statusMutation.mutate({ id: p.mabaiviet, trangThai: 'Công khai' })}
                            className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                          >
                            <CheckCircle2 size={12} /> Duyệt
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: p.mabaiviet, trangThai: 'Ẩn' })}
                            className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                          >
                            <AlertTriangle size={12} /> Từ chối
                          </button>
                        </div>
                      )}
                      {p.trangthai === 'Công khai' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: p.mabaiviet, trangThai: 'Ẩn' })}
                          className="bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition"
                        >
                          Ẩn đi
                        </button>
                      )}
                      {p.trangthai === 'Ẩn' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: p.mabaiviet, trangThai: 'Công khai' })}
                          className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                        >
                          Hiện lại
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setEditPost(p)} title="Sửa nội dung" className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteTarget(p)} title="Xóa bài viết" className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30"><ChevronLeft size={18} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm font-bold transition ${p === page ? 'bg-brand-primary text-brand-dark' : 'border border-brand-light text-gray-500 hover:bg-white'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <PostFormModal
          post={null}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
        />
      )}

      {editPost && (
        <PostFormModal
          post={editPost}
          categories={categories}
          onClose={() => setEditPost(null)}
          onSave={(data) => updateMutation.mutate({ id: editPost.mabaiviet, data })}
          isSaving={updateMutation.isPending}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0"><Trash2 size={24} /></div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark font-heading">Xóa bài viết?</h3>
                <p className="text-sm text-gray-500 mt-1">Bạn có chắc chắn muốn xóa bài viết "{deleteTarget.tieude}"? Hành động này không thể phục hồi.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.mabaiviet)} disabled={deleteMutation.isPending} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
