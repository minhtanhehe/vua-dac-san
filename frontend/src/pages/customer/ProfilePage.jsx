import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { contentApi } from '../../api/contentApi';
import { User, MessageSquare, Loader2, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');

  // Fetch logged-in customer profile
  const { data: customer, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['my-profile'],
    retry: false,
    queryFn: async () => {
      const res = await customerApi.getMe();
      return res.data;
    }
  });

  // Fetch support requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-support-requests'],
    enabled: !!customer,
    queryFn: async () => {
      const res = await contentApi.getMySupportRequests();
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // State for form
  const [formData, setFormData] = useState({
    hoTen: '',
    sdt: '',
    email: '',
    ngaySinh: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        hoTen: customer.hoten || '',
        sdt: customer.sdt || '',
        email: customer.email || '',
        ngaySinh: customer.ngaysinh ? customer.ngaysinh.split('T')[0] : ''
      });
    }
  }, [customer]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => customerApi.update('me', data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công!');
      queryClient.invalidateQueries(['my-profile']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  });

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.sdt) {
      toast.error('Họ tên và Số điện thoại là bắt buộc');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500">
        Vui lòng đăng nhập để xem thông tin tài khoản.
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Tabs */}
        <div className="col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${
              activeTab === 'info' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
            }`}
          >
            <User size={20} /> Thông tin cá nhân
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${
              activeTab === 'requests' ? 'bg-brand-primary text-brand-dark shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-brand-light'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} /> Phản hồi CSKH
            </div>
            {myRequests.some(r => r.trangthai === 'Đã xử lý') && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">!</span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-3xl border border-brand-light p-8 shadow-sm">
          
          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-brand-dark font-heading border-b border-brand-light pb-4">
                Hồ sơ của tôi
              </h2>
              <form onSubmit={handleUpdateInfo} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({...formData, hoTen: e.target.value})}
                    className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.sdt}
                    onChange={(e) => setFormData({...formData, sdt: e.target.value})}
                    className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-brand-light text-gray-500 cursor-not-allowed"
                    title="Email đăng nhập không thể thay đổi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.ngaySinh}
                    onChange={(e) => setFormData({...formData, ngaySinh: e.target.value})}
                    className="w-full px-4 py-3 bg-brand-bg rounded-xl border border-brand-light focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 bg-brand-dark text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brand-light pb-4">
                <h2 className="text-2xl font-bold text-brand-dark font-heading">
                  Yêu cầu & Phản hồi từ CSKH
                </h2>
              </div>
              
              {myRequests.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div key={req.mayeucau} className={`p-5 border rounded-2xl space-y-3 transition ${
                      req.trangthai === 'Đã xử lý' ? 'border-brand-primary bg-brand-bg/50' : 'border-brand-light hover:border-brand-primary'
                    }`}>
                      <div className="flex flex-wrap gap-2 justify-between items-start">
                        <div>
                          <span className="text-xs font-bold px-2 py-1 bg-brand-light rounded-lg text-brand-dark mr-2">
                            {req.loaiyeucau}
                          </span>
                          <span className="text-xs text-gray-500">
                            Gửi ngày: {new Date(req.ngaytao).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          req.trangthai === 'Đã xử lý' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.trangthai}
                        </span>
                      </div>
                      
                      <div className="text-sm text-brand-dark mt-2 bg-white border border-gray-100 p-4 rounded-xl">
                        <strong className="block text-xs text-gray-400 uppercase mb-1">Nội dung bạn gửi:</strong> 
                        {req.noidungkh}
                      </div>

                      {req.noidungphanhoi ? (
                        <div className="text-sm bg-brand-primary/10 text-brand-dark p-4 rounded-xl border border-brand-primary/20 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                          <strong className="block text-xs text-brand-primary uppercase mb-1">Admin / CSKH Phản hồi:</strong> 
                          {req.noidungphanhoi}
                          <div className="text-xs text-gray-500 mt-2">
                            Vào lúc: {new Date(req.ngayxuly).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Đang chờ nhân viên phản hồi...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
