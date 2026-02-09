import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Eye, Play, CheckCircle, Clock, User, FileText, Link as LinkIcon } from 'lucide-react';
import { api } from '../../lib/api/client';

interface VideoData {
  id: string;
  title: string;
  content_line: string;
  content_tag: string;
  plan_start_date: string;
  plan_end_date: string;
  description: string | null;
  status: string;
}

interface Stage {
  id: string;
  stage_type: string;
  stage_order: number;
  status: string;
  assignee_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  script_text: string | null;
  video_url: string | null;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface VideoDetailProps {
  videoId: string;
  onBack: () => void;
}

const stageLabels = {
  SCRIPT: 'Kịch Bản',
  SHOOT: 'Quay Video',
  EDIT: 'Dựng Video',
  PUBLISH: 'Đăng Tải',
};

export function VideoDetail({ videoId, onBack }: VideoDetailProps) {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const data = await api.get<{ video: VideoData; stages: Stage[]; staff: Staff[] }>('api-marketing', `/videos/${videoId}`);

      if (data) {
        if (data.video) setVideo(data.video);
        if (data.stages) setStages(data.stages);
        if (data.staff) setStaff(data.staff);
      }
    } catch (err) {
      console.error('Error fetching video detail:', err);
    }

    setLoading(false);
  };

  const calculateDuration = (startedAt: string | null, completedAt: string | null): string => {
    if (!startedAt) return '-';

    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const isSameDay = startDay.getTime() === endDay.getTime();

    if (isSameDay) {
      return `${diffHours.toFixed(1)} giờ`;
    } else {
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return `${diffDays.toFixed(1)} ngày`;
    }
  };

  const canStartStage = (stage: Stage): boolean => {
    if (stage.stage_order === 1) return stage.status === 'NOT_STARTED';

    const prevStage = stages.find(s => s.stage_order === stage.stage_order - 1);
    return stage.status === 'NOT_STARTED' && prevStage?.status === 'COMPLETED';
  };

  const canCompleteStage = (stage: Stage): boolean => {
    if (stage.status !== 'IN_PROGRESS') return false;
    if (stage.stage_type === 'SCRIPT' && !stage.script_text?.trim()) return false;
    if (stage.stage_type === 'PUBLISH' && !stage.video_url?.trim()) return false;
    if (!stage.assignee_id) return false;
    return true;
  };

  const handleStartStage = async (stageId: string) => {
    try {
      await api.put('api-marketing', `/stages/${stageId}`, { status: 'IN_PROGRESS', started_at: new Date().toISOString() });
      fetchData();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleCompleteStage = async (stageId: string, stageType: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!canCompleteStage(stage!)) {
      alert('Vui lòng điền đầy đủ thông tin trước khi hoàn thành');
      return;
    }

    try {
      await api.put('api-marketing', `/stages/${stageId}`, { status: 'COMPLETED', completed_at: new Date().toISOString() });

      if (stageType === 'PUBLISH') {
        const videoUrl = stage?.video_url;
        if (videoUrl?.trim()) {
          await api.put('api-marketing', `/videos/${videoId}`, { status: 'DONE', updated_at: new Date().toISOString() });
        }
      }

      fetchData();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleUpdateStage = async (stageId: string, updates: Partial<Stage>) => {
    try {
      await api.put('api-marketing', `/stages/${stageId}`, updates);
      fetchData();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  if (loading || !video) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay Lại
        </button>

        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isEditMode
              ? 'bg-gray-200 text-gray-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isEditMode ? (
            <>
              <Eye className="w-4 h-4" />
              Chế Độ Xem
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Chế Độ Sửa
            </>
          )}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{video.title}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Tuyến</p>
            <p className="font-medium text-gray-800">
              {video.content_line === 'PAINT' ? 'Sơn Xe' : video.content_line === 'REPAIR' ? 'Sửa Chữa' : 'Bảo Dưỡng'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Loại</p>
            <p className="font-medium text-gray-800">
              {video.content_tag === 'AD' ? 'Quảng cáo' : 'Brand'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Ngày Bắt Đầu</p>
            <p className="font-medium text-gray-800">
              {new Date(video.plan_start_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Ngày Kết Thúc</p>
            <p className="font-medium text-gray-800">
              {new Date(video.plan_end_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          </div>
        </div>
        {video.description && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Mô Tả</p>
            <p className="text-gray-700 mt-1">{video.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Các Công Đoạn</h2>

        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const assignedStaff = staff.find(s => s.id === stage.assignee_id);

          return (
            <div key={stage.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stage.status === 'COMPLETED'
                        ? 'bg-green-500 text-white'
                        : stage.status === 'IN_PROGRESS'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stage.status === 'COMPLETED' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : stage.status === 'IN_PROGRESS' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{stage.stage_order}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {stageLabels[stage.stage_type as keyof typeof stageLabels]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {stage.status === 'NOT_STARTED' && 'Chưa bắt đầu'}
                      {stage.status === 'IN_PROGRESS' && 'Đang thực hiện'}
                      {stage.status === 'COMPLETED' && 'Đã hoàn thành'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canStartStage(stage) && (
                    <button
                      onClick={() => handleStartStage(stage.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Bắt Đầu
                    </button>
                  )}
                  {stage.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteStage(stage.id, stage.stage_type)}
                      disabled={!canCompleteStage(stage)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Hoàn Thành
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Bắt đầu</p>
                  <p className="text-sm font-medium text-gray-800">
                    {stage.started_at
                      ? new Date(stage.started_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hoàn thành</p>
                  <p className="text-sm font-medium text-gray-800">
                    {stage.completed_at
                      ? new Date(stage.completed_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="text-sm font-medium text-gray-800">
                    {calculateDuration(stage.started_at, stage.completed_at)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Người Thực Hiện
                  </label>
                  {isEditMode && stage.status !== 'COMPLETED' ? (
                    <select
                      value={stage.assignee_id || ''}
                      onChange={(e) => handleUpdateStage(stage.id, { assignee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Chọn người thực hiện</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                      {assignedStaff ? `${assignedStaff.name} - ${assignedStaff.role}` : 'Chưa chọn'}
                    </p>
                  )}
                </div>

                {stage.stage_type === 'SCRIPT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Kịch Bản
                    </label>
                    {isEditMode && stage.status !== 'COMPLETED' ? (
                      <textarea
                        value={stage.script_text || ''}
                        onChange={(e) => handleUpdateStage(stage.id, { script_text: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Nhập kịch bản..."
                      />
                    ) : (
                      <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {stage.script_text || 'Chưa có kịch bản'}
                      </p>
                    )}
                  </div>
                )}

                {stage.stage_type === 'PUBLISH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <LinkIcon className="w-4 h-4 inline mr-1" />
                      Link Video
                    </label>
                    {isEditMode && stage.status !== 'COMPLETED' ? (
                      <input
                        type="url"
                        value={stage.video_url || ''}
                        onChange={(e) => handleUpdateStage(stage.id, { video_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Nhập link video..."
                      />
                    ) : stage.video_url ? (
                      <a
                        href={stage.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-red-600 hover:underline px-3 py-2 bg-gray-50 rounded-lg block"
                      >
                        {stage.video_url}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                        Chưa có link video
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="mt-4 h-8 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
