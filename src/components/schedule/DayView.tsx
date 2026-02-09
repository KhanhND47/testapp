import {
  Calendar,
  Car,
  Layers,
  Package,
} from 'lucide-react';
import {
  ScheduleItem,
  UnassignedOrder,
  RepairOrder,
  PositionRow,
} from './types';

interface DayViewProps {
  positionRows: PositionRow[];
  hours: string[];
  assignments: ScheduleItem[];
  unassignedOrders: UnassignedOrder[];
  selectedDate: Date;
  canManage: boolean;
  getAssignmentsForLift: (liftId: string) => ScheduleItem[];
  getUnassignedForPosition: (index: number) => { queued: ScheduleItem[]; unassigned?: UnassignedOrder };
  onOpenDetail: (orderId: string) => void;
  onOpenAssignModal: (order: RepairOrder, assignment?: ScheduleItem) => void;
  onRemoveFromLift: (assignment: ScheduleItem) => void;
  onPrioritize: (assignment: ScheduleItem) => void;
  onMoveUp: (assignment: ScheduleItem) => void;
  onOpenQuickActions: (item: ScheduleItem) => void;
}

export function DayView({
  positionRows,
  assignments,
  unassignedOrders,
  canManage,
  getAssignmentsForLift,
  onOpenDetail,
  onOpenAssignModal,
  onOpenQuickActions,
}: DayViewProps) {
  const liftRows = positionRows.filter(r => r.type === 'lift');

  return (
    <div className="space-y-4">
      {liftRows.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))',
                border: '1px solid rgba(255,255,255,0.5)',
              }}>
              <Layers className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <h2 className="text-sm font-bold text-gray-700">Tren Cau</h2>
          </div>
          <div className="space-y-2.5">
            {liftRows.map(row => {
              const liftAssignments = getAssignmentsForLift(row.id);
              return (
                <div key={row.id} className="glass-card p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                    />
                    <span className="text-[13px] font-bold text-blue-600">{row.name}</span>
                  </div>
                  {liftAssignments.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-[12px] text-gray-300 font-medium">Trong</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liftAssignments.map(item => (
                        <button
                          key={item.id}
                          className="w-full text-left rounded-2xl p-3 transition-all active:scale-[0.98]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(16, 185, 129, 0.05))',
                            border: '1px solid rgba(20, 184, 166, 0.15)',
                          }}
                          onClick={() => onOpenQuickActions(item)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-teal-500" strokeWidth={1.8} />
                              <span className="text-[14px] font-bold text-gray-800">{item.order.license_plate}</span>
                              {item.waiting_for_parts && (
                                <Package className="w-3.5 h-3.5 text-orange-400" />
                              )}
                            </div>
                            {canManage && (
                              <div
                                onClick={(e) => { e.stopPropagation(); onOpenAssignModal(item.order, item); }}
                                className="w-8 h-8 flex items-center justify-center rounded-xl"
                                style={{
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.15)',
                                }}
                              >
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-400 truncate">{item.order.vehicle_name}</p>
                          {item.activeWorkers && item.activeWorkers.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-semibold text-emerald-600">
                                {item.activeWorkers.map(w => w.name).join(', ')}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unassignedOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}>
              <Car className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
            </div>
            <h2 className="text-sm font-bold text-gray-700">Chua Len Cau</h2>
            <span className="text-[11px] font-semibold text-gray-300 ml-auto">({unassignedOrders.length})</span>
          </div>
          <div className="space-y-2">
            {unassignedOrders.map(order => {
              const hasActiveWorkers = order.activeWorkers && order.activeWorkers.length > 0;
              return (
                <button
                  key={order.id}
                  className="w-full text-left card-pressable p-3.5"
                  style={hasActiveWorkers ? {
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(255,255,255,0.55))',
                    border: '1px solid rgba(16, 185, 129, 0.12)',
                  } : undefined}
                  onClick={() => onOpenDetail(order.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                      <span className="text-[14px] font-bold text-gray-700">{order.license_plate}</span>
                    </div>
                    {canManage && (
                      <div
                        onClick={(e) => { e.stopPropagation(); onOpenAssignModal(order); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl"
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                        }}
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 truncate">{order.vehicle_name}</p>
                  {hasActiveWorkers && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-600">
                        {order.activeWorkers?.map(w => w.name).join(', ')}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {assignments.length === 0 && unassignedOrders.length === 0 && (
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}>
            <Calendar className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] text-gray-400 font-medium">Khong co lich sua chua</p>
        </div>
      )}
    </div>
  );
}
