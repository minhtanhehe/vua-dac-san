import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Search, ShoppingCart, MapPin, Grid, SlidersHorizontal, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { formatVND } from '../../lib/utils';

const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
const TAG_COLORS = {
  'Miền Bắc': 'bg-red-50 text-red-700 border-red-200',
  'Miền Trung': 'bg-amber-50 text-amber-700 border-amber-200',
  'Miền Nam': 'bg-green-50 text-green-700 border-green-200',
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productApi.getCategories();
      return res.data || [];
    }
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['customer-products', page, search, selectedCategory, selectedRegion],
    queryFn: async () => {
      const res = await productApi.getAll({
        page,
        limit: 9,
        search: search || undefined,
        maDanhMuc: selectedCategory || undefined,
        vungMien: selectedRegion || undefined,
        trangThai: 'Còn hàng' // Only show in-stock products to customers
      });
      return res.data || { data: [], total: 0, totalPages: 1 };
    }
  });

  const products = productsData?.data || [];
  const totalPages = productsData?.totalPages || 1;

  const addToCart = useCartStore((state) => state.addToCart);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedRegion('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SIDEBAR FILTERS (DESKTOP) */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-light pb-4">
              <h3 className="font-bold font-heading text-lg text-brand-dark flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-brand-primary" />
                Bộ lọc tìm kiếm
              </h3>
              {(selectedCategory || selectedRegion || search) && (
                <button onClick={clearFilters} className="text-xs text-brand-accent hover:underline font-semibold">
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="font-semibold text-brand-dark text-sm uppercase tracking-wider">Danh mục sản phẩm</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedCategory(''); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition duration-150 ${
                    !selectedCategory ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-white hover:text-brand-dark'
                  }`}
                >
                  Tất cả đặc sản
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.madanhmuc}
                    onClick={() => { setSelectedCategory(cat.madanhmuc); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition duration-150 ${
                      selectedCategory === cat.madanhmuc ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-white hover:text-brand-dark'
                    }`}
                  >
                    {cat.tendanhmuc}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            <div className="space-y-3 pt-4 border-t border-brand-light">
              <h4 className="font-semibold text-brand-dark text-sm uppercase tracking-wider">Vùng miền đặc trưng</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedRegion(''); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition duration-150 ${
                    !selectedRegion ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-white hover:text-brand-dark'
                  }`}
                >
                  Tất cả các miền
                </button>
                {REGIONS.map(reg => (
                  <button
                    key={reg}
                    onClick={() => { setSelectedRegion(reg); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition duration-150 ${
                      selectedRegion === reg ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-white hover:text-brand-dark'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCTS AREA */}
          <div className="flex-1 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-brand-light">
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm kiếm đặc sản..."
                  className="w-full pl-11 pr-4 py-2.5 bg-brand-bg/50 border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition"
                />
              </div>

              {/* Mobile Filter Toggle & Count */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="text-xs text-gray-400 font-medium">
                  Hiển thị {products.length} trên tổng số {productsData?.total || 0} đặc sản
                </div>
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="md:hidden flex items-center gap-1.5 border border-brand-light px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-light transition"
                >
                  <SlidersHorizontal size={16} />
                  Lọc
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-brand-primary h-10 w-10" />
                <p className="text-sm text-gray-500 font-medium">Đang tải danh sách đặc sản tinh hoa...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white text-center py-20 rounded-2xl border border-brand-light shadow-sm">
                <Grid size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-brand-dark mb-1">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Thử đổi từ khóa tìm kiếm hoặc xóa các bộ lọc hiện tại.</p>
                <button onClick={clearFilters} className="mt-4 bg-brand-primary text-brand-dark font-bold px-6 py-2.5 rounded-xl hover:bg-brand-primary/90 transition shadow-sm text-sm">
                  Thiết lập lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(p => (
                  <div key={p.masanpham} className="bg-white rounded-[24px] overflow-hidden border border-brand-light shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-brand-primary/30 hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between">
                    
                    {/* Image Area */}
                    <Link to={`/products/${p.masanpham}`} className="block">
                      <div className="h-64 bg-gradient-to-br from-brand-light/80 to-brand-primary/10 flex items-center justify-center relative overflow-hidden">
                        {p.hinhanh ? (
                          <img src={p.hinhanh} alt={p.tensanpham} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500" />
                        ) : (
                          <span className="text-6xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-md">🍱</span>
                        )}
                        {/* Region Tag */}
                        {p.vungmien && (
                          <span className={`absolute top-4 left-4 inline-block text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-md ${TAG_COLORS[p.vungmien] || 'bg-white/90 text-gray-700'}`}>
                            {p.vungmien}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Info Area */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <Link to={`/products/${p.masanpham}`} className="block group-hover:text-brand-primary transition-colors">
                        <div className="flex items-center gap-1.5 text-xs text-brand-secondary font-bold tracking-wide mb-2 uppercase">
                          <MapPin size={12} />
                          {p.vungmien || 'Đặc sản vùng miền'}
                        </div>
                        <h3 className="font-bold text-brand-dark leading-snug text-[15px] line-clamp-2 min-h-[44px]">
                          {p.tensanpham}
                        </h3>
                      </Link>

                      <div className="flex items-center justify-between pt-4 border-t border-brand-light">
                        <div className="space-y-0.5">
                          <span className="text-2xl font-black text-brand-accent font-heading tracking-tight">
                            {formatVND(p.giadon)}
                          </span>
                          <div className="text-[11px] text-gray-400 font-medium">Đơn vị: {p.donvitinh || 'Gói'}</div>
                        </div>

                        <button
                          onClick={() => addToCart(p)}
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-light text-brand-dark hover:bg-brand-primary hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-brand-primary/30 active:scale-95 transition-all duration-300"
                          title="Thêm vào giỏ"
                        >
                          <ShoppingCart size={20} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-brand-light bg-white hover:bg-gray-50 transition disabled:opacity-30 disabled:hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition ${
                      p === page ? 'bg-brand-primary text-brand-dark shadow-sm' : 'border border-brand-light bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-brand-light bg-white hover:bg-gray-50 transition disabled:opacity-30 disabled:hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MOBILE FILTERS DRAWER (Overlay) */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowMobileFilters(false)}>
          <div className="bg-white w-80 max-w-full h-full p-6 space-y-6 flex flex-col justify-between overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brand-light pb-4">
                <h3 className="font-bold font-heading text-lg text-brand-dark flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-brand-primary" />
                  Bộ lọc
                </h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <h4 className="font-semibold text-brand-dark text-xs uppercase tracking-wider">Danh mục</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                      !selectedCategory ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-brand-bg'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.madanhmuc}
                      onClick={() => { setSelectedCategory(cat.madanhmuc); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        selectedCategory === cat.madanhmuc ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-brand-bg'
                      }`}
                    >
                      {cat.tendanhmuc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div className="space-y-3 pt-4 border-t border-brand-light">
                <h4 className="font-semibold text-brand-dark text-xs uppercase tracking-wider">Vùng miền</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedRegion(''); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                      !selectedRegion ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-brand-bg'
                    }`}
                  >
                    Tất cả các miền
                  </button>
                  {REGIONS.map(reg => (
                    <button
                      key={reg}
                      onClick={() => { setSelectedRegion(reg); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                        selectedRegion === reg ? 'bg-brand-primary text-brand-dark font-bold' : 'text-gray-600 hover:bg-brand-bg'
                      }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-light">
              <button
                onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                className="w-full bg-brand-light hover:bg-brand-light/90 text-brand-dark font-bold py-3 rounded-xl transition text-sm text-center"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
