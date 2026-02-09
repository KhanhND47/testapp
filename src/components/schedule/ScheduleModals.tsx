import { useState, useEffect } from 'react';
import {
  Car,
  Check,
  ChevronRight,
  Clock,
  Package,
  ArrowDown,
  X,
} from 'lucide-react';
import {
  ScheduleItem,
  RepairOrder,
  RepairLift,
} from './types';
import { toVietnamDateInputValue } from '../../lib/dateTime';

interface AssignToLiftModalProps {
  order: RepairOrder;
  existingAssignment: ScheduleItem | null;
  lifts: RepairLift[];
  assignments: ScheduleItem[];
  onClose: () => void;
  onAssign: (liftId: string, startTime: string, endTime: string) => void;
}

export function AssignToLiftModal({ order, existingAssignment, lifts, assignments, onClose, onAssign }: AssignToLiftModalProps) {
  const [selectedLift, setSelectedLift] = useState(existingAssignment?.lift_id || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const today = toVietnamDateInputValue();

  const parseDateTime = (iso: string | null | undefined, defaultDate: string, defaultTime: string) => {
    if (!iso) return { date: defaultDate, time: defaultTime };
    const [datePart, timePart] = iso.split('T');
    return { date: datePart, time: timePart?.slice(0, 5) || defaultTime };
  };

  const getMinStartDateTime = (liftId: string) => {
    const liftAssignments = assignments.filter(a =>
      a.lift_id === liftId && a.status !== 'completed' && a.repair_order_id !== order.id && a.scheduled_end
    );
    if (liftAssignments.length === 0) return null;
    const latestEndTime = liftAssignments.reduce((latest, current) => {
      if (!latest || !current.scheduled_end) return current.scheduled_end;
      return new Date(current.scheduled_end) > new Date(latest) ? current.scheduled_end : latest;
    }, null as string | null);
    if (latestEndTime) {
      const endDateTime = new Date(latestEndTime);
      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);
      return endDateTime > todayDate ? latestEndTime : null;
    }
    return null;
  };

  const minStartForSelectedLift = selectedLift ? getMinStartDateTime(selectedLift) : null;

  const getDefaultStartDate = () => {
    if (minStartForSelectedLift) {
      const minDate = minStartForSelectedLift.split('T')[0];
      return minDate > today ? minDate : today;
    }
    return order.receive_date > today ? order.receive_date : today;
  };

  const getDefaultStartTime = () => {
    if (minStartForSelectedLift) {
      const [datePart, timePart] = minStartForSelectedLift.split('T');
      if (datePart === getDefaultStartDate()) return timePart?.slice(0, 5) || '08:00';
    }
    return '08:00';
  };

  const startParsed = parseDateTime(existingAssignment?.scheduled_start, getDefaultStartDate(), getDefaultStartTime());
  const endParsed = parseDateTime(existingAssignment?.scheduled_end, order.return_date, '17:00');
  const [startDate, setStartDate] = useState(startParsed.date);
  const [startTime, setStartTime] = useState(startParsed.time);
  const [endDate, setEndDate] = useState(endParsed.date);
  const [endTime, setEndTime] = useState(endParsed.time);

  useEffect(() => {
    const selectedStart = new Date(`${startDate}T${startTime}:00`);
    const selectedEnd = new Date(`${endDate}T${endTime}:00`);
    setValidationError(selectedEnd < selectedStart ? 'Thoi gian xuong cau khong the nho hon thoi gian len cau' : null);
  }, [startDate, startTime, endDate, endTime]);

  const handleLiftChange = (liftId: string) => {
    setSelectedLift(liftId);
    setValidationError(null);
    const minStart = getMinStartDateTime(liftId);
    if (minStart) {
      const [minDatePart, minTimePart] = minStart.split('T');
      const minDate = minDatePart > today ? minDatePart : today;
      setStartDate(minDate);
      if (minDatePart === minDate) setStartTime(minTimePart?.slice(0, 5) || '08:00');
    } else {
      setStartDate(order.receive_date > today ? order.receive_date : today);
    }
  };

  const handleSubmit = () => {
    if (!selectedLift) return;
    const start = `${startDate}T${startTime}:00`;
    const end = `${endDate}T${endTime}:00`;
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    if (endDateTime < startDateTime) {
      setValidationError('Thoi gian xuong cau khong the nho hon thoi gian len cau');
      return;
    }
    if (startDateTime < todayStart) {
      setValidationError('Thoi gian bat dau khong the truoc ngay hom nay');
      return;
    }
    if (minStartForSelectedLift) {
      const minStart = new Date(minStartForSelectedLift);
      if (startDateTime < minStart) {
        const minFormatted = minStart.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        setValidationError(`Thoi gian bat dau phai sau ${minFormatted} (xe truoc xuong cau)`);
        return;
      }
    }
    onAssign(selectedLift, start, end);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet max-h-[90vh] overflow-hidden">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200/50 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100/50">
          <button onClick={onClose} className="text-[15px] text-blue-500 font-medium min-h-[44px] flex items-center">Huy</button>
          <span className="text-[15px] font-bold text-gray-800">Xep Lich</span>
          <button onClick={handleSubmit} disabled={!selectedLift}
            className="text-[15px] text-blue-500 font-bold disabled:text-gray-300 min-h-[44px] flex items-center">Xong</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="glass-card p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))' }}>
                <Car className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-800">{order.license_plate}</p>
                <p className="text-[13px] text-gray-400">{order.vehicle_name}</p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255,255,255,0.3)' }}>
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Chon cau</span>
            </div>
            <div className="p-2">
              {lifts.map((lift) => {
                const liftOnItem = assignments.find(a => a.lift_id === lift.id && a.status === 'on_lift' && a.repair_order_id !== order.id);
                return (
                  <button key={lift.id} onClick={() => handleLiftChange(lift.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors min-h-[44px] ${selectedLift === lift.id ? '' : 'active:bg-white/40'}`}
                    style={selectedLift === lift.id ? { background: 'rgba(59,130,246,0.06)' } : undefined}>
                    <div className="text-left">
                      <span className={`text-[15px] block ${selectedLift === lift.id ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>{lift.name}</span>
                      {liftOnItem && <span className="text-[12px] text-amber-500">{liftOnItem.order.license_plate} dang tren cau</span>}
                    </div>
                    {selectedLift === lift.id && <Check className="w-5 h-5 text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {minStartForSelectedLift && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <p className="text-[13px] text-amber-600">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Cau nay dang co xe, thoi gian bat dau phai sau{' '}
                {new Date(minStartForSelectedLift).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {validationError && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <p className="text-[13px] text-red-500">{validationError}</p>
            </div>
          )}

          <TimePickerSection label="Thoi gian bat dau"
            date={startDate} time={startTime} minDate={today}
            onDateChange={(v) => { setStartDate(v); setValidationError(null); }}
            onTimeChange={(v) => { setStartTime(v); setValidationError(null); }}
          />
          <TimePickerSection label="Thoi gian ket thuc"
            date={endDate} time={endTime}
            onDateChange={setEndDate} onTimeChange={setEndTime}
          />
        </div>
      </div>
    </div>
  );
}

function TimePickerSection({ label, date, time, minDate, onDateChange, onTimeChange }: {
  label: string; date: string; time: string; minDate?: string;
  onDateChange: (v: string) => void; onTimeChange: (v: string) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255,255,255,0.3)' }}>
        <span className="text-[11px] font-semibold text-gray-400 uppercase">{label}</span>
      </div>
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
        <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
          <span className="text-[15px] text-gray-700">Ngay</span>
          <input type="date" value={date} min={minDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-[15px] text-blue-500 bg-transparent border-none outline-none text-right" />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
        <span className="text-[15px] text-gray-700">Gio</span>
        <input type="time" value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="text-[15px] text-blue-500 bg-transparent border-none outline-none text-right" />
      </div>
    </div>
  );
}

interface QuickActionsModalProps {
  item: ScheduleItem;
  canManage: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onRemoveFromLift: () => void;
  onPrioritize: () => void;
  onMoveUp: () => void;
  onSetPartsWait: () => void;
  onClearPartsWait: () => void;
}

export function QuickActionsModal({ item, canManage, onClose, onOpenDetail, onRemoveFromLift, onSetPartsWait, onClearPartsWait }: QuickActionsModalProps) {
  const hasLiftAssignment = !!item.lift_id;
  const isWaitingParts = item.waiting_for_parts;

  const formatDateRange = () => {
    const start = new Date(item.order.receive_date);
    const end = new Date(item.order.return_date);
    return `${start.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  const formatPartsWait = () => {
    if (!item.parts_wait_start || !item.parts_wait_end) return '';
    const start = new Date(item.parts_wait_start);
    const end = new Date(item.parts_wait_end);
    return `${start.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit' })} ${start.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit' })} ${end.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet max-h-[90vh] overflow-hidden">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200/50 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100/50">
          <div className="w-8" />
          <span className="text-[15px] font-bold text-gray-800">Thong tin xe</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.04)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="glass-card p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))' }}>
                <Car className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-gray-800">{item.order.license_plate}</p>
                  {isWaitingParts && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                      Cho phu tung
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-400">{item.order.vehicle_name}</p>
                <p className="text-[11px] text-gray-300 mt-0.5">{formatDateRange()}</p>
              </div>
            </div>
            {isWaitingParts && item.parts_wait_start && (
              <div className="mt-3 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <p className="text-[12px] text-amber-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatPartsWait()}
                </p>
              </div>
            )}
          </div>

          <button onClick={onOpenDetail}
            className="w-full glass-card px-4 py-3.5 flex items-center justify-between active:bg-white/40 transition-colors min-h-[44px]">
            <span className="text-[15px] text-blue-500 font-medium">Xem chi tiet lenh sua chua</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>

          {canManage && (
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255,255,255,0.3)' }}>
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Thao tac</span>
              </div>
              <div>
                {hasLiftAssignment && (
                  <button onClick={onRemoveFromLift}
                    className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-white/40 transition-colors min-h-[44px]"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[14px] text-red-500 block font-medium">Xuong cau</span>
                      <span className="text-[12px] text-gray-400">Dua xe xuong khoi cau</span>
                    </div>
                  </button>
                )}
                {isWaitingParts ? (
                  <button onClick={onClearPartsWait}
                    className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-white/40 transition-colors min-h-[44px]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.08)' }}>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[14px] text-emerald-600 block font-medium">Da co phu tung</span>
                      <span className="text-[12px] text-gray-400">Xoa trang thai cho phu tung</span>
                    </div>
                  </button>
                ) : (
                  <button onClick={onSetPartsWait}
                    className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-white/40 transition-colors min-h-[44px]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <Package className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[14px] text-gray-700 block font-medium">Cho phu tung</span>
                      <span className="text-[12px] text-gray-400">Danh dau xe dang cho phu tung</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PartsWaitModalProps {
  item: ScheduleItem;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
}

export function PartsWaitModal({ item, onClose, onConfirm }: PartsWaitModalProps) {
  const today = toVietnamDateInputValue();
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState('17:00');

  const handleSubmit = () => {
    onConfirm(`${startDate}T${startTime}:00`, `${endDate}T${endTime}:00`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet max-h-[90vh] overflow-hidden">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200/50 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100/50">
          <button onClick={onClose} className="text-[15px] text-blue-500 font-medium min-h-[44px] flex items-center">Huy</button>
          <span className="text-[15px] font-bold text-gray-800">Cho Phu Tung</span>
          <button onClick={handleSubmit} className="text-[15px] text-blue-500 font-bold min-h-[44px] flex items-center">Xong</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="glass-card p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-800">{item.order.license_plate}</p>
                <p className="text-[13px] text-gray-400">{item.order.vehicle_name}</p>
              </div>
            </div>
          </div>

          <TimePickerSection label="Thoi gian bat dau cho"
            date={startDate} time={startTime}
            onDateChange={setStartDate} onTimeChange={setStartTime}
          />
          <TimePickerSection label="Du kien co phu tung"
            date={endDate} time={endTime}
            onDateChange={setEndDate} onTimeChange={setEndTime}
          />
        </div>
      </div>
    </div>
  );
}
