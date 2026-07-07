import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, Package, ImageOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { formatVND } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'react-toastify';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Read cart state and actions from the central store
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.product.giaDon ?? item.product.giadon ?? 0),
    0
  );
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!user) {
      toast.info('Vui lòng đăng nhập để tiến hành thanh toán');
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="bg-background min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-8 flex items-center gap-2">
          <ShoppingCart size={28} className="text-primary" />
          Giỏ hàng của bạn
        </h1>

        {items.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-16 text-center space-y-6">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto text-4xl text-muted-foreground">
                <ShoppingCart size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-foreground font-heading">Giỏ hàng của bạn đang trống</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Hãy dạo quanh cửa hàng và chọn những món đặc sản thơm ngon nhất cho gia đình nhé!
              </p>
              <Button asChild size="lg" className="mt-4">
                <Link to="/products">Tiếp tục mua sắm</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-border font-bold text-foreground hidden sm:grid sm:grid-cols-12 text-xs uppercase tracking-wider">
                  <div className="sm:col-span-6">Đặc sản</div>
                  <div className="sm:col-span-2 text-center">Đơn giá</div>
                  <div className="sm:col-span-3 text-center">Số lượng</div>
                  <div className="sm:col-span-1 text-right">Xóa</div>
                </div>

                <div className="divide-y divide-border">
                  {items.map(item => {
                    const productId   = item.product.maSanpham ?? item.product.masanpham;
                    const productName = item.product.tenSanpham ?? item.product.tensanpham;
                    const productImg  = item.product.hinhAnh    ?? item.product.hinhanh;
                    const productRegion = item.product.vungMien ?? item.product.vungmien;
                    const productPrice  = item.product.giaDon   ?? item.product.giadon ?? 0;

                    return (
                      <div key={productId} className="p-6 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
                        
                        {/* Product details */}
                        <div className="col-span-1 sm:col-span-6 flex items-center gap-4">
                          <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                            {productImg ? (
                              <img src={productImg} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <ImageOff size={32} className="text-muted-foreground" strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="space-y-1">
                            <Link to={`/products/${productId}`} className="font-bold text-foreground text-sm hover:text-accent transition leading-snug line-clamp-2">
                              {productName}
                            </Link>
                            {productRegion && (
                              <div className="text-[10px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full inline-block font-semibold">
                                {productRegion}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-1 sm:col-span-2 text-center">
                          <div className="text-xs text-muted-foreground sm:hidden mb-1">Đơn giá:</div>
                          <div className="font-semibold text-sm text-foreground">{formatVND(productPrice)}</div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="col-span-1 sm:col-span-3 flex justify-center">
                          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background">
                            <button
                              onClick={() => updateQuantity(productId, item.quantity - 1)}
                              className="p-3 text-muted-foreground hover:bg-muted active:bg-muted/80 active:scale-95 transition-all"
                              aria-label="Giảm số lượng"
                            >
                              <Minus size={14} strokeWidth={2} />
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(productId, item.quantity + 1)}
                              className="p-3 text-muted-foreground hover:bg-muted active:bg-muted/80 active:scale-95 transition-all"
                              aria-label="Tăng số lượng"
                            >
                              <Plus size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Remove item */}
                        <div className="col-span-1 sm:col-span-1 flex justify-end sm:justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(productId)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Xóa ${productName}`}
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </Button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Continue Shopping button */}
              <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition font-semibold pt-2">
                <ArrowLeft size={16} /> Tiếp tục mua sắm
              </Link>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-bold text-foreground text-lg font-heading border-b border-border pb-4">
                    Tóm tắt đơn hàng
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tổng tiền sản phẩm:</span>
                      <span className="font-semibold text-foreground">{formatVND(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí vận chuyển:</span>
                      <span className="font-semibold text-foreground">{formatVND(shippingFee)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-foreground">Tổng cộng:</span>
                    <span className="text-2xl font-black text-primary font-heading">
                      {formatVND(total)}
                    </span>
                  </div>

                  <Button 
                    variant="checkout" 
                    size="lg" 
                    className="w-full mt-4" 
                    onClick={handleCheckout}
                  >
                    Tiến hành thanh toán
                  </Button>
                </CardContent>
              </Card>

              {/* Benefits badge */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-xs text-foreground leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Package size={16} className="text-primary" strokeWidth={2} />
                  Chính sách giao hàng Đặc Sản
                </div>
                <p className="text-muted-foreground">
                  Đóng gói thùng giấy bảo vệ chuyên dụng hoặc bảo quản lạnh để đặc sản của bạn luôn tươi ngon nhất khi đến tay. Giao hàng toàn quốc trong vòng 24 - 48h.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
