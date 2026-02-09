import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import RepairOrderDetailModal from '../components/repairs/RepairOrderDetailModal';
import AppointmentDetailModal from '../components/appointments/AppointmentDetailModal';
import { DayView } from '../components/schedule/DayView';
import { WeekView } from '../components/schedule/WeekView';
import { AssignToLiftModal, QuickActionsModal, PartsWaitModal } from '../components/schedule/ScheduleModals';
import {
  RepairLift,
  RepairOrder,
  ActiveWorker,
  UnassignedOrder,
  ScheduleItem,
  ViewMode,
  PositionRow,
  Appointment,
  HOURS,
  WEEK_DAYS,
} from '../components/schedule/types';

export function RepairSchedule() {
  const { isAdmin, isWorkerLead } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lifts, setLifts] = useState<RepairLift[]>([]);
  const [assignments, setAssignments] = useState<ScheduleItem[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<UnassignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleItem | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [quickActionsItem, setQuickActionsItem] = useState<ScheduleItem | null>(null);
  const [showPartsWaitModal, setShowPartsWaitModal] = useState(false);
  const [partsWaitItem, setPartsWaitItem] = useState<ScheduleItem | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const canManage = isAdmin || isWorkerLead;

  useEffect(() => {
    fetchData();
  }, [selectedDate, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<{
        lifts: RepairLift[];
        items: ScheduleItem[];
        orders: UnassignedOrder[];
        assignments: ScheduleItem[];
        activeWorkersMap: Record<string, ActiveWorker[]>;
        appointments: Appointment[];
      }>('api-schedule', '/data');

      if (data) {
        if (data.lifts) setLifts(data.lifts);
        if (data.appointments) setAppointments(data.appointments);

        const activeWorkersMap = new Map<string, ActiveWorker[]>(
          Object.entries(data.activeWorkersMap || {})
        );

        const withLift: ScheduleItem[] = (data.assignments || []).map(a => ({
          ...a,
          activeWorkers: activeWorkersMap.get(a.repair_order_id) || a.activeWorkers || [],
        }));
        const withoutLift: UnassignedOrder[] = (data.orders || []).map(o => ({
          ...o,
          activeWorkers: activeWorkersMap.get(o.id) || (o as any).activeWorkers || [],
        }));

        setAssignments(withLift);
        setUnassignedOrders(withoutLift);
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
    }
    setLoading(false);
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - (viewMode === 'day' ? 1 : 7));
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (viewMode === 'day' ? 1 : 7));
    setSelectedDate(newDate);
  };

  const handleToday = () => setSelectedDate(new Date());

  const positionRows: PositionRow[] = useMemo(() => {
    const liftRows = lifts.map(lift => ({ id: lift.id, name: lift.name, type: 'lift' as const }));
    const positionCount = Math.max(Math.ceil(unassignedOrders.length / 10), 3);
    const positionRowsArr = Array.from({ length: positionCount }, (_, i) => ({
      id: `position-${i + 1}`,
      name: `Vi Tri ${i + 1}`,
      type: 'position' as const
    }));
    return [...liftRows, ...positionRowsArr];
  }, [lifts, unassignedOrders]);

  const getAssignmentsForLift = (liftId: string) => {
    return assignments
      .filter(a => a.lift_id === liftId)
      .sort((a, b) => new Date(a.order.receive_date).getTime() - new Date(b.order.receive_date).getTime());
  };

  const getUnassignedForPosition = (positionIndex: number) => {
    const startIdx = positionIndex * 10;
    const pageOrders = unassignedOrders.slice(startIdx, startIdx + 10);
    return { queued: [] as ScheduleItem[], unassigned: pageOrders[0] };
  };

  const handleAssignToLift = async (liftId: string, startTime: string, endTime: string) => {
    if (!selectedOrder) return;
    await api.post('api-schedule', '/assignments', {
      repair_order_id: selectedOrder.id,
      lift_id: liftId,
      scheduled_start: startTime,
      scheduled_end: endTime,
    });
    setShowAssignModal(false);
    setSelectedOrder(null);
    fetchData();
  };

  const handleRemoveFromLift = async (assignment: ScheduleItem) => {
    if (!assignment.lift_id) return;
    await api.put('api-schedule', `/assignments/${assignment.id}/remove`);
    fetchData();
  };

  const handlePrioritize = async () => { fetchData(); };
  const handleMoveUp = async () => { fetchData(); };

  const handleSetPartsWait = async (assignmentId: string, startTime: string, endTime: string) => {
    await api.put('api-schedule', `/assignments/${assignmentId}/parts-wait`, {
      waiting_for_parts: true,
      parts_wait_start: startTime,
      parts_wait_end: endTime,
    });
    setShowPartsWaitModal(false);
    setPartsWaitItem(null);
    setQuickActionsItem(null);
    fetchData();
  };

  const handleClearPartsWait = async (assignmentId: string) => {
    await api.put('api-schedule', `/assignments/${assignmentId}/parts-wait`, {
      waiting_for_parts: false,
      parts_wait_start: null,
      parts_wait_end: null,
    });
    setQuickActionsItem(null);
    fetchData();
  };

  const handleOpenAssignModal = (order: RepairOrder, assignment?: ScheduleItem) => {
    setSelectedOrder(order);
    setSelectedAssignment(assignment || null);
    setShowAssignModal(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatWeekRange = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-3 space-y-4">
        <div className="skeleton h-8 w-44 rounded-xl" />
        <div className="skeleton h-4 w-56 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Lich Sua Chua</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Quan ly lich trinh va phan cong cau nang</p>
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div className="tab-bar">
          <button
            onClick={() => setViewMode('day')}
            className={`tab-item flex items-center justify-center gap-1.5 ${viewMode === 'day' ? 'tab-item-active' : ''}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Ngay
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`tab-item flex items-center justify-center gap-1.5 ${viewMode === 'week' ? 'tab-item-active' : ''}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Tuan
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <button onClick={handlePrevDay}
              className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-white/40 transition-colors"
              style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <ChevronLeft className="w-4 h-4 text-blue-500" />
            </button>
            <button onClick={handleToday}
              className="px-3.5 py-2 rounded-xl text-blue-500 text-[13px] font-semibold active:bg-white/40 transition-colors min-h-[40px]"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
              Hom nay
            </button>
            <button onClick={handleNextDay}
              className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-white/40 transition-colors"
              style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <ChevronRight className="w-4 h-4 text-blue-500" />
            </button>
          </div>
          <div className="text-[13px] font-semibold text-gray-600">
            {viewMode === 'day' ? formatDate(selectedDate) : formatWeekRange(selectedDate)}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {viewMode === 'day' ? (
          <DayView
            positionRows={positionRows}
            hours={HOURS}
            assignments={assignments}
            unassignedOrders={unassignedOrders}
            selectedDate={selectedDate}
            canManage={canManage}
            getAssignmentsForLift={getAssignmentsForLift}
            getUnassignedForPosition={getUnassignedForPosition}
            onOpenDetail={(id) => setDetailOrderId(id)}
            onOpenAssignModal={handleOpenAssignModal}
            onRemoveFromLift={handleRemoveFromLift}
            onPrioritize={handlePrioritize}
            onMoveUp={handleMoveUp}
            onOpenQuickActions={setQuickActionsItem}
          />
        ) : (
          <WeekView
            positionRows={positionRows}
            weekDays={WEEK_DAYS}
            assignments={assignments}
            unassignedOrders={unassignedOrders}
            appointments={appointments}
            selectedDate={selectedDate}
            canManage={canManage}
            getStartOfWeek={getStartOfWeek}
            getAssignmentsForLift={getAssignmentsForLift}
            getUnassignedForPosition={getUnassignedForPosition}
            onOpenDetail={(id) => setDetailOrderId(id)}
            onOpenAssignModal={handleOpenAssignModal}
            onRemoveFromLift={handleRemoveFromLift}
            onPrioritize={handlePrioritize}
            onMoveUp={handleMoveUp}
            onOpenQuickActions={setQuickActionsItem}
            onOpenAppointmentDetail={setSelectedAppointment}
          />
        )}
      </div>

      {showAssignModal && selectedOrder && (
        <AssignToLiftModal
          order={selectedOrder}
          existingAssignment={selectedAssignment}
          lifts={lifts}
          assignments={assignments}
          onClose={() => { setShowAssignModal(false); setSelectedOrder(null); setSelectedAssignment(null); }}
          onAssign={handleAssignToLift}
        />
      )}

      {detailOrderId && (
        <RepairOrderDetailModal
          orderId={detailOrderId}
          currentWorker={null}
          onClose={() => setDetailOrderId(null)}
          onUpdate={fetchData}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {quickActionsItem && (
        <QuickActionsModal
          item={quickActionsItem}
          canManage={canManage}
          onClose={() => setQuickActionsItem(null)}
          onOpenDetail={() => { setDetailOrderId(quickActionsItem.repair_order_id); setQuickActionsItem(null); }}
          onRemoveFromLift={async () => { await handleRemoveFromLift(quickActionsItem); setQuickActionsItem(null); }}
          onPrioritize={async () => { await handlePrioritize(); setQuickActionsItem(null); }}
          onMoveUp={async () => { await handleMoveUp(); setQuickActionsItem(null); }}
          onSetPartsWait={() => { setPartsWaitItem(quickActionsItem); setShowPartsWaitModal(true); }}
          onClearPartsWait={() => handleClearPartsWait(quickActionsItem.id)}
        />
      )}

      {showPartsWaitModal && partsWaitItem && (
        <PartsWaitModal
          item={partsWaitItem}
          onClose={() => { setShowPartsWaitModal(false); setPartsWaitItem(null); }}
          onConfirm={(start, end) => handleSetPartsWait(partsWaitItem.id, start, end)}
        />
      )}
    </div>
  );
}
