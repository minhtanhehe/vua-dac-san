import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { warehouseApi } from '../../api/warehouseApi';
import { supplierApi } from '../../api/supplierApi';
import { toast } from 'react-toastify';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Search, Package, AlertTriangle, Loader2, X, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, History, CalendarRange
} from 'lucide-react';

const MOCK_PRODUCTS = [
  { masanpham: 'SP001', tensanpham: 'Bánh Pía Sầu Riêng Sóc Trăng', madanhmuc: 'DM001', tendanhmuc: 'Bánh kẹo', vungmien: 'Nam', donvitinh: 'Hộp', giadon: '85000', soluongton: 120, hansudung: '2026-08-15', trangthai: 'Còn hàng', mancc: 'NCC001' },
  { masanpham: 'SP002', tensanpham: 'Kẹo Dừa Bến Tre Nguyên Chất', madanhmuc: 'DM001', tendanhmuc: 'Bánh kẹo', vungmien: 'Nam', donvitinh: 'Gói', giadon: '65000', soluongton: 200, hansudung: '2026-09-01', trangthai: 'Còn hàng', mancc: 'NCC002' },
  { masanpham: 'SP003', tensanpham: 'Mắm Tôm Chua Huế Loại 1', madanhmuc: 'DM002', tendanhmuc: 'Gia vị mắm', vungmien: 'Trung', donvitinh: 'Hũ', giadon: '120000', soluongton: 45, hansudung: '2026-07-03', trangthai: 'Còn hàng', mancc: 'NCC003' },
  { masanpham: 'SP004', tensanpham: 'Thịt Trâu Gác Bếp Điện Biên', madanhmuc: 'DM003', tendanhmuc: 'Thịt khô', vungmien: 'Bắc', donvitinh: 'Gói', giadon: '280000', soluongton: 35, hansudung: '2026-12-31', trangthai: 'Còn hàng', mancc: 'NCC004' },
  { masanpham: 'SP005', tensanpham: 'Nước Mắm Phú Quốc 500ml', madanhmuc: 'DM002', tendanhmuc: 'Gia vị mắm', vungmien: 'Nam', donvitinh: 'Chai', giadon: '95000', soluongton: 150, hansudung: '2027-01-01', trangthai: 'Còn hàng', mancc: 'NCC005' },
  { masanpham: 'SP006', tensanpham: 'Chả Hoa Năm Thụy Trà Vinh', madanhmuc: 'DM004', tendanhmuc: 'Chả giò', vungmien: 'Nam', donvitinh: 'Gói', giadon: '145000', soluongton: 0, hansudung: '2026-06-30', trangthai: 'Hết hàng', mancc: 'NCC006' },
];

const MOCK_CATEGORIES = [
  { madanhmuc: 'DM001', tendanhmuc: 'Bánh kẹo', vungmien: 'Nam' },
  { madanhmuc: 'DM002', tendanhmuc: 'Gia vị mắm', vungmien: 'Trung' },
  { madanhmuc: 'DM003', tendanhmuc: 'Thịt khô', vungmien: 'Bắc' },
  { madanhmuc: 'DM004', tendanhmuc: 'Chả giò', vungmien: 'Nam' },
];

const daysUntil = (dateStr) => {
  if (!dateStr) return 999;
  const ms = new Date(dateStr) - new Date();
  return Math.ceil(ms / 86400000);
};

const formatVND = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

