import { create } from 'zustand';
import { toast } from 'react-toastify';

const CART_KEY = 'vds_cart';

/**
 * Normalize a product from API response (lowercase keys) into the
 * canonical cart product shape (camelCase keys).
 */
const normalizeProduct = (product) => ({
  maSanpham:  product.maSanpham  ?? product.masanpham,
  tenSanpham: product.tenSanpham ?? product.tensanpham,
  giaDon:     product.giaDon     ?? product.giadon,
  soLuongTon: product.soLuongTon ?? product.soluongton,
  donViTinh:  product.donViTinh  ?? product.donvitinh,
  hinhAnh:    product.hinhAnh    ?? product.hinhanh,
  vungMien:   product.vungMien   ?? product.vungmien,
  tenDanhMuc: product.tenDanhMuc ?? product.tendanhmuc,
});

const readFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const writeToStorage = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  // Notify all other components (e.g. header badge) about the cart change
  window.dispatchEvent(new Event('storage'));
};

export const useCartStore = create((set, get) => ({
  items: readFromStorage(),

  /** Re-sync store state from localStorage (called on storage events from other tabs). */
  syncFromStorage: () => {
    set({ items: readFromStorage() });
  },

  /**
   * Add a product (from API, lowercase keys) to the cart.
   * @param {object} product - Product object from API response.
   * @param {number} qty - Quantity to add (default 1).
   * @returns {boolean} true if added successfully, false if stock exceeded.
   */
  addToCart: (product, qty = 1) => {
    try {
      const normalized = normalizeProduct(product);
      const items = [...get().items];
      const existingIdx = items.findIndex(
        (item) => item.product.maSanpham === normalized.maSanpham
      );

      const currentQty = existingIdx >= 0 ? items[existingIdx].quantity : 0;

      if (currentQty + qty > normalized.soLuongTon) {
        toast.error(
          `Sản phẩm "${normalized.tenSanpham}" chỉ còn ${normalized.soLuongTon} sản phẩm trong kho!`
        );
        return false;
      }

      if (existingIdx >= 0) {
        items[existingIdx] = {
          ...items[existingIdx],
          quantity: items[existingIdx].quantity + qty,
        };
      } else {
        items.push({ product: normalized, quantity: qty });
      }

      writeToStorage(items);
      set({ items });
      toast.success(
        qty === 1
          ? `Đã thêm "${normalized.tenSanpham}" vào giỏ hàng!`
          : `Đã thêm ${qty} sản phẩm "${normalized.tenSanpham}" vào giỏ hàng!`
      );
      return true;
    } catch (err) {
      console.error('[useCartStore] addToCart error:', err);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
      return false;
    }
  },

  /**
   * Update the quantity of a cart item by its product ID.
   * Clamps the value between 1 and the product's stock.
   * @param {string} productId
   * @param {number} newQty
   */
  updateQuantity: (productId, newQty) => {
    const items = get().items.map((item) => {
      if (item.product.maSanpham === productId) {
        const stock = item.product.soLuongTon ?? 999;
        const clamped = Math.max(1, Math.min(stock, newQty));
        if (clamped !== newQty) {
          toast.warning(`Sản phẩm chỉ còn ${stock} trong kho!`);
        }
        return { ...item, quantity: clamped };
      }
      return item;
    });
    writeToStorage(items);
    set({ items });
  },

  /**
   * Remove a product from the cart by its product ID.
   * @param {string} productId
   */
  removeItem: (productId) => {
    const items = get().items.filter(
      (item) => item.product.maSanpham !== productId
    );
    writeToStorage(items);
    set({ items });
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  },

  /** Remove all items from the cart. */
  clearCart: () => {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('storage'));
    set({ items: [] });
  },

  /** Total number of individual units in the cart (for badge). */
  get totalCount() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  /** Total price of all items in the cart. */
  get totalPrice() {
    return get().items.reduce(
      (sum, item) =>
        sum + item.quantity * (item.product.giaDon ?? item.product.giadon ?? 0),
      0
    );
  },
}));
