import { useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Layers,
  Package,
} from 'lucide-react';
import {
  Appointment,
  ScheduleItem,
  UnassignedOrder,
  RepairOrder,
  PositionRow,
  SERVICE_TYPE_LABELS,
} from './types';

interface WeekViewProps {
  positionRows: PositionRow[];
  weekDays: string[];
  assignments: ScheduleItem[];
  unassignedOrders: UnassignedOrder[];
  appointments: Appointment[];
  selectedDate: Date;
  canManage: boolean;
  getStartOfWeek: (date: Date) => Date;
  getAssignmentsForLift: (liftId: string) => ScheduleItem[];
  getUnassignedForPosition: (index: number) => { queued: ScheduleItem[]; unassigned?: UnassignedOrder };
  onOpenDetail: (orderId: string) => void;
  onOpenAssignModal: (order: RepairOrder, assignment?: ScheduleItem) => void;
  onRemoveFromLift: (assignment: ScheduleItem) => void;
  onPrioritize: (assignment: ScheduleItem) => void;
  onMoveUp: (assignment: ScheduleItem) => void;
  onOpenQuickActions: (item: ScheduleItem) => void;
  onOpenAppointmentDetail: (apt: Appointment) => void;
}

const SESSION_WIDTH = 96;
const MORNING_START = 7.5;
const AFTERNOON_START = 12;
const AFTERNOON_END = 17;
const MORNING_HOURS = AFTERNOON_START - MORNING_START;
const AFTERNOON_HOURS = AFTERNOON_END - AFTERNOON_START;

