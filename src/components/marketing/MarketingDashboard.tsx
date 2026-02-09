import { useState, useEffect } from 'react';
import { Target, Clock, CheckCircle, FileText, AlertCircle, Plus, Edit2, X } from 'lucide-react';
import { api } from '../../lib/api/client';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface GoalData {
  id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  paint_target: number;
  repair_target: number;
  maintenance_target: number;
}

interface StatsData {
  draft: number;
  in_progress: number;
  done: number;
  paint: { total: number; done: number; inProgress: number };
  repair: { total: number; done: number; inProgress: number };
  maintenance: { total: number; done: number; inProgress: number };
  stageBottleneck: { script: number; shoot: number; edit: number; publish: number };
}

export function MarketingDashboard() {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    draft: 0,
    in_progress: 0,
    done: 0,
    paint: { total: 0, done: 0, inProgress: 0 },
    repair: { total: 0, done: 0, inProgress: 0 },
    maintenance: { total: 0, done: 0, inProgress: 0 },
    stageBottleneck: { script: 0, shoot: 0, edit: 0, publish: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const goals = await api.get<GoalData[]>('api-marketing', '/goals');
      if (goals && goals.length > 0) {
        setGoal(goals[0]);
      }

      const videos = await api.get<any[]>('api-marketing', '/videos');

      if (videos) {
        const draft = videos.filter(v => v.status === 'DRAFT').length;
        const in_progress = videos.filter(v => v.status === 'IN_PROGRESS').length;
        const done = videos.filter(v => v.status === 'DONE').length;

        const paint = {
          total: videos.filter(v => v.content_line === 'PAINT').length,
          done: videos.filter(v => v.content_line === 'PAINT' && v.status === 'DONE').length,
          inProgress: videos.filter(v => v.content_line === 'PAINT' && v.status === 'IN_PROGRESS').length,
        };
        const repair = {
          total: videos.filter(v => v.content_line === 'REPAIR').length,
          done: videos.filter(v => v.content_line === 'REPAIR' && v.status === 'DONE').length,
          inProgress: videos.filter(v => v.content_line === 'REPAIR' && v.status === 'IN_PROGRESS').length,
        };
        const maintenance = {
          total: videos.filter(v => v.content_line === 'MAINTENANCE').length,
          done: videos.filter(v => v.content_line === 'MAINTENANCE' && v.status === 'DONE').length,
          inProgress: videos.filter(v => v.content_line === 'MAINTENANCE' && v.status === 'IN_PROGRESS').length,
        };

        const stageBottleneck = { script: 0, shoot: 0, edit: 0, publish: 0 };

        // Extract stage bottleneck data from videos if available
        for (const video of videos) {
          if (video.stages) {
            for (const stage of video.stages) {
              if (stage.status === 'IN_PROGRESS') {
                const key = stage.stage_type?.toLowerCase() as keyof typeof stageBottleneck;
                if (key && key in stageBottleneck) {
                  stageBottleneck[key]++;
                }
              }
            }
          }
        }

        setStats({ draft, in_progress, done, paint, repair, maintenance, stageBottleneck });
      }
    } catch (err) {
      console.error('Error fetching marketing data:', err);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const handleGoalCreated = () => {
    setShowGoalForm(false);
    fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Tổng Quan</h2>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {goal ? (
            <>
              <Edit2 className="w-4 h-4" />
              Cập Nhật Mục Tiêu
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Thiết Lập Mục Tiêu
            </>
          )}
        </button>
      </div>

      {showGoalForm && (
        <GoalForm
          existingGoal={goal}
          onCancel={() => setShowGoalForm(false)}
          onSuccess={handleGoalCreated}
        />
      )}

      {goal ? (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-800">{goal.period_name}</h3>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(goal.period_start).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} - {new Date(goal.period_end).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Sơn Xe</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">{stats.paint.done}</span>
                <span className="text-lg text-gray-500">/ {goal.paint_target}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${Math.min((stats.paint.done / (goal.paint_target || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-600">
                <span>Tổng: {stats.paint.total}</span>
                <span>•</span>
                <span>Đang làm: {stats.paint.inProgress}</span>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Sửa Chữa</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">{stats.repair.done}</span>
                <span className="text-lg text-gray-500">/ {goal.repair_target}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${Math.min((stats.repair.done / (goal.repair_target || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-600">
                <span>Tổng: {stats.repair.total}</span>
                <span>•</span>
                <span>Đang làm: {stats.repair.inProgress}</span>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Bảo Dưỡng</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">{stats.maintenance.done}</span>
                <span className="text-lg text-gray-500">/ {goal.maintenance_target}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${Math.min((stats.maintenance.done / (goal.maintenance_target || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-600">
                <span>Tổng: {stats.maintenance.total}</span>
                <span>•</span>
                <span>Đang làm: {stats.maintenance.inProgress}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Chưa có mục tiêu</p>
          <p className="text-sm text-gray-500">Thiết lập mục tiêu để theo dõi tiến độ sản xuất video</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-800">Nháp</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.draft}</p>
          <p className="text-sm text-gray-600 mt-1">Video chưa bắt đầu</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-800">Đang Triển Khai</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.in_progress}</p>
          <p className="text-sm text-gray-600 mt-1">Video đang sản xuất</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Hoàn Thành</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.done}</p>
          <p className="text-sm text-gray-600 mt-1">Video đã đăng tải</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-800">Đang Tắc Ở Công Đoạn</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.stageBottleneck.script}</p>
            <p className="text-sm text-gray-600 mt-1">Kịch Bản</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.stageBottleneck.shoot}</p>
            <p className="text-sm text-gray-600 mt-1">Quay Video</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.stageBottleneck.edit}</p>
            <p className="text-sm text-gray-600 mt-1">Dựng Video</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.stageBottleneck.publish}</p>
            <p className="text-sm text-gray-600 mt-1">Đăng Tải</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GoalFormProps {
  existingGoal: GoalData | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function GoalForm({ existingGoal, onCancel, onSuccess }: GoalFormProps) {
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'custom'>('month');
  const [formData, setFormData] = useState({
    period_name: existingGoal?.period_name || '',
    period_start: existingGoal?.period_start || toVietnamDateInputValue(),
    period_end: existingGoal?.period_end || toVietnamDateInputValue(),
    paint_target: existingGoal?.paint_target || 0,
    repair_target: existingGoal?.repair_target || 0,
    maintenance_target: existingGoal?.maintenance_target || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (periodType !== 'custom') {
      updateDatesBasedOnPeriodType();
    }
  }, [periodType]);

  const updateDatesBasedOnPeriodType = () => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let name: string;

    if (periodType === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      name = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    } else {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3, 0);
      name = `Q${quarter} ${now.getFullYear()}`;
    }

    setFormData(prev => ({
      ...prev,
      period_name: name,
      period_start: toVietnamDateInputValue(start),
      period_end: toVietnamDateInputValue(end),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.period_name.trim()) newErrors.period_name = 'Vui lòng nhập tên kỳ';
    if (!formData.period_start) newErrors.period_start = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.period_end) newErrors.period_end = 'Vui lòng chọn ngày kết thúc';
    if (formData.period_end < formData.period_start) {
      newErrors.period_end = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (formData.paint_target < 0) newErrors.paint_target = 'Mục tiêu không hợp lệ';
    if (formData.repair_target < 0) newErrors.repair_target = 'Mục tiêu không hợp lệ';
    if (formData.maintenance_target < 0) newErrors.maintenance_target = 'Mục tiêu không hợp lệ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      if (existingGoal) {
        await api.put('api-marketing', `/goals/${existingGoal.id}`, formData);
      } else {
        await api.post('api-marketing', '/goals', formData);
      }

      setSaving(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      alert(`Có lỗi xảy ra: ${error.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {existingGoal ? 'Cập Nhật Mục Tiêu' : 'Thiết Lập Mục Tiêu'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Loại Kỳ</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPeriodType('month')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                periodType === 'month'
                  ? 'bg-red-50 border-red-600 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('quarter')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                periodType === 'quarter'
                  ? 'bg-red-50 border-red-600 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Quý
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                periodType === 'custom'
                  ? 'bg-red-50 border-red-600 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tùy Chỉnh
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên Kỳ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.period_name}
            onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.period_name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="VD: Tháng 12/2024"
          />
          {errors.period_name && <p className="text-red-500 text-xs mt-1">{errors.period_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày Bắt Đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.period_start ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.period_start && <p className="text-red-500 text-xs mt-1">{errors.period_start}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày Kết Thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.period_end ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.period_end && <p className="text-red-500 text-xs mt-1">{errors.period_end}</p>}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3">Mục Tiêu Số Lượng Video</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sơn Xe
              </label>
              <input
                type="number"
                min="0"
                value={formData.paint_target}
                onChange={(e) => setFormData({ ...formData, paint_target: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.paint_target ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.paint_target && <p className="text-red-500 text-xs mt-1">{errors.paint_target}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sửa Chữa
              </label>
              <input
                type="number"
                min="0"
                value={formData.repair_target}
                onChange={(e) => setFormData({ ...formData, repair_target: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.repair_target ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.repair_target && <p className="text-red-500 text-xs mt-1">{errors.repair_target}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bảo Dưỡng
              </label>
              <input
                type="number"
                min="0"
                value={formData.maintenance_target}
                onChange={(e) => setFormData({ ...formData, maintenance_target: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.maintenance_target ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.maintenance_target && <p className="text-red-500 text-xs mt-1">{errors.maintenance_target}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
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
            {saving ? 'Đang lưu...' : existingGoal ? 'Cập Nhật' : 'Tạo Mục Tiêu'}
          </button>
        </div>
      </form>
    </div>
  );
}
