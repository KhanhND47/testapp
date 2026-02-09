import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, CheckCircle, Calendar, Tag, Play } from 'lucide-react';
import { api } from '../../lib/api/client';
import { VideoDetail } from './VideoDetail';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface Video {
  id: string;
  title: string;
  content_line: string;
  content_tag: string;
  plan_start_date: string;
  plan_end_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ContentLineProps {
  contentLine: 'PAINT' | 'REPAIR' | 'MAINTENANCE';
}

const contentLineLabels = {
  PAINT: 'Sơn Xe',
  REPAIR: 'Sửa Chữa',
  MAINTENANCE: 'Bảo Dưỡng',
};

const statusConfig = {
  DRAFT: { label: 'Nháp', color: 'bg-amber-100 text-amber-700', icon: FileText },
  IN_PROGRESS: { label: 'Đang Triển Khai', color: 'bg-red-100 text-red-700', icon: Clock },
  DONE: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export function ContentLine({ contentLine }: ContentLineProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [contentLine]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await api.get<Video[]>('api-marketing', '/videos', { content_line: contentLine });
      if (data) {
        setVideos(data);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
    setLoading(false);
  };

  const handleVideoCreated = () => {
    setShowCreateForm(false);
    fetchVideos();
  };

  const handleStartImplementation = async (videoId: string) => {
    try {
      await api.put('api-marketing', `/videos/${videoId}`, { status: 'IN_PROGRESS', updated_at: new Date().toISOString() });

      const stages = [
        { stage_type: 'SCRIPT', stage_order: 1, status: 'NOT_STARTED' },
        { stage_type: 'SHOOT', stage_order: 2, status: 'NOT_STARTED' },
        { stage_type: 'EDIT', stage_order: 3, status: 'NOT_STARTED' },
        { stage_type: 'PUBLISH', stage_order: 4, status: 'NOT_STARTED' },
      ];

      for (const stage of stages) {
        await api.post('api-marketing', `/videos/${videoId}/stages`, stage);
      }

      fetchVideos();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  if (selectedVideoId) {
    return (
      <VideoDetail
        videoId={selectedVideoId}
        onBack={() => {
          setSelectedVideoId(null);
          fetchVideos();
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Tuyến {contentLineLabels[contentLine]}
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Mới
        </button>
      </div>

      {showCreateForm && (
        <CreateVideoForm
          contentLine={contentLine}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleVideoCreated}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Chưa có video nào</p>
          <p className="text-sm text-gray-500 mt-1">Bắt đầu bằng cách tạo video mới</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const status = statusConfig[video.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex-1">{video.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>{video.content_tag === 'AD' ? 'Quảng cáo' : 'Brand'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(video.plan_start_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} - {new Date(video.plan_end_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {video.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStartImplementation(video.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Bắt Đầu
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVideoId(video.id)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Chi Tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CreateVideoFormProps {
  contentLine: 'PAINT' | 'REPAIR' | 'MAINTENANCE';
  onCancel: () => void;
  onSuccess: () => void;
}

function CreateVideoForm({ contentLine, onCancel, onSuccess }: CreateVideoFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content_tag: 'AD',
    plan_start_date: toVietnamDateInputValue(),
    plan_end_date: toVietnamDateInputValue(),
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tên video';
    if (!formData.plan_start_date) newErrors.plan_start_date = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.plan_end_date) newErrors.plan_end_date = 'Vui lòng chọn ngày kết thúc';
    if (formData.plan_end_date < formData.plan_start_date) {
      newErrors.plan_end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      await api.post('api-marketing', '/videos', {
        ...formData,
        content_line: contentLine,
        status: 'DRAFT',
      });

      setSaving(false);
      onSuccess();
    } catch (err) {
      setSaving(false);
      alert('Có lỗi xảy ra khi tạo video');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-4">Tạo Video Mới</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên Video <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Nhập tên video"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại Nội Dung</label>
          <select
            value={formData.content_tag}
            onChange={(e) => setFormData({ ...formData, content_tag: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="AD">Quảng cáo</option>
            <option value="BRAND">Brand</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày Bắt Đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.plan_start_date}
              onChange={(e) => setFormData({ ...formData, plan_start_date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.plan_start_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.plan_start_date && <p className="text-red-500 text-xs mt-1">{errors.plan_start_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày Kết Thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.plan_end_date}
              onChange={(e) => setFormData({ ...formData, plan_end_date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.plan_end_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.plan_end_date && <p className="text-red-500 text-xs mt-1">{errors.plan_end_date}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Nhập mô tả (tùy chọn)"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang tạo...' : 'Tạo Video'}
          </button>
        </div>
      </form>
    </div>
  );
}
