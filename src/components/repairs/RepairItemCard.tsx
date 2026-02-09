import { RepairItem, RepairWorker, RepairItemImage, RepairType, RepairItemTransfer } from '../../lib/supabase';
import { X, Play, CheckCircle, Clock, User, Image as ImageIcon, ChevronDown, ChevronRight, ArrowRightLeft } from 'lucide-react';

export interface ItemWithWorker extends RepairItem {
  worker?: RepairWorker;
  images?: RepairItemImage[];
  children?: ItemWithWorker[];
  assignedWorkers?: RepairWorker[];
  is_priority_today?: boolean;
  priority_marked_at?: string | null;
  transfers?: (RepairItemTransfer & { fromWorker?: RepairWorker; toWorker?: RepairWorker })[];
}

export interface ItemCardCallbacks {
  onToggleExpand: (itemId: string) => void;
  onAddWorker: (itemId: string, workerId: string, itemName: string) => void;
  onRemoveWorker: (itemId: string, workerId: string) => void;
  onStartItem: (itemId: string, workerId: string, parentId?: string) => void;
  onCompleteItem: (itemId: string, parentId?: string) => void;
  onMarkPriorityToday: (itemId: string) => void;
  onViewGallery: (item: ItemWithWorker) => void;
  onTransferWork: (item: ItemWithWorker, workerId: string) => void;
  canAssignItem: (item: ItemWithWorker) => boolean;
  canCompleteItem: (item: ItemWithWorker) => boolean;
  getWorkerOptions: (repairType: RepairType | null) => RepairWorker[];
  formatDuration: (startedAt: string) => string;
  formatCompletedDuration: (startedAt: string, completedAt: string) => string;
  formatDateTime: (dateStr: string) => string;
}

interface RepairItemCardProps {
  item: ItemWithWorker;
  index: number;
  parentId?: string;
  expandedItems: Set<string>;
  currentWorkerId?: string;
  isWorker: boolean;
  isPaint: boolean;
  isAdmin: boolean;
  isPaintLead: boolean;
  isWorkerLead: boolean;
  callbacks: ItemCardCallbacks;
}

const statusStyles = {
  completed: 'bg-gradient-to-br from-emerald-50 to-green-50/80 border-emerald-300 shadow-sm shadow-emerald-100',
  in_progress: 'bg-gradient-to-br from-orange-50 to-amber-50/80 border-orange-300 shadow-sm shadow-orange-100',
  pending: 'bg-gradient-to-br from-white to-gray-50/50 border-gray-300 shadow-sm'
};

const indicatorStyles = {
  completed: 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-200',
  in_progress: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200',
  pending: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md'
};

