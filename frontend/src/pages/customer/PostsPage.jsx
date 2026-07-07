import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { contentApi } from '../../api/contentApi';
import { Calendar, User, BookOpen, Loader2 } from 'lucide-react';

export default function PostsPage() {
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['public-posts'],
    queryFn: async () => {
      const res = await contentApi.getPublicPosts({ limit: 12 });
      return res.data || { data: [] };
    }
  });

  const posts = postsData?.data || [];

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Banner header */}
        <div className="bg-gradient-to-br from-brand-secondary to-[#224A37] text-white rounded-3xl p-8 sm:p-12 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 text-9xl">📖</div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">Tin tức & Khám phá ẩm thực</h1>
          <p className="text-gray-200 text-sm sm:text-base max-w-xl">
            Nơi tổng hợp những câu chuyện văn hóa ẩm thực đặc sản Việt Nam, công thức nấu ăn ngon và các thông tin khuyến mãi hấp dẫn nhất.
          </p>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
            <p className="text-sm text-gray-500 font-medium">Đang tải các bài viết...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-light p-12 text-center text-gray-400">
            Hiện tại chưa có bài viết nào được xuất bản.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article key={post.mabaiviet} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-light hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
                
                {/* Image */}
                <Link to={`/posts/${post.mabaiviet}`} className="block">
                  <div className="h-48 bg-brand-light/60 flex items-center justify-center overflow-hidden relative">
                    {post.hinhanh ? (
                      <img src={post.hinhanh} alt={post.tieude} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300">📰</span>
                    )}
                    {post.tenchuyenmuc && (
                      <span className="absolute top-4 left-4 bg-brand-primary text-brand-dark font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {post.tenchuyenmuc}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase">
                      <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.ngaytao).toLocaleDateString('vi-VN')}</div>
                      <div className="flex items-center gap-1"><User size={12} /> {post.tennguoiviet || 'Ban Biên Tập'}</div>
                    </div>
                    <Link to={`/posts/${post.mabaiviet}`} className="block">
                      <h3 className="font-bold text-brand-dark leading-snug text-sm group-hover:text-brand-accent transition line-clamp-2 min-h-[40px]">
                        {post.tieude}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">
                      {post.tomtat}
                    </p>
                  </div>

                  <Link
                    to={`/posts/${post.mabaiviet}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-secondary font-bold hover:underline"
                  >
                    <BookOpen size={14} /> Đọc bài viết
                  </Link>
                </div>

              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
