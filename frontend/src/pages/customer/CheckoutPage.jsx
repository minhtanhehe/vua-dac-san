import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { orderApi } from '../../api/orderApi';
import api from '../../api/axios';
import { MapPin, Plus, Loader2, CreditCard, DollarSign, Sparkles, X, Tag, ChevronDown, CheckCircle2, Ticket } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCartStore } from '../../store/useCartStore';
import { formatVND } from '../../lib/utils';

function PromoLabel({ loaiMa, giaTriGiam }) {
  const badge = loaiMa === 'PHAN_TRAM'
    ? `Giảm ${giaTriGiam}%`
    : loaiMa === 'FREESHIP'
      ? 'Miễn phí ship'
      : `Giảm ${formatVND(giaTriGiam)}`;
  return (
    <span className="inline-flex items-center gap-1 bg-brand-primary/20 text-brand-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
      <Tag size={9} /> {badge}
    </span>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');

  const cart = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (cart.length === 0) {
      toast.warning('Giỏ hàng của bạn đang trống');
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  // Fetch customer profile
  const { data: customer, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
    queryKey: ['my-profile'],
    retry: false,
    queryFn: async () => {
      const res = await customerApi.getMe();
      const profile = res.data;
      if (profile && profile.diaChi && profile.diaChi.length > 0) {
        const def = profile.diaChi.find(a => a.lamacdinh) || profile.diaChi[0];
        setSelectedAddressId(def.madiaChi || def.madiachi);
      }
      return profile;
    }
  });

  // Fetch available promos
  const { data: availablePromos = [] } = useQuery({
    queryKey: ['available-promos'],
    queryFn: async () => {
      const res = await api.get('/orders/promos/available');
      return res.data || [];
    },
    staleTime: 60000
  });

  // Mutation to add address
  const addAddressMutation = useMutation({
    mutationFn: (data) => customerApi.addAddress(customer.makhachhang, data),
    onSuccess: (res) => {
      toast.success('Thêm địa chỉ nhận hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setShowAddressModal(false);
      setNewAddressText('');
      const newAddrId = res.data?.address?.madiaChi || res.data?.address?.madiachi;
      if (newAddrId) setSelectedAddressId(newAddrId);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể thêm địa chỉ')
  });

  // Mutation to submit order
  const checkoutMutation = useMutation({
    mutationFn: (data) => orderApi.create(data),
    onSuccess: () => {
      toast.success('Đặt hàng thành công! Vua Đặc Sản cảm ơn quý khách.');
      clearCart();
      navigate('/');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho hoặc thông tin nhập.')
  });

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    addAddressMutation.mutate({
      diaChiChiTiet: newAddressText.trim(),
      laMacDinh: customer?.diaChi?.length === 0
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * (item.product.giaDon || item.product.giadon || 0), 0);
  const shippingFee = 30000;

  // Calculate discount based on applied promo
  const calcDiscount = (promo) => {
    if (!promo) return 0;
    if (promo.loaima === 'PHAN_TRAM') return Math.min(subtotal * (parseFloat(promo.giatrigiam) / 100), subtotal);
    if (promo.loaima === 'TRU_TIEN') return Math.min(parseFloat(promo.giatrigiam), subtotal);
    if (promo.loaima === 'FREESHIP') return shippingFee;
    return 0;
  };

  const discount = calcDiscount(appliedPromo);
  const total = Math.max(0, subtotal + shippingFee - discount);

  const applyPromo = (promo) => {
    if (parseFloat(promo.dontoithieu) > subtotal) {
      toast.error(`Đơn hàng chưa đạt giá trị tối thiểu ${formatVND(promo.dontoithieu)} để dùng mã này`);
      return;
    }
    setAppliedPromo(promo);
    setCouponCode(promo.makhuyenmai);
    setShowPromoModal(false);
    toast.success(`Áp dụng mã "${promo.makhuyenmai}" thành công!`);
  };

  const applyManualCode = () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    const found = availablePromos.find(p => p.makhuyenmai === code);
    if (!found) {
      toast.error('Mã khuyến mãi không tồn tại hoặc đã hết hạn');
      return;
    }
    applyPromo(found);
    setManualCode('');
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setCouponCode('');
    toast.info('Đã xóa mã khuyến mãi');
  };

  const handlePlaceOrder = () => {
    if (!customer) return;
    if (!selectedAddressId) {
      toast.error('Vui lòng thêm địa chỉ nhận hàng trước khi thanh toán');
      return;
    }
    const payload = {
      maKhachHang: customer.makhachhang,
      maDiaChi: selectedAddressId,
      pThucThanhToan: paymentMethod === 'Chuyển khoản' ? 'QR' : paymentMethod,
      maKhuyenMai: couponCode || null,
      sanPham: cart.map(item => ({
        maSanpham: item.product.maSanpham || item.product.masanpham,
        soLuong: item.quantity
      }))
    };
    checkoutMutation.mutate(payload);
  };

  if (isProfileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-brand-bg px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600 mb-4">
            <X size={28} />
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2 font-heading">Lỗi xác thực hồ sơ</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Không tìm thấy thông tin Khách hàng tương ứng với tài khoản này. Vui lòng đảm bảo bạn đang sử dụng tài khoản Khách hàng để mua hàng (Tài khoản Nhân viên không được phép checkout).
          </p>
          <button onClick={() => navigate('/')} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm">
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingProfile || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
        <p className="text-sm text-gray-500 font-medium">Đang đối soát thông tin tài khoản...</p>
      </div>
    );
  }

  if (customer.trangthai === 0 || customer.trangthai === '0') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-brand-bg px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600 mb-4">
            <X size={28} />
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2 font-heading">Tài khoản bị khóa</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Tài khoản của bạn hiện đang bị khóa. Bạn không thể thực hiện chức năng thanh toán và đặt hàng lúc này. Vui lòng liên hệ bộ phận Chăm sóc Khách hàng để được hỗ trợ.
          </p>
          <button onClick={() => navigate('/')} className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm shadow-sm">
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-8">

        <h1 className="text-2xl font-bold font-heading text-brand-dark mb-4">
          Xác nhận đặt hàng &amp; Thanh toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form details */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Recipient Information */}
            <div className="bg-white rounded-2xl border border-brand-light p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-brand-dark text-base font-heading flex items-center gap-2 border-b border-brand-light pb-3">
                <MapPin size={18} className="text-brand-primary" />
                Địa chỉ nhận hàng
              </h3>

              <div className="text-sm space-y-1">
                <div className="font-bold text-brand-dark">{customer.hoten}</div>
                <div className="text-gray-500">Số điện thoại: {customer.sdt}</div>
                <div className="text-gray-500">Email: {customer.email}</div>
              </div>

              <div className="space-y-3 pt-3">
                {customer.diaChi && customer.diaChi.length > 0 ? (
                  customer.diaChi.map(addr => {
                    const addrId = addr.madiaChi || addr.madiachi;
                    return (
                      <label
                        key={addrId}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${selectedAddressId === addrId
                          ? 'border-brand-primary bg-brand-primary/5'
                          : 'border-brand-light hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addrId}
                          onChange={() => setSelectedAddressId(addrId)}
                          className="mt-1 text-brand-primary focus:ring-brand-primary"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-brand-dark">{addr.diachichitiet || addr.diaChiChiTiet}</p>
                          {addr.lamacdinh && (
                            <span className="inline-block bg-brand-light text-brand-dark font-bold text-[9px] px-2 py-0.5 rounded-full mt-1.5 uppercase">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    Bạn chưa cấu hình địa chỉ nhận hàng nào. Vui lòng bấm thêm địa chỉ mới để tiếp tục đặt hàng.
                  </div>
                )}

                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-2 text-sm text-brand-accent hover:underline font-bold pt-1.5"
                >
                  <Plus size={16} /> Thêm địa chỉ nhận hàng mới
                </button>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white rounded-2xl border border-brand-light p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-brand-dark text-base font-heading flex items-center gap-2 border-b border-brand-light pb-3">
                <CreditCard size={18} className="text-brand-primary" />
                Phương thức thanh toán
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${paymentMethod === 'COD' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-light hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="text-brand-primary focus:ring-brand-primary" />
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={18} className="text-green-600" />
                    <div>
                      <p className="font-bold text-brand-dark">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-xs text-gray-400">Trả tiền mặt khi Shipper giao hàng</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${paymentMethod === 'Chuyển khoản' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-light hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" checked={paymentMethod === 'Chuyển khoản'} onChange={() => setPaymentMethod('Chuyển khoản')} className="text-brand-primary focus:ring-brand-primary" />
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard size={18} className="text-blue-600" />
                    <div>
                      <p className="font-bold text-brand-dark">Chuyển khoản Ngân hàng</p>
                      <p className="text-xs text-gray-400">Quét mã QR/Chuyển khoản trước khi nhận</p>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'Chuyển khoản' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800 space-y-3">
                  <p className="font-bold">Thông tin chuyển khoản Vua Đặc Sản:</p>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-blue-600">Ngân hàng:</span>
                    <strong className="text-brand-dark">Techcombank (Ngân hàng Kỹ thương)</strong>
                    <span className="text-blue-600">Số tài khoản:</span>
                    <strong className="text-brand-dark">19034567891011</strong>
                    <span className="text-blue-600">Chủ tài khoản:</span>
                    <strong className="text-brand-dark">CONG TY TNHH VUA DAC SAN</strong>
                    <span className="text-blue-600">Số tiền:</span>
                    <strong className="text-brand-dark text-brand-accent">{formatVND(total)}</strong>
                    <span className="text-blue-600">Nội dung chuyển:</span>
                    <strong className="text-brand-dark">VDS {customer.makhachhang}</strong>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">* Đơn hàng sẽ được bộ phận Bán hàng duyệt ngay sau khi nhận được tiền chuyển khoản thành công.</p>
                </div>
              )}
            </div>

          </div>

          {/* Checkout review sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-brand-light p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-brand-dark text-base font-heading border-b border-brand-light pb-4">
                Danh sách mua hàng ({cart.length})
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-brand-light pr-1">
                {cart.map(item => {
                  const productId = item.product.maSanpham || item.product.masanpham;
                  const productName = item.product.tenSanpham || item.product.tensanpham;
                  const productPrice = item.product.giaDon || item.product.giadon || 0;
                  const productUnit = item.product.donViTinh || item.product.donvitinh || 'Gói';
                  return (
                    <div key={productId} className="py-3 flex justify-between gap-4 text-xs">
                      <div className="flex-1 space-y-0.5">
                        <div className="font-bold text-brand-dark">{productName}</div>
                        <div className="text-gray-400">{item.quantity} {productUnit} x {formatVND(productPrice)}</div>
                      </div>
                      <span className="font-semibold text-brand-dark text-right">{formatVND(item.quantity * productPrice)}</span>
                    </div>
                  );
                })}
              </div>

              {/* --- PROMO SECTION --- */}
              <div className="pt-2 border-t border-brand-light space-y-3">
                <p className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-primary" /> Mã giảm giá
                </p>

                {/* Applied promo badge */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-800">{appliedPromo.makhuyenmai}</p>
                        <PromoLabel loaiMa={appliedPromo.loaima} giaTriGiam={appliedPromo.giatrigiam} />
                      </div>
                    </div>
                    <button onClick={removePromo} className="text-red-400 hover:text-red-600 transition ml-2">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPromoModal(true)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-dashed border-brand-primary/50 rounded-xl text-xs text-brand-secondary font-semibold hover:bg-brand-primary/5 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Ticket size={14} />
                      {availablePromos.length > 0 ? `Chọn 1 trong ${availablePromos.length} mã có sẵn` : 'Nhập mã khuyến mãi'}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>

              {/* Pricing details */}
              <div className="space-y-2.5 pt-2 border-t border-brand-light text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Tổng tiền sản phẩm:</span>
                  <span className="font-semibold text-brand-dark">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className={`font-semibold ${appliedPromo?.loaima === 'FREESHIP' ? 'line-through text-gray-400' : 'text-brand-dark'}`}>
                    {formatVND(shippingFee)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedPromo?.makhuyenmai}):</span>
                    <span className="font-bold">- {formatVND(discount)}</span>
                  </div>
                )}
              </div>

              {/* Total payment */}
              <div className="border-t border-brand-light pt-4 flex justify-between items-baseline">
                <span className="font-bold text-sm text-brand-dark">Tổng tiền thanh toán:</span>
                <span className="text-xl font-black text-brand-accent font-heading">{formatVND(total)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={checkoutMutation.isPending}
                className="w-full bg-brand-primary text-brand-dark font-bold py-4 rounded-xl hover:bg-brand-primary/95 transition shadow-sm text-sm text-center flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                Xác nhận đặt hàng
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-brand-light pb-3">
              <h3 className="font-bold font-heading text-brand-dark text-base">Thêm địa chỉ nhận hàng</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAddressSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-dark">Địa chỉ giao hàng chi tiết</label>
                <textarea required rows={3} value={newAddressText} onChange={e => setNewAddressText(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white resize-none" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-brand-light">
                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 border border-brand-light text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={addAddressMutation.isPending} className="flex-1 bg-brand-primary text-brand-dark font-bold py-2.5 rounded-xl text-sm hover:bg-brand-primary/95 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {addAddressMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMO PICKER MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPromoModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-brand-light pb-3">
              <h3 className="font-bold font-heading text-brand-dark text-base flex items-center gap-2">
                <Ticket size={18} className="text-brand-primary" /> Chọn mã khuyến mãi
              </h3>
              <button onClick={() => setShowPromoModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Manual code input */}
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã thủ công..."
                className="flex-1 px-3 py-2 bg-brand-bg/50 border border-brand-light rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase"
                onKeyDown={e => e.key === 'Enter' && applyManualCode()}
              />
              <button onClick={applyManualCode} className="px-4 py-2 bg-brand-primary text-brand-dark font-bold text-xs rounded-xl hover:bg-brand-primary/90 transition">
                Áp dụng
              </button>
            </div>

            {/* Promo list */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {availablePromos.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Hiện không có mã khuyến mãi nào</div>
              ) : (
                availablePromos.map(promo => {
                  const isEligible = subtotal >= parseFloat(promo.dontoithieu || 0);
                  return (
                    <button
                      key={promo.makhuyenmai}
                      onClick={() => isEligible && applyPromo(promo)}
                      disabled={!isEligible}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3 ${
                        isEligible
                          ? 'border-brand-primary/30 hover:bg-brand-primary/5 cursor-pointer'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <Ticket size={18} className="text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-brand-dark text-sm">{promo.makhuyenmai}</span>
                          <PromoLabel loaiMa={promo.loaima} giaTriGiam={promo.giatrigiam} />
                        </div>
                        {parseFloat(promo.dontoithieu) > 0 && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Đơn tối thiểu: {formatVND(promo.dontoithieu)}
                            {!isEligible && <span className="text-red-500 font-semibold ml-1">(Chưa đủ điều kiện)</span>}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Còn {promo.soluongtoida - promo.dasd} lượt • HSD: {new Date(promo.ngayketthuc).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