// ===== PRODUCT FORM MODAL =====
function ProductFormModal({ product, categories, onClose, onSave, isSaving }) {
  const [isUploading, setIsUploading] = useState(false);
  const isEdit = !!product;
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      tenSanpham: product.tensanpham,
      maDanhMuc: product.madanhmuc,
      donViTinh: product.donvitinh,
      giaDon: product.giadon,
      motaSanpham: product.motasanpham || '',
      hanSuDung: product.hansudung ? product.hansudung.split('T')[0] : '',
      maNCC: product.mancc || '',
      trangThai: product.trangthai || 'Còn hàng',
      hinhAnh: product.hinhanh || '',
    } : {
      tenSanpham: '',
      maDanhMuc: '',
      donViTinh: '',
      giaDon: '',
      motaSanpham: '',
      hanSuDung: '',
      maNCC: '',
      trangThai: 'Còn hàng',
      hinhAnh: '',
    }
  });

  const hinhAnhUrl = watch('hinhAnh');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await productApi.uploadImage(formData);
      setValue('hinhAnh', res.data.url, { shouldDirty: true, shouldValidate: true });
      toast.success('Tải ảnh lên thành công!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Lỗi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data) => {
    onSave({
      ...data,
      giaDon: parseFloat(data.giaDon),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-heading text-brand-dark">
            {isEdit ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
            <input
              {...register('tenSanpham', { required: 'Vui lòng nhập tên sản phẩm' })}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="VD: Bánh Pía Sầu Riêng Sóc Trăng"
            />
            {errors.tenSanpham && <p className="text-red-500 text-xs mt-1">{errors.tenSanpham.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Danh mục <span className="text-red-500">*</span></label>
              <select
                {...register('maDanhMuc', { required: 'Vui lòng chọn danh mục' })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.madanhmuc} value={c.madanhmuc}>{c.tendanhmuc} ({c.vungmien})</option>
                ))}
              </select>
              {errors.maDanhMuc && <p className="text-red-500 text-xs mt-1">{errors.maDanhMuc.message}</p>}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Đơn vị tính <span className="text-red-500">*</span></label>
              <input
                {...register('donViTinh', { required: 'Vui lòng nhập đơn vị tính' })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="VD: Hộp, Gói, Chai..."
              />
              {errors.donViTinh && <p className="text-red-500 text-xs mt-1">{errors.donViTinh.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Đơn giá (VNĐ) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...register('giaDon', { required: 'Vui lòng nhập giá', min: { value: 0, message: 'Giá không được âm' } })}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="0"
              />
              {errors.giaDon && <p className="text-red-500 text-xs mt-1">{errors.giaDon.message}</p>}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Hạn sử dụng</label>
              <input
                type="date"
                {...register('hanSuDung')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Mô tả sản phẩm</label>
            <textarea
              {...register('motaSanpham')}
              rows={3}
              className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              placeholder="Mô tả chi tiết về sản phẩm..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Hình ảnh sản phẩm</label>
            <div className="flex items-center gap-4">
              {hinhAnhUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-brand-light bg-gray-50 flex-shrink-0">
                  <img src={hinhAnhUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                    isUploading 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-brand-primary border-brand-primary hover:bg-brand-primary/5'
                  }`}
                >
                  {isUploading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Đang tải lên...</>
                  ) : (
                    'Chọn ảnh từ máy tính'
                  )}
                </label>
                {/* Hidden input to register with form */}
                <input type="hidden" {...register('hinhAnh')} />
              </div>
            </div>
            {hinhAnhUrl && <p className="text-xs text-green-600 mt-2 font-medium">Đã tải ảnh lên thành công.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Mã NCC</label>
              <input
                {...register('maNCC')}
                className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="VD: NCC001"
              />
            </div>

            {/* Status (only for edit) */}
            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Trạng thái <span className="text-red-500">*</span></label>
                <select
                  {...register('trangThai', { required: 'Vui lòng chọn trạng thái' })}
                  className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                >
                  <option value="Còn hàng">Còn hàng</option>
                  <option value="Hết hàng">Hết hàng</option>
                  <option value="Ngừng bán">Ngừng bán</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              {isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== PRODUCT DETAIL MODAL =====
function ProductDetailModal({ product, onClose }) {
  if (!product) return null;
  const days = daysUntil(product.hansudung);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-brand-light flex-shrink-0">
          <h3 className="text-lg font-bold font-heading text-brand-dark">Chi tiết Sản phẩm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-8 py-4">
          <div className="space-y-0 text-sm divide-y divide-brand-light">
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Mã SP</span><span className="font-bold">{product.masanpham}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Tên sản phẩm</span><span className="font-semibold text-right max-w-xs">{product.tensanpham}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Danh mục</span><span>{product.tendanhmuc || product.madanhmuc}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Vùng miền</span><span>{product.vungmien || '—'}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Đơn vị tính</span><span>{product.donvitinh || '—'}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Đơn giá</span><span className="font-bold text-brand-accent">{formatVND(product.giadon)}</span></div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Tồn kho</span><span className="font-bold">{product.soluongton}</span></div>
            <div className="flex justify-between py-2.5 items-center">
              <span className="text-gray-500">Hạn sử dụng</span>
              {product.hansudung ? (
                <span className={`font-bold text-xs px-3 py-1 rounded-full ${days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {new Date(product.hansudung).toLocaleDateString('vi-VN')} ({days > 0 ? `còn ${days} ngày` : 'Đã hết hạn'})
                </span>
              ) : <span className="text-gray-400">—</span>}
            </div>
            <div className="flex justify-between py-2.5 items-center"><span className="text-gray-500">Trạng thái</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.trangthai === 'Còn hàng' ? 'bg-green-100 text-green-700' : product.trangthai === 'Hết hàng' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {product.trangthai}
              </span>
            </div>
            <div className="flex justify-between py-2.5"><span className="text-gray-500">Mã NCC</span><span>{product.mancc || '—'}</span></div>
            {product.motasanpham && (
              <div className="py-2.5">
                <span className="text-gray-500 block mb-1">Mô tả</span>
                <p className="text-brand-dark leading-relaxed">{product.motasanpham}</p>
              </div>
            )}
            {product.hinhanh && (
              <div className="py-2.5">
                <span className="text-gray-500 block mb-2">Hình ảnh</span>
                <img src={product.hinhanh} alt={product.tensanpham} className="w-full max-h-48 object-contain rounded-xl border border-brand-light" />
              </div>
            )}
          </div>
        </div>
        {/* Footer - fixed */}
        <div className="px-8 pb-7 pt-4 border-t border-brand-light flex-shrink-0">
          <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition">Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ===== DELETE CONFIRM MODAL =====
function DeleteConfirmModal({ title, message, onClose, onConfirm, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark font-heading">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== WAREHOUSE INVOICE DETAIL MODAL =====
function WarehouseInvoiceDetailModal({ invoiceId, onClose }) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['warehouse-invoice-detail', invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const res = await warehouseApi.getInvoiceById(invoiceId);
      return res.data || null;
    }
  });

  const formatVND = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-4">
          <h3 className="text-xl font-bold font-heading text-brand-dark">Chi tiết Phiếu Kho: {invoiceId}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand-primary h-8 w-8" /></div>
        ) : !invoice ? (
          <p className="text-center text-gray-500 py-10">Không tìm thấy thông tin chi tiết phiếu.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-brand-bg/50 p-4 rounded-xl">
              <div><span className="text-gray-500">Loại phiếu:</span> <strong className="text-brand-dark">{invoice.loaiphieu === 'NHAP' ? 'Nhập kho' : 'Xuất kho'}</strong></div>
              <div><span className="text-gray-500">Thời gian lập:</span> <strong className="text-brand-dark">{new Date(invoice.ngaylapphieu).toLocaleString('vi-VN')}</strong></div>
              <div><span className="text-gray-500">Nhân viên kho:</span> <strong className="text-brand-dark">{invoice.manvkho}</strong></div>
              <div><span className="text-gray-500">Tổng tiền:</span> <strong className="text-brand-accent font-bold">{formatVND(invoice.tongtien)}</strong></div>
              {invoice.mancc && <div className="col-span-2"><span className="text-gray-500">Nhà cung cấp:</span> <strong className="text-brand-dark">{invoice.mancc}</strong></div>}
              {invoice.ghichu && <div className="col-span-2"><span className="text-gray-500">Ghi chú:</span> <span className="text-gray-600">{invoice.ghichu}</span></div>}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Danh sách dòng sản phẩm</h4>
              <div className="border border-brand-light rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-light/50 border-b border-brand-light font-bold text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Mã sản phẩm</th>
                      <th className="px-4 py-3">Tên sản phẩm</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {invoice.chiTiet?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg/30">
                        <td className="px-4 py-3 font-bold">{item.masanpham}</td>
                        <td className="px-4 py-3">{item.tenSanpham}</td>
                        <td className="px-4 py-3 text-right font-semibold">{item.soluong}</td>
                        <td className="px-4 py-3 text-right">{formatVND(item.dongia)}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-accent">{formatVND(item.soluong * item.dongia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <button onClick={onClose} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm">Đóng</button>
      </div>
    </div>
  );
}

// ===== IMPORT WAREHOUSE MODAL =====
function ImportWarehouseModal({ products, onClose, onSave, isSaving }) {
  const { data: suppliers = [] } = useQuery({
    queryKey: ['warehouseSuppliers'],
    queryFn: async () => {
      const res = await supplierApi.getAll({ limit: 100 });
      return res.data?.data || [];
    }
  });

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { maNCC: '', ghiChu: '', chiTiet: [{ maSanpham: '', soLuong: 1, donGia: 0, hanSuDung: '' }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chiTiet' });

  const onSubmit = (data) => {
    const chiTiet = data.chiTiet.map(item => ({
      maSanpham: item.maSanpham,
      soLuong: parseInt(item.soLuong, 10),
      donGia: parseFloat(item.donGia),
      hanSuDung: item.hanSuDung || null
    }));
    onSave({ maNCC: data.maNCC, ghiChu: data.ghiChu, chiTiet });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-4">
          <h3 className="text-xl font-bold font-heading text-brand-dark flex items-center gap-2">
            <ArrowDownCircle className="text-green-600" /> Lập Phiếu Nhập Kho (Import)
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nhà cung cấp <span className="text-red-500">*</span></label>
              <select
                {...register('maNCC', { required: 'Vui lòng chọn nhà cung cấp' })}
                className="w-full border border-brand-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map(s => <option key={s.mancc} value={s.mancc}>{s.tenncc}</option>)}
              </select>
              {errors.maNCC && <p className="text-red-500 text-xs mt-1">{errors.maNCC.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Ghi chú</label>
              <input
                {...register('ghiChu')}
                className="w-full border border-brand-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Lý do nhập kho, người giao hàng..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-brand-light">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Danh sách dòng sản phẩm nhập</h4>
              <button
                type="button"
                onClick={() => append({ maSanpham: '', soLuong: 1, donGia: 0, hanSuDung: '' })}
                className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-brand-bg/30 p-4 rounded-xl border border-brand-light relative">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sản phẩm</label>
                    <select
                      {...register(`chiTiet.${idx}.maSanpham`, { required: 'Vui lòng chọn sản phẩm' })}
                      className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.masanpham} value={p.masanpham}>{p.tensanpham}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng</label>
                    <input
                      type="number"
                      {...register(`chiTiet.${idx}.soLuong`, { required: true, min: 1 })}
                      className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Giá nhập (VNĐ)</label>
                    <input
                      type="number"
                      {...register(`chiTiet.${idx}.donGia`, { required: true, min: 0 })}
                      className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hạn sử dụng</label>
                    <input
                      type="date"
                      {...register(`chiTiet.${idx}.hanSuDung`)}
                      className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => idx > 0 && remove(idx)}
                      disabled={idx === 0}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">Hủy</button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              Xác nhận nhập kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== EXPORT WAREHOUSE MODAL =====
function ExportWarehouseModal({ products, onClose, onSave, isSaving }) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { ghiChu: '', chiTiet: [{ maSanpham: '', soLuong: 1, donGia: 0 }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chiTiet' });
  const watchDetails = watch('chiTiet');

  const onSubmit = (data) => {
    for (const item of data.chiTiet) {
      const prod = products.find(p => p.masanpham === item.maSanpham);
      if (prod && prod.soluongton < parseInt(item.soLuong, 10)) {
        toast.error(`Sản phẩm [${prod.tensanpham}] không đủ tồn kho để xuất! (Tồn kho hiện tại: ${prod.soluongton})`);
        return;
      }
    }

    const chiTiet = data.chiTiet.map(item => ({
      maSanpham: item.maSanpham,
      soLuong: parseInt(item.soLuong, 10),
      donGia: parseFloat(item.donGia)
    }));
    onSave({ ghiChu: data.ghiChu, chiTiet });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-light pb-4">
          <h3 className="text-xl font-bold font-heading text-brand-dark flex items-center gap-2">
            <ArrowUpCircle className="text-red-600" /> Lập Phiếu Xuất Kho (Export)
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Ghi chú</label>
            <input
              {...register('ghiChu')}
              className="w-full border border-brand-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Lý do xuất kho, người nhận hàng..."
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-brand-light">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Danh sách dòng sản phẩm xuất</h4>
              <button
                type="button"
                onClick={() => append({ maSanpham: '', soLuong: 1, donGia: 0 })}
                className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => {
                const selectedProdId = watchDetails?.[idx]?.maSanpham;
                const selectedProd = products.find(p => p.masanpham === selectedProdId);
                const currentStock = selectedProd ? selectedProd.soluongton : 0;
                
                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-brand-bg/30 p-4 rounded-xl border border-brand-light">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Sản phẩm</label>
                      <select
                        {...register(`chiTiet.${idx}.maSanpham`, { required: 'Vui lòng chọn sản phẩm' })}
                        className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map(p => <option key={p.masanpham} value={p.masanpham}>{p.tensanpham} (Kho: {p.soluongton})</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 flex justify-between">
                        <span>Số lượng</span>
                        {selectedProd && <span className="text-[10px] text-gray-400">(Kho: {currentStock})</span>}
                      </label>
                      <input
                        type="number"
                        {...register(`chiTiet.${idx}.soLuong`, {
                          required: true,
                          min: 1,
                          max: { value: currentStock, message: `Vượt quá hàng tồn kho (${currentStock})` }
                        })}
                        className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Giá xuất (VNĐ)</label>
                      <input
                        type="number"
                        {...register(`chiTiet.${idx}.donGia`, { required: true, min: 0 })}
                        className="w-full border border-brand-light rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => idx > 0 && remove(idx)}
                        disabled={idx === 0}
                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-brand-light">
            <button type="button" onClick={onClose} className="flex-1 border border-brand-light text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">Hủy</button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
              Xác nhận xuất kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ===== MAIN PRODUCTS PAGE =====
export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Warehouse states
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [warehousePage, setWarehousePage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch products (fetch all if activeTab === 'warehouse' to populate modals, otherwise fetch paginated)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, search, activeTab],
    queryFn: async () => {
      try {
        const params = activeTab === 'products'
          ? { page, limit: 12, search: search || undefined }
          : { page: 1, limit: 1000 }; // Fetch all products for modal lists
        const res = await productApi.getAll(params);
        const raw = res.data;
        if (raw && raw.data && raw.total !== undefined) return raw;
        const arr = Array.isArray(raw) ? raw : (raw?.data || raw?.items || []);
        return { data: arr, total: arr.length, page: 1, totalPages: 1 };
      } catch {
        return { data: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length, page: 1, totalPages: 1 };
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: async () => {
      try {
        const res = await productApi.getCategories();
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return MOCK_CATEGORIES;
      }
    }
  });

  // Fetch warehouse invoices
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['warehouseInvoices', warehousePage, typeFilter],
    enabled: activeTab === 'warehouse',
    queryFn: async () => {
      try {
        const res = await warehouseApi.getInvoices({ page: warehousePage, limit: 10, loaiPhieu: typeFilter || undefined });
        return res.data || { data: [], totalItems: 0, totalPages: 1 };
      } catch {
        return { data: [], totalItems: 0, totalPages: 1 };
      }
    }
  });

  const products = productsData?.data || [];
  const totalPages = productsData?.totalPages || 1;

  const invoices = invoicesData?.data || [];
  const totalInvoicePages = invoicesData?.totalPages || 1;

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: () => {
      toast.success('Tạo sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi tạo sản phẩm')
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditProduct(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật sản phẩm')
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xóa sản phẩm')
  });

  // Import warehouse mutation
  const importMutation = useMutation({
    mutationFn: (data) => warehouseApi.createImport(data),
    onSuccess: () => {
      toast.success('Lập phiếu nhập kho thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseInvoices'] });
      setShowImport(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi nhập kho')
  });

  // Export warehouse mutation
  const exportMutation = useMutation({
    mutationFn: (data) => warehouseApi.createExport(data),
    onSuccess: () => {
      toast.success('Lập phiếu xuất kho thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseInvoices'] });
      setShowExport(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi xuất kho')
  });

  const filtered = activeTab === 'products'
    ? products.filter(p =>
        !search ||
        p.tensanpham?.toLowerCase().includes(search.toLowerCase()) ||
        p.masanpham?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const expiringSoon = products.filter(p => daysUntil(p.hansudung) <= 7).length;
  const formatVND = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-light pb-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-heading">Sản phẩm & Kho hàng</h1>
          <p className="text-sm text-gray-500">Quản lý danh sách sản phẩm, tồn kho, hạn sử dụng và lịch sử xuất nhập kho</p>
        </div>

        {/* Action Buttons based on Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'products' ? (
            <>
              {expiringSoon > 0 && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-xl">
                  <AlertTriangle size={16} />
                  {expiringSoon} sản phẩm sắp hết hạn
                </div>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/95 transition shadow-sm text-sm"
              >
                <Plus size={18} />
                Thêm sản phẩm
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 transition shadow-sm text-sm"
              >
                <ArrowDownCircle size={18} />
                Nhập kho
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-2 bg-red-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-red-700 transition shadow-sm text-sm"
              >
                <ArrowUpCircle size={18} />
                Xuất kho
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-brand-light gap-6">
        <button
          onClick={() => { setActiveTab('products'); setSearch(''); setPage(1); }}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'products' ? 'border-brand-primary text-brand-dark font-black' : 'border-transparent text-gray-400 hover:text-brand-dark'
          }`}
        >
          <Package size={18} />
          Danh sách Sản phẩm & Tồn kho
        </button>
        <button
          onClick={() => { setActiveTab('warehouse'); setWarehousePage(1); }}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'warehouse' ? 'border-brand-primary text-brand-dark font-black' : 'border-transparent text-gray-400 hover:text-brand-dark'
          }`}
        >
          <History size={18} />
          Lịch sử Nhập / Xuất kho
        </button>
      </div>

      {/* TAB CONTENT: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm sản phẩm theo tên, mã SP..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-light/50 border-b border-brand-light">
                    <tr className="text-xs uppercase text-gray-400 font-bold">
                      <th className="px-6 py-4">Mã SP</th>
                      <th className="px-6 py-4">Tên sản phẩm</th>
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4 text-right">Đơn giá</th>
                      <th className="px-6 py-4 text-center">Tồn kho</th>
                      <th className="px-6 py-4 text-center">HSD</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có sản phẩm nào phù hợp</td></tr>
                    )}
                    {filtered.map(p => {
                      const days = daysUntil(p.hansudung);
                      const isCritical = days <= 7;
                      const isWarning = days <= 30 && !isCritical;
                      return (
                        <tr key={p.masanpham} className="hover:bg-brand-bg/50 transition">
                          <td className="px-6 py-4 font-bold text-brand-dark">{p.masanpham}</td>
                          <td className="px-6 py-4 text-brand-dark max-w-xs truncate">{p.tensanpham}</td>
                          <td className="px-6 py-4 text-gray-600">{p.tendanhmuc || p.madanhmuc}</td>
                          <td className="px-6 py-4 text-right font-bold text-brand-accent">{formatVND(p.giadon)}</td>
                          <td className="px-6 py-4 text-center font-bold">{p.soluongton}</td>
                          <td className="px-6 py-4 text-center">
                            {p.hansudung ? (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                isCritical ? 'bg-red-100 text-red-700' :
                                isWarning ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {isCritical ? `⚠ ${days}d` : isWarning ? `${days}d` : 'OK'}
                              </span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              p.trangthai === 'Còn hàng' ? 'bg-green-100 text-green-700' :
                              p.trangthai === 'Hết hàng' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {p.trangthai}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => setSelectedProduct(p)} title="Xem chi tiết" className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"><Eye size={16} /></button>
                              <button onClick={() => setEditProduct(p)} title="Chỉnh sửa" className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition"><Pencil size={16} /></button>
                              <button onClick={() => setDeleteTarget(p)} title="Xóa" className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm font-bold transition ${p === page ? 'bg-brand-primary text-brand-dark' : 'border border-brand-light text-gray-500 hover:bg-white'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: WAREHOUSE INVOICES */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phân loại:</label>
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setWarehousePage(1); }}
                className="border border-brand-light rounded-xl px-4 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">Tất cả phiếu kho</option>
                <option value="NHAP">Phiếu Nhập kho (Import)</option>
                <option value="XUAT">Phiếu Xuất kho (Export)</option>
              </select>
            </div>
            
            <div className="text-xs text-gray-400 font-semibold">
              Tổng số phiếu kho: {invoicesData?.totalItems || 0}
            </div>
          </div>

          {/* Invoices list */}
          <div className="bg-white rounded-2xl shadow-sm border border-brand-light overflow-hidden">
            {isLoadingInvoices ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-light/50 border-b border-brand-light">
                    <tr className="text-xs uppercase text-gray-400 font-bold">
                      <th className="px-6 py-4">Mã Phiếu</th>
                      <th className="px-6 py-4 text-center">Loại phiếu</th>
                      <th className="px-6 py-4">Ngày lập</th>
                      <th className="px-6 py-4">Thủ kho</th>
                      <th className="px-6 py-4">Ghi chú</th>
                      <th className="px-6 py-4 text-right">Tổng tiền</th>
                      <th className="px-6 py-4 text-center">Thanh toán</th>
                      <th className="px-6 py-4 text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {invoices.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không tìm thấy phiếu kho nào</td></tr>
                    )}
                    {invoices.map(inv => (
                      <tr key={inv.maphieu} className="hover:bg-brand-bg/50 transition">
                        <td className="px-6 py-4 font-bold text-brand-dark">{inv.maphieu}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                            inv.loaiphieu === 'NHAP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {inv.loaiphieu === 'NHAP' ? 'Nhập kho' : 'Xuất kho'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(inv.ngaylapphieu).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-brand-dark text-xs">{inv.manvkho}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-xs">{inv.ghichu || '—'}</td>
                        <td className="px-6 py-4 text-right font-bold text-brand-accent">{formatVND(inv.tongtien)}</td>
                        <td className="px-6 py-4 text-center">
                          {inv.loaiphieu === 'NHAP' ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              inv.trangthaitt === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {inv.trangthaitt}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedInvoiceId(inv.maphieu)}
                            className="p-2 rounded-lg text-brand-accent hover:bg-brand-primary/10 transition"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Warehouse pagination */}
          {totalInvoicePages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setWarehousePage(p => Math.max(1, p - 1))} disabled={warehousePage === 1} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).slice(Math.max(0, warehousePage - 3), warehousePage + 2).map(p => (
                <button key={p} onClick={() => setWarehousePage(p)} className={`w-10 h-10 rounded-xl text-sm font-bold transition ${p === warehousePage ? 'bg-brand-primary text-brand-dark' : 'border border-brand-light text-gray-500 hover:bg-white'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setWarehousePage(p => Math.min(totalInvoicePages, p + 1))} disabled={warehousePage === totalInvoicePages} className="p-2 rounded-xl border border-brand-light hover:bg-white transition disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ALL MODALS */}
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      
      <WarehouseInvoiceDetailModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />

      {showForm && (
        <ProductFormModal
          product={null}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
        />
      )}

      {editProduct && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => setEditProduct(null)}
          onSave={(data) => updateMutation.mutate({ id: editProduct.masanpham, data })}
          isSaving={updateMutation.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Xóa sản phẩm?"
          message={`Bạn có chắc muốn xóa sản phẩm "${deleteTarget.tensanpham}" (${deleteTarget.masanpham})? Hành động này không thể hoàn tác.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.masanpham)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {showImport && (
        <ImportWarehouseModal
          products={products}
          onClose={() => setShowImport(false)}
          onSave={(data) => importMutation.mutate(data)}
          isSaving={importMutation.isPending}
        />
      )}

      {showExport && (
        <ExportWarehouseModal
          products={products}
          onClose={() => setShowExport(false)}
          onSave={(data) => exportMutation.mutate(data)}
          isSaving={exportMutation.isPending}
        />
      )}

    </div>
  );
}
