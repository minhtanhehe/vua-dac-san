import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../api/contentApi';
import { Calendar, User, ArrowLeft, Loader2, BookOpen } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams();

  // Fetch single post
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post-detail', id],
    queryFn: async () => {
      const res = await contentApi.getPostById(id);
      return res.data || null;
    }
  });

  // Fetch other posts for recommendation
  const { data: postsData } = useQuery({
    queryKey: ['other-posts'],
    queryFn: async () => {
      const res = await contentApi.getPublicPosts({ limit: 4 });
      return res.data || { data: [] };
    }
  });

  const otherPosts = (postsData?.data || []).filter(p => p.mabaiviet !== id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
        <p className="text-sm text-gray-500 font-medium">Đang tải bài viết...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-brand-dark font-heading">Không tìm thấy bài viết</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link to="/posts" className="inline-flex items-center gap-1.5 bg-brand-primary text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition text-sm">
          <ArrowLeft size={16} /> Quay lại danh sách tin tức
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        
        {/* Navigation */}
        <Link to="/posts" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-secondary font-bold">
          <ArrowLeft size={14} /> Quay lại danh sách tin tức
        </Link>

        {/* Article Details Card */}
        <article className="bg-white rounded-3xl border border-brand-light p-6 sm:p-10 shadow-sm space-y-6">
          {/* Header information */}
          <header className="space-y-4 border-b border-brand-light pb-6">
            {post.tenchuyenmuc && (
              <span className="bg-brand-primary/20 text-brand-secondary font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                {post.tenchuyenmuc}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark font-heading leading-snug">
              {post.tieude}
            </h1>
            <div className="flex items-center gap-6 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.ngaytao).toLocaleDateString('vi-VN')}</div>
              <div className="flex items-center gap-1.5"><User size={14} /> {post.tennguoiviet || 'Ban Biên Tập'}</div>
            </div>
          </header>

          {/* Large post banner */}
          {post.hinhanh && (
            <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-gray-50 flex justify-center">
              <img src={post.hinhanh} alt={post.tieude} className="w-full max-h-[600px] object-contain" />
            </div>
          )}

          {/* Abstract summary */}
          <div className="bg-brand-bg/50 p-5 rounded-2xl border-l-4 border-brand-primary text-sm text-gray-600 font-medium italic leading-relaxed">
            {post.tomtat}
          </div>

          {/* Content section */}
          <div 
            className="prose prose-sm max-w-none text-brand-dark/90 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: post.noidung }}
          />

        </article>

        {/* Suggestion list */}
        {otherPosts.length > 0 && (
          <section className="space-y-6 pt-6">
            <h3 className="text-xl font-bold font-heading text-brand-dark flex items-center gap-2">
              <BookOpen className="text-brand-primary" />
              Các bài viết liên quan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {otherPosts.map(p => (
                <Link
                  key={p.mabaiviet}
                  to={`/posts/${p.mabaiviet}`}
                  className="bg-white rounded-2xl overflow-hidden border border-brand-light p-4 shadow-sm hover:shadow-md transition duration-300 group block"
                >
                  <div className="h-32 bg-brand-bg rounded-xl flex items-center justify-center overflow-hidden mb-3">
                    {p.hinhanh ? (
                      <img src={p.hinhanh} alt={p.tieude} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                    ) : (
                      <span className="text-3xl">📰</span>
                    )}
                  </div>
                  <h4 className="font-bold text-brand-dark text-xs leading-snug line-clamp-2 min-h-[32px] group-hover:text-brand-accent transition">
                    {p.tieude}
                  </h4>
                  <div className="text-[10px] text-gray-400 mt-2">{new Date(p.ngaytao).toLocaleDateString('vi-VN')}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