function WorkerChip({
  worker,
  item,
  isTransferred,
  canRemove,
  isAdmin,
  onRemove,
  onTransfer,
}: {
  worker: RepairWorker;
  item: ItemWithWorker;
  isTransferred: boolean;
  canRemove: boolean;
  isAdmin: boolean;
  onRemove: (itemId: string, workerId: string) => void;
  onTransfer: (item: ItemWithWorker, workerId: string) => void;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-sm ${
        isTransferred
          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300'
          : item.status === 'in_progress'
          ? 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 border border-sky-300'
          : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-300'
      }`}
    >
      <User className="w-3 h-3" />
      <span>{worker.name}</span>
      {isTransferred && <span className="text-[10px] opacity-70">(Da chuyen)</span>}
      {canRemove && !isTransferred && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id, worker.id);
          }}
          className="ml-0.5 p-0.5 active:bg-white/50 rounded-full transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {isAdmin && !isTransferred && item.status === 'in_progress' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTransfer(item, worker.id);
          }}
          className="ml-0.5 p-0.5 active:bg-white/50 rounded-full transition-colors text-amber-600"
          title="Chuyen giao"
        >
          <ArrowRightLeft className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function RepairItemCard({
  item,
  index,
  parentId,
  expandedItems,
  currentWorkerId,
  isWorker,
  isPaint,
  isAdmin,
  isPaintLead,
  isWorkerLead,
  callbacks,
}: RepairItemCardProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  const assignedWorkers = item.assignedWorkers || [];
  const transfers = item.transfers || [];
  const transferredWorkerIds = transfers.map(t => t.from_worker_id);
  const isAssignedToCurrentWorker = (isWorker || isPaint) && currentWorkerId && assignedWorkers.some(w => w.id === currentWorkerId);
  const canAssign = callbacks.canAssignItem(item);
  const canMarkPriorityToday =
    item.status === 'pending' &&
    assignedWorkers.length > 0 &&
    canAssign &&
    !item.is_priority_today;
  const unassignedWorkers = callbacks.getWorkerOptions(item.repair_type).filter(w => !assignedWorkers.some(aw => aw.id === w.id));
  const formatEstimatedDuration = (minutes: number | null | undefined) => {
    if (!minutes || minutes <= 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-2">
      <div
        className={`rounded-[20px] border backdrop-blur-sm transition-all duration-200 ${statusStyles[item.status as keyof typeof statusStyles]}`}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => callbacks.onToggleExpand(item.id)}
                className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-[12px] transition-all duration-200 ${indicatorStyles[item.status as keyof typeof indicatorStyles]}`}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-[12px] text-xs font-semibold ${indicatorStyles[item.status as keyof typeof indicatorStyles]}`}>
                {item.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm leading-tight ${item.status === 'completed' ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                    {item.name}
                  </p>
                  {hasChildren && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.children!.filter(c => c.status === 'completed').length}/{item.children!.length} hoan thanh
                    </p>
                  )}
                </div>

                {item.images && item.images.length > 0 && (
                  <button
                    onClick={() => callbacks.onViewGallery(item)}
                    className="p-1.5 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-[12px] transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!hasChildren && (
                <>
                  {item.status === 'in_progress' && item.started_at && (
                    <div className="flex items-center gap-2 py-1.5 px-2.5 bg-orange-100/60 rounded-[16px]">
                      <Clock className="w-4 h-4 text-orange-600" />
                      {(isAdmin || isPaintLead || isWorkerLead) ? (
                        <span className="font-mono text-base font-bold text-orange-700 tracking-tight">
                          {callbacks.formatDuration(item.started_at)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-orange-700">
                          Bat dau: {callbacks.formatDateTime(item.started_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {item.status === 'completed' && item.started_at && item.completed_at && (
                    <p className="text-xs text-emerald-600">
                      Thoi gian: {callbacks.formatCompletedDuration(item.started_at, item.completed_at)}
                    </p>
                  )}
                  {item.estimated_duration_minutes && (
                    <p className="text-xs text-gray-500">
                      Du kien: {formatEstimatedDuration(item.estimated_duration_minutes)}
                    </p>
                  )}
                  {item.is_priority_today && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-300">
                      Uu Tien Trong Ngay
                    </div>
                  )}

                  {transfers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {transfers.map(t => (
                        <span key={t.id} className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <ArrowRightLeft className="w-2.5 h-2.5" />
                          {t.fromWorker?.name} → {t.toWorker?.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {assignedWorkers.map(w => (
                      <WorkerChip
                        key={w.id}
                        worker={w}
                        item={item}
                        isTransferred={transferredWorkerIds.includes(w.id)}
                        canRemove={canAssign && item.status === 'pending'}
                        isAdmin={isAdmin}
                        onRemove={callbacks.onRemoveWorker}
                        onTransfer={callbacks.onTransferWork}
                      />
                    ))}

                    {item.status === 'pending' && canAssign && unassignedWorkers.length > 0 && (
                      <div className="relative inline-flex items-center flex-shrink-0">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) callbacks.onAddWorker(item.id, e.target.value, item.name);
                          }}
                          className="appearance-none w-7 h-7 bg-gradient-to-br from-red-500 to-rose-500 rounded-full cursor-pointer active:from-red-600 active:to-rose-600 transition-all block shadow-md shadow-red-200"
                        >
                          <option value=""></option>
                          {unassignedWorkers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {canMarkPriorityToday && (
                      <button
                        onClick={() => callbacks.onMarkPriorityToday(item.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full active:from-amber-600 active:to-orange-600 active:scale-95 transition-all shadow-md shadow-amber-200"
                      >
                        Uu Tien Trong Ngay
                      </button>
                    )}

                    {item.status === 'pending' && isAssignedToCurrentWorker && currentWorkerId && (
                      <button
                        onClick={() => callbacks.onStartItem(item.id, currentWorkerId, parentId)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-medium rounded-full active:from-red-600 active:to-rose-600 active:scale-95 transition-all shadow-md shadow-red-200"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Bat Dau
                      </button>
                    )}

                    {item.status === 'in_progress' && callbacks.canCompleteItem(item) && (
                      <button
                        onClick={() => callbacks.onCompleteItem(item.id, parentId)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-medium rounded-full active:from-emerald-600 active:to-green-600 active:scale-95 transition-all shadow-md shadow-emerald-200"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Hoan Thanh
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
          {item.children!.map((child, childIndex) => (
            <RepairItemCard
              key={child.id}
              item={child}
              index={childIndex}
              parentId={item.id}
              expandedItems={expandedItems}
              currentWorkerId={currentWorkerId}
              isWorker={isWorker}
              isPaint={isPaint}
              isAdmin={isAdmin}
              isPaintLead={isPaintLead}
              isWorkerLead={isWorkerLead}
              callbacks={callbacks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
