import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, MapPin, ArrowRight, Search } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { useCartStore } from '../../store/useCartStore';
import { formatVND } from '../../lib/utils';

const REGIONS = [
  { name: 'Miền Bắc', desc: 'Thịt trâu gác bếp, lạp sườn hun khói, bún bò Nam Bộ', color: 'from-red-800 to-red-600', emoji: '🏔️' },
  { name: 'Miền Trung', desc: 'Mè xửng Huế, nem chua Thanh Hóa, bánh tráng Đà Nẵng', color: 'from-yellow-700 to-amber-500', emoji: '⛩️' },
  { name: 'Miền Nam', desc: 'Bánh pía Sóc Trăng, kẹo dừa Bến Tre, khô cá lóc', color: 'from-green-800 to-green-600', emoji: '🌴' },
];

const TAG_COLORS = {
  'Miền Bắc': 'bg-red-50 text-red-700 border-red-200',
  'Miền Trung': 'bg-amber-50 text-amber-700 border-amber-200',
  'Miền Nam': 'bg-green-50 text-green-700 border-green-200',
};

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState('Tất cả');
  const addToCart = useCartStore((state) => state.addToCart);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await productApi.getAll({ limit: 12, trangThai: 'Còn hàng' });
      return res.data || { data: [] };
    }
  });

  const FEATURED_PRODUCTS = productsData?.data || [];


  const filtered = FEATURED_PRODUCTS.filter(p => {
    const matchSearch = !search || p.tensanpham?.toLowerCase().includes(search.toLowerCase());
    const matchRegion = activeRegion === 'Tất cả' || p.vungmien === activeRegion;
    return matchSearch && matchRegion;
  });

  return (
    <div className="space-y-0">
      {/* HERO SECTION */}
      <section 
        className="relative bg-[#1A1A1A] text-white overflow-hidden min-h-[90vh] flex items-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=2070&auto=format&fit=crop)' }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-primary/20 -translate-y-1/3 translate-x-1/3 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-secondary/30 -translate-x-1/3 translate-y-1/3 blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
          <div className="lg:col-span-7 space-y-8 z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-brand-accent text-sm font-bold px-5 py-2.5 rounded-full tracking-wider shadow-lg">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
              TINH HOA ẨM THỰC VIỆT
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold font-heading leading-[1.1] drop-shadow-lg">
              Hương Vị <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Truyền Thống</span><br />
              Đậm Đà Bản Sắc
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-xl font-light">
              Tuyển chọn những món đặc sản vùng miền tinh tế nhất từ các làng nghề truyền thống. Tươi ngon, sạch sẽ, giao tận nơi.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a href="#products" className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-primary/90 hover:shadow-[0_0_20px_rgba(184,92,56,0.4)] hover:-translate-y-1 transition-all duration-300">
                Khám phá ngay
                <ArrowRight size={20} />
              </a>
              <Link to="/posts" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
                Câu chuyện vùng miền
              </Link>
            </div>
            {/* Stats */}
            <div className="flex gap-10 pt-8 mt-8 border-t border-white/10">
              {[
                { val: '500+', lab: 'Đặc sản' }, 
                { val: '10K+', lab: 'Khách hàng' }, 
                { val: '48h', lab: 'Giao nhanh' }
              ].map(({val, lab}) => (
                <div key={lab} className="text-left">
                  <div className="text-3xl font-black text-white font-heading tracking-tight">{val}</div>
                  <div className="text-sm text-brand-accent font-medium mt-1 uppercase tracking-wider">{lab}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Region Cards - Glassmorphism */}
          <div className="hidden lg:grid lg:col-span-5 grid-cols-1 gap-5 z-10 perspective-1000">
            {REGIONS.map((r, i) => (
              <div 
                key={r.name} 
                className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/20 hover:border-brand-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 hover:translate-x-2 transition-all duration-500 cursor-pointer group`}
                style={{ transitionDelay: `${i * 100}ms` }}
                onClick={() => {
                  setActiveRegion(r.name);
                  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center text-4xl shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {r.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-xl font-heading tracking-wide mb-1 group-hover:text-brand-accent transition-colors">
                    {r.name}
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed font-light">
                    {r.desc}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section id="products" className="bg-brand-bg py-24 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 space-y-12 z-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-extrabold text-brand-dark font-heading">Đặc Sản Nổi Bật</h2>
            <p className="text-gray-500 text-lg">Tuyển chọn những sản phẩm tinh túy nhất được khách hàng yêu thích</p>
          </div>

          {/* Interactive 3-Region Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-brand-light">
            <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {['Tất cả', ...REGIONS.map(r => r.name)].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveRegion(tab)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                    activeRegion === tab 
                    ? 'bg-brand-primary text-white shadow-md' 
                    : 'bg-brand-bg text-gray-500 hover:bg-brand-light hover:text-brand-dark'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm đặc sản..."
                className="w-full pl-11 pr-4 py-3 bg-brand-bg/50 border border-brand-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-400">
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            ) : (
              filtered.map(p => (
                <div key={p.masanpham} className="bg-white rounded-[24px] overflow-hidden border border-brand-light shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-brand-primary/30 hover:-translate-y-2 transition-all duration-300 group flex flex-col">
                  {/* Image Area */}
                  <Link to={`/products/${p.masanpham}`} className="block">
                    <div className="h-64 bg-gradient-to-br from-brand-light/80 to-brand-primary/10 flex items-center justify-center relative overflow-hidden">
                      {p.hinhanh ? (
                        <img src={p.hinhanh} alt={p.tensanpham} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500" />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-md">🍱</span>
                      )}
                      
                      {/* Tags overlay */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {p.vungmien && (
                          <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-md ${TAG_COLORS[p.vungmien] || 'bg-white/90 text-gray-700'}`}>
                            {p.vungmien}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Info Area */}
                  <div className="p-5 flex-1 flex flex-col space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-brand-secondary font-bold tracking-wide mb-2 uppercase">
                        <MapPin size={12} />
                        {p.vungmien || 'Đặc sản vùng miền'}
                      </div>
                      <Link to={`/products/${p.masanpham}`} className="block">
                        <h3 className="font-bold text-brand-dark text-[15px] leading-snug group-hover:text-brand-primary transition-colors line-clamp-2 min-h-[44px]">
                          {p.tensanpham}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex text-brand-accent">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < 4 ? "fill-current" : "fill-transparent text-gray-300"} />
                        ))}
                      </div>
                      <span className="font-bold text-sm text-brand-dark">4.5</span>
                      <span className="text-gray-400 text-xs">(99+)</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-brand-light">
                      <span className="text-2xl font-black text-brand-accent font-heading tracking-tight">{formatVND(p.giadon)}</span>
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* WHY US SECTION */}
      <section className="bg-white py-20 border-t border-brand-light">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-brand-dark font-heading">Tại sao chọn Vua Đặc Sản?</h2>
            <p className="text-gray-500 mt-2">Cam kết chất lượng, tận tâm phục vụ từng khách hàng</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🧪', title: 'Kiểm định ATTP', desc: 'Mọi sản phẩm đều có giấy chứng nhận vệ sinh an toàn thực phẩm từ cơ quan chức năng.' },
              { icon: '🚚', title: 'Giao hàng 48h', desc: 'Cam kết giao hàng trong 48 giờ toàn quốc với đóng gói chuyên biệt giữ nguyên chất lượng.' },
              { icon: '🔄', title: 'Đổi trả 7 ngày', desc: 'Không hài lòng? Chúng tôi đổi hoặc hoàn tiền trong 7 ngày kể từ khi nhận hàng.' },
            ].map(item => (
              <div key={item.title} className="bg-brand-bg rounded-2xl p-8 border border-brand-light hover:border-brand-primary/30 hover:shadow-sm transition-all duration-300">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-brand-dark font-heading text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
