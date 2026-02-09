import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api/client';
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Package,
  RefreshCw,
  UserCog,
  Wrench,
} from 'lucide-react';

type AppointmentServiceType =
  | 'kiem_tra'
  | 'sua_chua'
  | 'bao_duong_dong_co'
  | 'bao_duong_3_buoc'
  | 'bao_duong';

interface AppointmentItem {
  id: string;
  license_plate: string;
  customer_name: string;
  vehicle_name: string;
  phone: string | null;
  appointment_date: string;
  appointment_time: string;
  expected_return_date: string;
  service_type: AppointmentServiceType;
  status: string;
}

interface InspectionItem {
  id: string;
  repair_order_id: string;
  ro_code: string;
  status: string;
  customer_name: string;
  vehicle_name: string;
  license_plate: string;
  check_start_time: string | null;
  expected_result_time: string | null;
  created_at: string;
  technicians: string[];
  progress: number;
}

interface WaitingPartsItem {
  id: string;
  ro_code: string;
  license_plate: string;
  vehicle_name: string;
  customer_name: string;
  parts_order_start_time: string | null;
  parts_expected_end_time: string | null;
  parts_note: string | null;
  updated_at: string;
  progress: number;
}

interface WaitingDeliveryItem {
  id: string;
  ro_code: string;
  license_plate: string;
  vehicle_name: string;
  customer_name: string;
  return_date: string;
  updated_at: string;
}

interface RepairingVehicleItem {
  id: string;
  ro_code: string;
  license_plate: string;
  vehicle_name: string;
  customer_name: string;
  receive_date: string;
  return_date: string;
  updated_at: string;
  progress: number;
  completed_items: number;
  total_items: number;
  active_workers: string[];
}

interface WorkerPerformanceItem {
  id: string;
  name: string;
  worker_type: 'repair' | 'paint';
  assigned_minutes: number;
  remaining_minutes: number;
  assigned_jobs: number;
  target_minutes: number;
  utilization_percent: number;
}

interface PerformanceResponse {
  generated_at: string;
  today_key: string;
  sections: {
    appointments: { total: number; items: AppointmentItem[] };
    waiting_inspection: { total: number; items: InspectionItem[] };
    waiting_parts: { total: number; items: WaitingPartsItem[] };
    waiting_delivery: { total: number; items: WaitingDeliveryItem[] };
    inspecting_vehicles: { total: number; items: InspectionItem[] };
    repairing_vehicles: { total: number; items: RepairingVehicleItem[] };
    worker_performance: {
      target_minutes: number;
      repair_workers: WorkerPerformanceItem[];
      paint_workers: WorkerPerformanceItem[];
    };
  };
}

