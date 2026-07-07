import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, Calendar, Package, MapPin, Loader2, Minus, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCartStore } from '../../store/useCartStore';
import { formatVND } from '../../lib/utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  // Fetch Product Detail
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const res = await productApi.getById(id);
      return res.data || null;
    }
  });

  // Fetch Related Products (same category)
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.madanhmuc],
    enabled: !!product?.madanhmuc,
    queryFn: async () => {
      const res = await productApi.getAll({
        maDanhMuc: product.madanhmuc,
        limit: 4,
        trangThai: 'Còn hàng'
      });
      // Exclude current product
      return (res.data?.data || []).filter(p => p.masanpham !== product.masanpham);
    }
  });

  const addToCartStore = useCartStore((state) => state.addToCart);

  const handleQuantityChange = (val) => {
    if (!product) return;
    const newQty = Math.max(1, Math.min(product.soluongton, val));
    setQuantity(newQty);
  };

  const addToCart = (showToast = true) => {
    if (!product) return false;
    const success = addToCartStore(product, quantity);
    // addToCartStore already shows a toast; suppress duplicate if caller said no toast
    return success;
  };

  const handleBuyNow = () => {
    const success = addToCart(false);
    if (success) {
      navigate('/cart');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
        <p className="text-sm text-gray-500 font-medium">Đang tải tinh hoa hương vị Việt...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h3 className="text-xl font-bold text-brand-dark">Không tìm thấy đặc sản</h3>
        <p className="text-gray-400 max-w-sm mx-auto">Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh.</p>
        <button onClick={() => navigate('/products')} className="bg-brand-primary text-brand-dark font-bold px-8 py-3 rounded-xl hover:bg-brand-primary/90 transition shadow-sm text-sm">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const isOutOfStock = product.soluongton <= 0;

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Back navigation */}
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-dark transition text-sm font-semibold">
            <ArrowLeft size={16} /> Quay lại trang trước
          </button>
        </div>

        {/* Product Details Section */}
        <section className="bg-white rounded-3xl border border-brand-light p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left Panel: Image */}
          <div className="bg-gradient-to-br from-brand-light/40 to-brand-primary/10 rounded-2xl flex items-center justify-center h-[350px] md:h-[450px] overflow-hidden relative border border-brand-light">
            {product.hinhanh ? (
              <img src={product.hinhanh} alt={product.tensanpham} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">🍱</span>
            )}
            {product.vungmien && (
              <span className="absolute top-6 left-6 text-xs font-bold px-4 py-1.5 rounded-full border bg-brand-primary text-brand-dark shadow-sm">
                {product.vungmien}
              </span>
            )}
          </div>

          {/* Right Panel: Content */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Category & Region */}
              <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary">
                <span className="bg-brand-light px-3 py-1 rounded-full text-brand-dark">{product.tendanhmuc}</span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {product.vungmien}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-brand-dark leading-tight">
                {product.tensanpham}
              </h1>

              {/* Price & Stock */}
              <div className="flex items-baseline gap-4 pt-2 border-b border-brand-light pb-4">
                <span className="text-3xl font-black text-brand-accent font-heading">
                  {formatVND(product.giadon)}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isOutOfStock ? 'Tạm hết hàng' : `Còn hàng (Tồn kho: ${product.soluongton} ${product.donvitinh})`}
                </span>
              </div>

              {/* Product specifications table */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-brand-bg/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <Package size={16} className="text-brand-primary" />
                  <span>Đơn vị tính:</span>
                  <strong className="text-brand-dark">{product.donvitinh || 'Gói'}</strong>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={16} className="text-brand-primary" />
                  <span>Hạn sử dụng:</span>
                  <strong className="text-brand-dark">{product.hansudung ? `${product.hansudung} ngày` : 'Xem trên bao bì'}</strong>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-brand-dark text-sm uppercase tracking-wider">Mô tả đặc sản</h3>
                <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
                  {product.motasanpham || 'Chưa có thông tin mô tả chi tiết cho sản phẩm đặc sản này. Mọi sản phẩm của Vua Đặc Sản đều được tuyển chọn kỹ lưỡng, đảm bảo vệ sinh an toàn thực phẩm và giữ nguyên vẹn chất vị quê hương.'}
                </p>
              </div>

            </div>

            {/* Buying Block */}
            <div className="space-y-4 pt-6 border-t border-brand-light">
              {!isOutOfStock ? (
                <>
                  {/* Quantity selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-brand-dark">Số lượng mua:</span>
                    <div className="flex items-center border border-brand-light rounded-xl overflow-hidden bg-brand-bg">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="p-2.5 text-gray-500 hover:bg-brand-light transition"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                        className="w-12 text-center text-sm font-bold text-brand-dark bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="p-2.5 text-gray-500 hover:bg-brand-light transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => addToCart(true)}
                      className="flex-1 flex items-center justify-center gap-2 border border-brand-dark text-brand-dark font-bold py-3.5 rounded-xl hover:bg-brand-light transition"
                    >
                      <ShoppingCart size={18} />
                      Thêm vào giỏ hàng
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-[#D4A373] text-[#1A1A1A] font-bold py-3.5 rounded-xl hover:bg-[#c39262] transition shadow-sm text-center"
                    >
                      Mua ngay
                    </button>
                  </div>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed"
                >
                  Sản phẩm tạm hết hàng
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Benefits bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-500">
          <div className="bg-white p-6 rounded-2xl border border-brand-light flex items-center gap-3">
            <ShieldCheck size={28} className="text-brand-primary" />
            <div>
              <div className="font-bold text-brand-dark">Đặc sản chính gốc</div>
              <div className="text-xs text-gray-400 mt-0.5">Cam kết nguồn gốc truyền thống</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-brand-light flex items-center gap-3">
            <Truck size={28} className="text-brand-primary" />
            <div>
              <div className="font-bold text-brand-dark">Giao hàng nhanh toàn quốc</div>
              <div className="text-xs text-gray-400 mt-0.5">Đóng gói giữ nguyên hương vị</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-brand-light flex items-center gap-3">
            <RefreshCw size={28} className="text-brand-primary" />
            <div>
              <div className="font-bold text-brand-dark">Đổi trả uy tín</div>
              <div className="text-xs text-gray-400 mt-0.5">Hoàn tiền 100% nếu phát hiện lỗi</div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6">
            <h2 className="text-xl font-bold font-heading text-brand-dark">Đặc sản cùng danh mục</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <Link
                  key={p.masanpham}
                  to={`/products/${p.masanpham}`}
                  className="bg-white rounded-2xl overflow-hidden border border-brand-light p-4 shadow-sm hover:shadow-md transition-all duration-300 group block"
                >
                  <div className="h-32 bg-brand-bg rounded-xl flex items-center justify-center overflow-hidden mb-3">
                    {p.hinhanh ? (
                      <img src={p.hinhanh} alt={p.tensanpham} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    ) : (
                      <span className="text-3xl">🍱</span>
                    )}
                  </div>
                  <h3 className="font-bold text-brand-dark text-xs leading-snug line-clamp-2 min-h-[32px] group-hover:text-brand-accent transition">
                    {p.tensanpham}
                  </h3>
                  <div className="text-brand-accent font-bold text-sm mt-2">{formatVND(p.giadon)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