export function WeekView({
  positionRows,
  weekDays,
  assignments,
  unassignedOrders,
  appointments,
  selectedDate,
  canManage,
  getStartOfWeek,
  getAssignmentsForLift,
  getUnassignedForPosition: _getUnassignedForPosition,
  onOpenDetail,
  onOpenAssignModal,
  onOpenQuickActions,
  onOpenAppointmentDetail,
}: WeekViewProps) {
  const weekStart = getStartOfWeek(selectedDate);

  const getDateForDay = (dayIndex: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    return d;
  };

  const getSpanInfoFromDates = (startDateStr: string, endDateStr: string, useFullDay: boolean) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const startDayIndex = Math.round((startDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDayIndex = Math.round((endDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

    if (endDayIndex < 0 || startDayIndex > 6) return null;

    const clampedStart = Math.max(0, startDayIndex);
    const clampedEnd = Math.min(6, endDayIndex);

    if (useFullDay) {
      const leftPosition = clampedStart * SESSION_WIDTH * 2;
      const width = (clampedEnd - clampedStart + 1) * SESSION_WIDTH * 2;
      return { leftPosition, width };
    }

    const startHours = startDate.getHours() + startDate.getMinutes() / 60;
    const startInMorning = startHours < AFTERNOON_START;

    let leftPosition: number;
    if (startInMorning) {
      const startOffset = (Math.max(MORNING_START, startHours) - MORNING_START) / MORNING_HOURS;
      leftPosition = clampedStart * SESSION_WIDTH * 2 + startOffset * SESSION_WIDTH;
    } else {
      const startOffset = (Math.max(AFTERNOON_START, startHours) - AFTERNOON_START) / AFTERNOON_HOURS;
      leftPosition = clampedStart * SESSION_WIDTH * 2 + SESSION_WIDTH + startOffset * SESSION_WIDTH;
    }

    let width: number;
    if (clampedEnd === clampedStart) {
      const endHours = endDate.getHours() + endDate.getMinutes() / 60;
      const endInMorning = endHours <= AFTERNOON_START;
      if (endInMorning) {
        const endOffset = (Math.min(AFTERNOON_START, endHours) - MORNING_START) / MORNING_HOURS;
        width = (clampedStart * SESSION_WIDTH * 2 + endOffset * SESSION_WIDTH) - leftPosition;
      } else {
        const endOffset = (Math.min(AFTERNOON_END, endHours) - AFTERNOON_START) / AFTERNOON_HOURS;
        width = (clampedStart * SESSION_WIDTH * 2 + SESSION_WIDTH + endOffset * SESSION_WIDTH) - leftPosition;
      }
    } else {
      const endHours = endDate.getHours() + endDate.getMinutes() / 60;
      const endInMorning = endHours <= AFTERNOON_START;
      if (endInMorning) {
        const endOffset = (Math.min(AFTERNOON_START, endHours) - MORNING_START) / MORNING_HOURS;
        width = (endDayIndex * SESSION_WIDTH * 2 + endOffset * SESSION_WIDTH) - leftPosition;
      } else {
        const endOffset = (Math.min(AFTERNOON_END, endHours) - AFTERNOON_START) / AFTERNOON_HOURS;
        width = (endDayIndex * SESSION_WIDTH * 2 + SESSION_WIDTH + endOffset * SESSION_WIDTH) - leftPosition;
      }
    }

    return { leftPosition, width };
  };

  const getSpanInfo = (item: ScheduleItem) => {
    if (item.scheduled_start && item.scheduled_end) {
      return getSpanInfoFromDates(item.scheduled_start, item.scheduled_end, false);
    }
    return getSpanInfoFromDates(item.order.receive_date, item.order.return_date, true);
  };

  const getOrderSpanInfo = (order: RepairOrder) => {
    return getSpanInfoFromDates(order.receive_date, order.return_date, true);
  };

  const getAppointmentSpanInfo = (apt: Appointment) => {
    return getSpanInfoFromDates(apt.appointment_date, apt.expected_return_date, true);
  };

  const getRenderedAssignments = (liftId: string) => {
    const liftAssignments = getAssignmentsForLift(liftId);
    const rendered: { item: ScheduleItem; leftPosition: number; width: number }[] = [];
    liftAssignments.forEach(item => {
      const spanInfo = getSpanInfo(item);
      if (spanInfo) rendered.push({ item, ...spanInfo });
    });
    return rendered;
  };

  type AllItemRow = {
    row: PositionRow;
    items: {
      item?: ScheduleItem;
      order?: UnassignedOrder;
      appointment?: Appointment;
      leftPosition: number;
      width: number;
      type: 'lift' | 'queued' | 'unassigned' | 'appointment';
    }[];
  };

  const allItems = useMemo(() => {
    const result: AllItemRow[] = [];
    const liftRows = positionRows.filter(r => r.type === 'lift');

    liftRows.forEach(row => {
      const rendered = getRenderedAssignments(row.id);
      result.push({
        row,
        items: rendered.map(r => ({ item: r.item, leftPosition: r.leftPosition, width: r.width, type: 'lift' as const }))
      });
    });

    const sorted = [...unassignedOrders].sort((a, b) => {
      const aActive = a.activeWorkers && a.activeWorkers.length > 0;
      const bActive = b.activeWorkers && b.activeWorkers.length > 0;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });

    sorted.forEach((order, index) => {
      const spanInfo = getOrderSpanInfo(order);
      if (spanInfo) {
        result.push({
          row: { id: `unassigned-${order.id}`, name: `Vi Tri ${index + 1}`, type: 'position' as const },
          items: [{ order, leftPosition: spanInfo.leftPosition, width: spanInfo.width, type: 'unassigned' as const }]
        });
      }
    });

    appointments.forEach((apt) => {
      const spanInfo = getAppointmentSpanInfo(apt);
      if (spanInfo) {
        result.push({
          row: { id: `appointment-${apt.id}`, name: 'Lich Hen', type: 'position' as const },
          items: [{ appointment: apt, leftPosition: spanInfo.leftPosition, width: spanInfo.width, type: 'appointment' as const }]
        });
      }
    });

    return result;
  }, [positionRows, assignments, unassignedOrders, appointments, weekStart]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-20 flex-shrink-0 px-2 py-2.5"
              style={{ background: 'rgba(255,255,255,0.4)' }}>
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Vi tri</span>
            </div>
            <div className="flex">
              {weekDays.map((day, i) => {
                const date = getDateForDay(i);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={day}
                    className="w-48 flex-shrink-0 px-2 py-2.5 text-center"
                    style={{
                      borderLeft: '1px solid rgba(0,0,0,0.04)',
                      background: isToday
                        ? 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))'
                        : 'transparent',
                    }}
                  >
                    <div className={`text-[11px] font-semibold ${isToday ? 'text-blue-500' : 'text-gray-400'}`}>
                      {day}
                    </div>
                    <div className={`text-[15px] font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="w-20 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="flex">
              {weekDays.map((day, i) => {
                const date = getDateForDay(i);
                const isToday = date.toDateString() === new Date().toDateString();
                const cellBg = isToday ? 'rgba(59,130,246,0.03)' : 'transparent';
                return (
                  <div key={day} className="flex w-48" style={{ borderLeft: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="w-24 flex-shrink-0 px-2 py-1.5 text-center"
                      style={{ borderRight: '1px solid rgba(0,0,0,0.03)', background: cellBg }}>
                      <div className="text-[10px] text-gray-400">Sang</div>
                    </div>
                    <div className="w-24 flex-shrink-0 px-2 py-1.5 text-center"
                      style={{ background: cellBg }}>
                      <div className="text-[10px] text-gray-400">Chieu</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[13px] text-gray-400 font-medium">Khong co lich sua chua</p>
            </div>
          ) : (
            allItems.map(({ row, items }) => {
              const isLift = row.type === 'lift';
              const isAppointment = row.id.startsWith('appointment-');

              const labelBg = isLift
                ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))'
                : isAppointment
                ? 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(59,130,246,0.05))'
                : 'rgba(255,255,255,0.3)';

              const labelColor = isLift ? 'text-blue-600' : isAppointment ? 'text-sky-600' : 'text-gray-500';

              return (
                <div key={row.id} className="flex" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="w-20 flex-shrink-0 px-2 py-3" style={{ background: labelBg }}>
                    <span className={`text-[12px] font-semibold ${labelColor}`}>
                      {isAppointment ? 'Lich Hen' : row.name}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-[60px]">
                      <div className="absolute inset-0 flex">
                        {weekDays.map((day, i) => {
                          const date = getDateForDay(i);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const cellBg = isToday ? 'rgba(59,130,246,0.03)' : 'transparent';
                          return (
                            <div key={day} className="flex w-48" style={{ borderLeft: '1px solid rgba(0,0,0,0.04)' }}>
                              <div className="w-24 flex-shrink-0" style={{ borderRight: '1px solid rgba(0,0,0,0.03)', background: cellBg }} />
                              <div className="w-24 flex-shrink-0" style={{ background: cellBg }} />
                            </div>
                          );
                        })}
                      </div>

                      <div className="absolute inset-0 p-1.5">
                        {items.length === 0 && isLift ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[11px] text-gray-300 font-medium">Trong</span>
                          </div>
                        ) : (
                          items.map((itemData) => {
                            const left = itemData.leftPosition;
                            const width = itemData.width - 8;

                            if (itemData.type === 'lift' || itemData.type === 'queued') {
                              return <LiftBar key={itemData.item!.id} item={itemData.item!} left={left} width={width} onClick={() => onOpenQuickActions(itemData.item!)} />;
                            }

                            if (itemData.type === 'appointment') {
                              return <AppointmentBar key={itemData.appointment!.id} appointment={itemData.appointment!} left={left} width={width} onClick={() => onOpenAppointmentDetail(itemData.appointment!)} />;
                            }

                            const order = itemData.order as UnassignedOrder;
                            return (
                              <UnassignedBar
                                key={order.id}
                                order={order}
                                left={left}
                                width={width}
                                canManage={canManage}
                                onClick={() => onOpenDetail(order.id)}
                                onAssign={(e) => { e.stopPropagation(); onOpenAssignModal(order); }}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function LiftBar({ item, left, width, onClick }: { item: ScheduleItem; left: number; width: number; onClick: () => void }) {
  const isWaitingParts = item.waiting_for_parts;
  const accentColor = isWaitingParts ? '#f59e0b' : '#10b981';

  return (
    <div
      className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl flex items-center gap-2 px-2.5 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        left, width,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onClick={onClick}
    >
      <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-gray-800 truncate">{item.order.license_plate}</span>
          {isWaitingParts && <Package className="w-3 h-3 text-amber-400 flex-shrink-0" />}
        </div>
        <span className="text-[11px] text-gray-400 block truncate">{item.order.vehicle_name}</span>
      </div>
    </div>
  );
}

function AppointmentBar({ appointment, left, width, onClick }: { appointment: Appointment; left: number; width: number; onClick: () => void }) {
  return (
    <div
      className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl flex items-center gap-2 px-2.5 cursor-pointer active:opacity-80 transition-opacity"
      style={{
        left, width,
        background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(59,130,246,0.06))',
        border: '1.5px solid rgba(14,165,233,0.25)',
      }}
      onClick={onClick}
    >
      <div className="w-1 h-7 rounded-full flex-shrink-0 bg-sky-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <CalendarCheck className="w-3 h-3 text-sky-500 flex-shrink-0" />
          <span className="text-[13px] font-bold text-gray-800 truncate">{appointment.license_plate}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-sky-600 px-1 rounded"
            style={{ background: 'rgba(14,165,233,0.1)' }}>
            {SERVICE_TYPE_LABELS[appointment.service_type]}
          </span>
          <span className="text-[11px] text-gray-400 truncate">{appointment.vehicle_name}</span>
        </div>
      </div>
    </div>
  );
}

function UnassignedBar({
  order, left, width, canManage, onClick, onAssign
}: {
  order: UnassignedOrder; left: number; width: number; canManage: boolean;
  onClick: () => void; onAssign: (e: React.MouseEvent) => void;
}) {
  const hasActiveWorkers = order.activeWorkers && order.activeWorkers.length > 0;
  const isWaitingForParts = (order as any).waiting_for_parts;
  const accentColor = hasActiveWorkers ? '#10b981' : isWaitingForParts ? '#f59e0b' : '#d1d5db';

  return (
    <div
      className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl flex items-center gap-2 px-2.5 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        left, width,
        background: hasActiveWorkers ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: hasActiveWorkers ? '1px solid rgba(255,255,255,0.6)' : '1.5px dashed rgba(0,0,0,0.12)',
        boxShadow: hasActiveWorkers ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
      }}
      onClick={onClick}
    >
      <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-gray-800 truncate">{order.license_plate}</span>
          {isWaitingForParts && <Package className="w-3 h-3 text-amber-400 flex-shrink-0" />}
        </div>
        <span className="text-[11px] text-gray-400 block truncate">{order.vehicle_name}</span>
        {hasActiveWorkers && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-semibold text-emerald-600">
              {order.activeWorkers?.map(w => w.name).join(', ')}
            </span>
          </div>
        )}
      </div>
      {canManage && (
        <button
          onClick={onAssign}
          className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.1)' }}
        >
          <Layers className="w-3 h-3 text-blue-500" />
        </button>
      )}
    </div>
  );
}