const SERVICE_TYPE_LABELS: Record<AppointmentServiceType, string> = {
  kiem_tra: 'Kiem tra',
  sua_chua: 'Sua chua',
  bao_duong_dong_co: 'BD dong co',
  bao_duong_3_buoc: 'BD 3 buoc',
  bao_duong: 'Bao duong',
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Chua xac dinh';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chua xac dinh';
  return new Date(value).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMinutes(totalMinutes: number) {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatRemainingDuration(remainingMs: number) {
  const safeMs = Math.max(0, remainingMs);
  const totalMinutes = Math.max(0, Math.ceil(safeMs / 60000));

  if (totalMinutes <= 60) {
    return `${totalMinutes} phut`;
  }

  if (totalMinutes <= 24 * 60) {
    return `${Math.ceil(totalMinutes / 60)} gio`;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingAfterDays = totalMinutes - days * 24 * 60;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;
  return `${days} ngay ${hours} gio ${minutes} phut`;
}

function getRemainingInspectionData(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  nowMs: number
) {
  if (!endTime) return null;

  const endMs = new Date(endTime).getTime();
  if (!Number.isFinite(endMs)) return null;

  const startMs = startTime ? new Date(startTime).getTime() : null;
  const hasValidStart = startMs !== null && Number.isFinite(startMs);
  const totalMs = hasValidStart ? Math.max(1, endMs - (startMs as number)) : null;
  const remainingMsRaw = endMs - nowMs;
  const remainingMs = Math.max(0, remainingMsRaw);
  const isExpired = remainingMsRaw <= 0;

  let remainingPercent = 0;
  if (hasValidStart && totalMs) {
    if (nowMs <= (startMs as number)) {
      remainingPercent = 100;
    } else if (nowMs >= endMs) {
      remainingPercent = 0;
    } else {
      remainingPercent = (remainingMs / totalMs) * 100;
    }
  } else {
    remainingPercent = remainingMsRaw > 0 ? 100 : 0;
  }

  return {
    remainingMs,
    remainingLabel: isExpired ? 'Qua gio' : formatRemainingDuration(remainingMs),
    remainingPercent: clampPercent(remainingPercent),
    isExpired,
  };
}

function ProgressBar({
  progress,
  color = 'from-blue-500 to-cyan-500',
}: {
  progress: number;
  color?: string;
}) {
  const value = clampPercent(progress);
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  tone,
}: {
  icon: typeof Activity;
  title: string;
  count: number;
  tone: 'blue' | 'amber' | 'emerald' | 'red' | 'slate' | 'violet';
}) {
  const toneClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-700 bg-blue-50 border-blue-100',
    amber: 'from-amber-500 to-orange-500 text-amber-700 bg-amber-50 border-amber-100',
    emerald: 'from-emerald-500 to-teal-500 text-emerald-700 bg-emerald-50 border-emerald-100',
    red: 'from-red-500 to-rose-500 text-red-700 bg-red-50 border-red-100',
    slate: 'from-slate-500 to-gray-500 text-slate-700 bg-slate-50 border-slate-100',
    violet: 'from-violet-500 to-indigo-500 text-violet-700 bg-violet-50 border-violet-100',
  } as const;

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border ${toneClasses[tone].split(' ').slice(3).join(' ')}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${toneClasses[tone].split(' ').slice(0, 2).join(' ')}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className={`text-sm font-semibold ${toneClasses[tone].split(' ')[2]}`}>{title}</p>
      <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-gray-600 border border-white">
        {count}
      </span>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

export function Performance() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get<PerformanceResponse>('api-overview', '/performance');
      setData(response);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      alert(error instanceof Error ? error.message : 'Loi khi tai du lieu hieu suat');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => {
    if (!data) {
      return {
        appointments: 0,
        waitingParts: 0,
        repairing: 0,
      };
    }

    return {
      appointments: data.sections.appointments.total,
      waitingParts: data.sections.waiting_parts.total,
      repairing: data.sections.repairing_vehicles.total,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Du lieu ngay {formatDate(data.today_key)}</p>
          <p className="text-[11px] text-gray-300 mt-0.5">Cap nhat: {formatDateTime(data.generated_at)}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center active:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="card p-3 text-center">
          <CalendarClock className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{summary.appointments}</p>
          <p className="text-[10px] text-gray-400">Lich hen</p>
        </div>
        <div className="card p-3 text-center">
          <Package className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{summary.waitingParts}</p>
          <p className="text-[10px] text-gray-400">Cho phu tung</p>
        </div>
        <div className="card p-3 text-center">
          <Wrench className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">{summary.repairing}</p>
          <p className="text-[10px] text-gray-400">Dang sua</p>
        </div>
      </div>

      <section className="space-y-2.5">
        <SectionHeader
          icon={CalendarClock}
          title="Lich hen trong ngay"
          count={data.sections.appointments.total}
          tone="blue"
        />
        {data.sections.appointments.items.length === 0 ? (
          <EmptyMessage text="Khong co lich hen trong ngay." />
        ) : (
          <div className="space-y-2">
            {data.sections.appointments.items.map((item) => (
              <div key={item.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.vehicle_name} - {item.customer_name}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    {item.appointment_time || 'ca ngay'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">{SERVICE_TYPE_LABELS[item.service_type] || item.service_type}</span>
                  <span className="text-gray-500">Tra xe: {formatDate(item.expected_return_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <SectionHeader
          icon={ClipboardList}
          title="Cho kiem tra trong ngay"
          count={data.sections.waiting_inspection.total}
          tone="amber"
        />
        {data.sections.waiting_inspection.items.length === 0 ? (
          <EmptyMessage text="Khong co xe cho kiem tra trong ngay." />
        ) : (
          <div className="space-y-2">
            {data.sections.waiting_inspection.items.map((item) => (
              <div key={item.id} className="card p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.vehicle_name} - {item.customer_name}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    {item.ro_code || 'RO'}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1">
                  <p className="text-[11px] text-gray-500">
                    Tao yeu cau: <span className="font-semibold text-gray-700">{formatDateTime(item.created_at)}</span>
                  </p>
                  <p className="text-[11px] font-semibold text-amber-700">Trang thai: Chua phan cong kiem tra</p>
                  <p className="text-[11px] text-gray-500">
                    Ky thuat vien: {item.technicians.length > 0 ? item.technicians.join(', ') : 'Chua phan cong'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <SectionHeader
          icon={Package}
          title="Cho phu tung"
          count={data.sections.waiting_parts.total}
          tone="red"
        />
        {data.sections.waiting_parts.items.length === 0 ? (
          <EmptyMessage text="Khong co xe cho phu tung." />
        ) : (
          <div className="space-y-2">
            {data.sections.waiting_parts.items.map((item) => (
              <div key={item.id} className="card p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.vehicle_name}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                    {item.ro_code || 'RO'}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <ProgressBar progress={item.progress} color="from-red-500 to-rose-500" />
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Bat dau: {formatDateTime(item.parts_order_start_time)}</span>
                    <span>{clampPercent(item.progress)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Du kien xong: {formatDateTime(item.parts_expected_end_time)}</span>
                    <span className="text-gray-400">{item.customer_name}</span>
                  </div>
                  {item.parts_note && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                      {item.parts_note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <SectionHeader
          icon={CheckCircle2}
          title="Xe cho giao"
          count={data.sections.waiting_delivery.total}
          tone="emerald"
        />
        {data.sections.waiting_delivery.items.length === 0 ? (
          <EmptyMessage text="Khong co xe cho giao." />
        ) : (
          <div className="space-y-2">
            {data.sections.waiting_delivery.items.map((item) => (
              <div key={item.id} className="card px-3 py-2.5">
                <div className="flex items-center gap-2 text-[12px]">
                  <p className="min-w-0 flex-[1.1] flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">BSX</span>
                    <span className="font-semibold text-gray-900 truncate">{item.license_plate}</span>
                  </p>
                  <p className="min-w-0 flex-1 flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">TX</span>
                    <span className="font-medium text-gray-900 truncate">{item.vehicle_name}</span>
                  </p>
                  <p className="min-w-0 flex-1 flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">KH</span>
                    <span className="font-medium text-gray-900 truncate">{item.customer_name}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <SectionHeader
          icon={Clock3}
          title="Xe dang kiem tra"
          count={data.sections.inspecting_vehicles.total}
          tone="violet"
        />
        {data.sections.inspecting_vehicles.items.length === 0 ? (
          <EmptyMessage text="Khong co xe dang kiem tra." />
        ) : (
          <div className="space-y-2">
            {data.sections.inspecting_vehicles.items.map((item) => (
              <div key={item.id} className="card p-3.5">
                {(() => {
                  const remainingData = getRemainingInspectionData(
                    item.check_start_time,
                    item.expected_result_time,
                    nowMs
                  );

                  return (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.vehicle_name}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                          {item.technicians.length > 0 ? item.technicians[0] : 'Chua phan cong'}
                        </span>
                      </div>

                      {remainingData ? (
                        <div className="mt-2.5 space-y-1.5">
                          <p className="text-[11px] text-gray-500">
                            Con lai:{' '}
                            <span className={`font-semibold ${remainingData.isExpired ? 'text-red-600' : 'text-violet-700'}`}>
                              {remainingData.remainingLabel}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <ProgressBar progress={item.progress} color="from-violet-500 to-indigo-500" />
                            </div>
                            <span className={`text-[11px] font-semibold whitespace-nowrap ${remainingData.isExpired ? 'text-red-600' : 'text-violet-700'}`}>
                              {remainingData.remainingLabel}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 space-y-1.5">
                          <p className="text-[11px] text-gray-500">
                            Con lai: <span className="font-semibold text-gray-500">Chua xac dinh</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <ProgressBar progress={item.progress} color="from-violet-500 to-indigo-500" />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                              Chua xac dinh
                            </span>
                          </div>
                        </div>
                      )}

                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <SectionHeader
          icon={Wrench}
          title="Xe dang sua chua"
          count={data.sections.repairing_vehicles.total}
          tone="slate"
        />
        {data.sections.repairing_vehicles.items.length === 0 ? (
          <EmptyMessage text="Khong co xe dang sua chua." />
        ) : (
          <div className="space-y-2">
            {data.sections.repairing_vehicles.items.map((item) => (
              <div key={item.id} className="card p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.vehicle_name}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100">
                    {item.ro_code || 'RO'}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <ProgressBar progress={item.progress} color="from-slate-600 to-gray-500" />
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{item.completed_items}/{item.total_items} hang muc</span>
                    <span>{clampPercent(item.progress)}%</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Tho dang lam: {item.active_workers.length > 0 ? item.active_workers.join(', ') : 'Chua co'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5 pb-2">
        <SectionHeader
          icon={UserCog}
          title="Hieu suat tho trong ngay"
          count={
            data.sections.worker_performance.repair_workers.length +
            data.sections.worker_performance.paint_workers.length
          }
          tone="blue"
        />

        <div className="card p-3.5 space-y-3">
          <p className="text-[11px] text-gray-500">
            Muc tieu moi tho: <span className="font-semibold text-gray-700">{formatMinutes(data.sections.worker_performance.target_minutes)}</span>/ngay
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Sua chua</p>
            {data.sections.worker_performance.repair_workers.length === 0 ? (
              <p className="text-[11px] text-gray-400">Khong co du lieu tho sua chua.</p>
            ) : (
              data.sections.worker_performance.repair_workers.map((worker) => (
                <div key={worker.id} className="bg-white/70 border border-white rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <p className="font-semibold text-gray-900">{worker.name}</p>
                    <span className="text-gray-500">{worker.assigned_jobs} hang muc</span>
                  </div>
                  <ProgressBar
                    progress={worker.utilization_percent}
                    color="from-red-500 to-rose-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                    <span>{formatMinutes(worker.assigned_minutes)}</span>
                    <span>Con lai: {formatMinutes(worker.remaining_minutes ?? Math.max(0, worker.target_minutes - worker.assigned_minutes))}</span>
                    <span>{worker.utilization_percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Dong son</p>
            {data.sections.worker_performance.paint_workers.length === 0 ? (
              <p className="text-[11px] text-gray-400">Khong co du lieu tho dong son.</p>
            ) : (
              data.sections.worker_performance.paint_workers.map((worker) => (
                <div key={worker.id} className="bg-white/70 border border-white rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <p className="font-semibold text-gray-900">{worker.name}</p>
                    <span className="text-gray-500">{worker.assigned_jobs} hang muc</span>
                  </div>
                  <ProgressBar
                    progress={worker.utilization_percent}
                    color="from-sky-500 to-blue-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                    <span>{formatMinutes(worker.assigned_minutes)}</span>
                    <span>Con lai: {formatMinutes(worker.remaining_minutes ?? Math.max(0, worker.target_minutes - worker.assigned_minutes))}</span>
                    <span>{worker.utilization_percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
