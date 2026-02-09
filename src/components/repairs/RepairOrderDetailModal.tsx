import { useState, useEffect } from 'react';
import type { GeneralRepairOrder, RepairWorker, RepairType } from '../../lib/supabase';
import { api } from '../../lib/api/client';
import { X, Car, Edit, Package, Trash2, Wrench, PaintBucket, FilePlus, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ImageCaptureModal from './ImageCaptureModal';
import ImageGalleryModal from './ImageGalleryModal';
import EditRepairOrderModal from './EditRepairOrderModal';
import RepairItemCard, { ItemWithWorker, ItemCardCallbacks } from './RepairItemCard';
import SupplementarySlipListModal from './SupplementarySlipListModal';
import SupplementaryQuoteListModal from './SupplementaryQuoteListModal';

interface RepairOrderDetailModalProps {
  orderId: string;
  currentWorker: RepairWorker | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function RepairOrderDetailModal({ orderId, onClose, onUpdate }: RepairOrderDetailModalProps) {
  const { user, isAdmin, isWorker, isPaint, isPaintLead, isWorkerLead, isSales } = useAuth();
  const [order, setOrder] = useState<GeneralRepairOrder | null>(null);
  const [items, setItems] = useState<ItemWithWorker[]>([]);
  const [workers, setWorkers] = useState<RepairWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [now, setNow] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [captureMode, setCaptureMode] = useState<{ itemId: string; workerId?: string; type: 'start' | 'complete'; parentId?: string } | null>(null);
  const [galleryItem, setGalleryItem] = useState<ItemWithWorker | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [transferItem, setTransferItem] = useState<{ item: ItemWithWorker; parentId?: string; workerId?: string } | null>(null);
  const [selectedTransferWorkerId, setSelectedTransferWorkerId] = useState<string>('');
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partsNote, setPartsNote] = useState('');
  const [partsStartTime, setPartsStartTime] = useState('');
  const [partsEndTime, setPartsEndTime] = useState('');
  const [showSupplementaryList, setShowSupplementaryList] = useState(false);
  const [showQuoteList, setShowQuoteList] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    itemId: string;
    workerId: string;
    itemName: string;
  } | null>(null);
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [estimatedMinutes, setEstimatedMinutes] = useState('15');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const params: Record<string, string> = { role: user?.role || 'worker' };
      if (user?.worker_id) params.worker_id = user.worker_id;

      const data = await api.get<{
        order: GeneralRepairOrder;
        workers: RepairWorker[];
        serverTime: string;
        items: ItemWithWorker[];
      }>('api-repairs', `/${orderId}/detail`, params);

      if (data) {
        if (data.serverTime) {
          const serverTime = new Date(data.serverTime).getTime();
          const clientTime = Date.now();
          setServerTimeOffset(serverTime - clientTime);
        }

        if (data.order) setOrder(data.order);
        if (data.workers) setWorkers(data.workers);

        if (data.items) {
          setItems(data.items);

          const newExpanded = new Set(expandedItems);
          data.items.forEach(item => {
            if (item.children && item.children.length > 0) {
              newExpanded.add(item.id);
            }
          });
          setExpandedItems(newExpanded);
        }
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    }

    setLoading(false);
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const addWorkerToItem = (itemId: string, workerId: string, itemName: string) => {
    setPendingAssignment({ itemId, workerId, itemName });
    setEstimatedHours('0');
    setEstimatedMinutes('15');
  };

  const confirmWorkerAssignment = async () => {
    if (!pendingAssignment) return;

    const hours = Number.parseInt(estimatedHours, 10);
    const minutes = Number.parseInt(estimatedMinutes, 10);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      alert('Vui long nhap thoi luong hop le theo gio va phut');
      return;
    }

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      alert('Thoi luong phai lon hon 0 phut');
      return;
    }

    try {
      await api.post('api-repairs', `/items/${pendingAssignment.itemId}/workers`, {
        worker_id: pendingAssignment.workerId,
        estimated_duration_minutes: totalMinutes,
      });

      setPendingAssignment(null);
      setEstimatedHours('0');
      setEstimatedMinutes('15');
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error assigning worker:', error);
      alert(error instanceof Error ? error.message : 'Co loi xay ra khi phan cong tho');
    }
  };

  const removeWorkerFromItem = async (itemId: string, workerId: string) => {
    await api.del('api-repairs', `/items/${itemId}/workers/${workerId}`);
    fetchData();
    onUpdate();
  };

  const transferWork = async (itemId: string, fromWorkerId: string, toWorkerId: string) => {
    await api.post('api-repairs', `/items/${itemId}/transfer`, {
      from_worker_id: fromWorkerId,
      to_worker_id: toWorkerId,
    });

    setTransferItem(null);
    setSelectedTransferWorkerId('');
    fetchData();
    onUpdate();
  };

  const markPriorityToday = async (itemId: string) => {
    try {
      await api.post('api-repairs', `/items/${itemId}/priority-today`, {});
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error marking priority today:', error);
      alert(error instanceof Error ? error.message : 'Co loi xay ra khi danh dau uu tien');
    }
  };

  const toggleWaitingForParts = async (note?: string, startTime?: string, endTime?: string) => {
    const newWaitingStatus = !order?.waiting_for_parts;
    await api.put('api-repairs', `/${orderId}/parts-waiting`, {
      waiting_for_parts: newWaitingStatus,
      parts_order_start_time: startTime || null,
      parts_expected_end_time: endTime || null,
      parts_note: note || null,
    });

    setShowPartsModal(false);
    setPartsNote('');
    setPartsStartTime('');
    setPartsEndTime('');
    fetchData();
    onUpdate();
  };

  const handleDelete = async () => {
    if (!window.confirm('Ban co chac chan muon xoa lenh sua chua nay? Hanh dong nay khong the hoan tac.')) {
      return;
    }

    try {
      await api.del('api-repairs', `/${orderId}`);
      alert('Da xoa lenh sua chua thanh cong');
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Co loi xay ra khi xoa lenh sua chua');
    }
  };

  const initiateStartItem = (itemId: string, workerId: string, parentId?: string) => {
    setCaptureMode({ itemId, workerId, type: 'start', parentId });
  };

  const initiateCompleteItem = (itemId: string, parentId?: string) => {
    setCaptureMode({ itemId, type: 'complete', parentId });
  };

  const handleImageCapture = async (imageData: string) => {
    if (!captureMode) return;

    const { itemId, workerId, type, parentId } = captureMode;

    if (type === 'start' && workerId) {
      await api.post('api-repairs', `/items/${itemId}/start`, {
        image: imageData,
        worker_id: workerId,
        parent_id: parentId || null,
        order_id: orderId,
      });
    } else if (type === 'complete') {
      await api.post('api-repairs', `/items/${itemId}/complete`, {
        image: imageData,
        worker_id: workerId,
        parent_id: parentId || null,
        order_id: orderId,
      });
    } else {
      await api.post('api-repairs', `/items/${itemId}/images`, {
        image_data: imageData,
        image_type: type,
      });
    }

    setCaptureMode(null);
    fetchData();
    onUpdate();
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const serverNow = now.getTime() + serverTimeOffset;
    const diff = Math.max(0, serverNow - start);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCompletedDuration = (startedAt: string, completedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diff = end.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCompleteItem = (item: ItemWithWorker) => {
    if (isAdmin) return true;
    if ((isWorker || isPaint) && user?.worker_id && item.worker_id === user.worker_id) return true;
    return false;
  };

  const canAssignItem = (item: ItemWithWorker) => {
    if (isSales) return false;
    if (isAdmin) return true;
    if (isPaintLead && item.repair_type === 'dong_son') return true;
    if (isWorkerLead && item.repair_type === 'sua_chua') return true;
    return false;
  };

  const getWorkerOptions = (repairType: RepairType | null) => {
    let filteredWorkers = workers;

    if (repairType === 'dong_son') {
      filteredWorkers = workers.filter(w => w.worker_type === 'paint');
    } else if (repairType === 'sua_chua') {
      filteredWorkers = workers.filter(w => w.worker_type === 'repair');
    }

    if (isAdmin || isPaintLead || isWorkerLead) {
      return filteredWorkers;
    }

    if ((isWorker || isPaint) && user?.worker_id) {
      return filteredWorkers.filter(w => w.id === user.worker_id);
    }

    return [];
  };

  const calculateProgress = () => {
    let totalItems = 0;
    let completedItems = 0;

    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        totalItems += item.children.length;
        completedItems += item.children.filter(c => c.status === 'completed').length;
      } else {
        totalItems += 1;
        if (item.status === 'completed') completedItems += 1;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const getCompletedCount = () => {
    let total = 0;
    let completed = 0;

    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        total += item.children.length;
        completed += item.children.filter(c => c.status === 'completed').length;
      } else {
        total += 1;
        if (item.status === 'completed') completed += 1;
      }
    });

    return { completed, total };
  };

  const progress = calculateProgress();
  const { completed: completedCount, total: totalCount } = getCompletedCount();

  const itemCallbacks: ItemCardCallbacks = {
    onToggleExpand: toggleExpand,
    onAddWorker: addWorkerToItem,
    onRemoveWorker: removeWorkerFromItem,
    onStartItem: initiateStartItem,
    onCompleteItem: initiateCompleteItem,
    onMarkPriorityToday: markPriorityToday,
    onViewGallery: (item) => setGalleryItem(item),
    onTransferWork: (item, workerId) => setTransferItem({ item, workerId }),
    canAssignItem,
    canCompleteItem,
    getWorkerOptions,
    formatDuration,
    formatCompletedDuration,
    formatDateTime,
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm">Dang tai...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const repairItems = items.filter(i => i.repair_type === 'sua_chua');
  const paintItems = items.filter(i => i.repair_type === 'dong_son');
  const uncategorizedItems = items.filter(i => !i.repair_type);

  const renderItemList = (itemList: ItemWithWorker[]) =>
    itemList.map((item, idx) => (
      <RepairItemCard
        key={item.id}
        item={item}
        index={idx}
        expandedItems={expandedItems}
        currentWorkerId={user?.worker_id ?? undefined}
        isWorker={isWorker}
        isPaint={isPaint}
        isAdmin={isAdmin}
        isPaintLead={isPaintLead}
        isWorkerLead={isWorkerLead}
        callbacks={itemCallbacks}
      />
    ));

  return (
    <div className="fullscreen-modal">
      <div className="bg-gray-50/95 backdrop-blur-xl w-full h-full overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 backdrop-blur-xl px-4 py-4 border-b border-red-700/50 flex-shrink-0" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{order.license_plate}</h2>
                <p className="text-xs text-red-50/90 truncate">{order.vehicle_name} - {order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(isAdmin || isPaintLead || isWorkerLead) && (
                <button
                  onClick={() => {
                    if (order?.waiting_for_parts) {
                      toggleWaitingForParts();
                    } else {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const hours = String(now.getHours()).padStart(2, '0');
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                      setPartsStartTime(currentDateTime);
                      setShowPartsModal(true);
                    }
                  }}
                  className={`p-2 rounded-[12px] transition-colors ${
                    order?.waiting_for_parts
                      ? 'bg-amber-500 text-white active:bg-amber-600'
                      : 'text-white/80 active:text-white active:bg-white/20'
                  }`}
                  title={order?.waiting_for_parts ? 'Huy doi phu tung' : 'Danh dau doi phu tung'}
                >
                  <Package className="w-5 h-5" />
                </button>
              )}
              {(isAdmin || isPaintLead || isWorkerLead || isSales) && (
                <button
                  onClick={() => setShowSupplementaryList(true)}
                  className="p-2 text-white/80 active:text-white active:bg-white/20 rounded-[12px] transition-colors"
                  title="Phieu phat sinh"
                >
                  <FilePlus className="w-5 h-5" />
                </button>
              )}
              {(isAdmin || isPaintLead || isWorkerLead || isSales) && (
                <button
                  onClick={() => setShowQuoteList(true)}
                  className="p-2 text-white/80 active:text-white active:bg-white/20 rounded-[12px] transition-colors"
                  title="Bao gia bo sung"
                >
                  <Receipt className="w-5 h-5" />
                </button>
              )}
              {(isAdmin || isPaintLead || isWorkerLead || isSales) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-white/80 active:text-white active:bg-white/20 rounded-[12px] transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-white/80 active:text-white active:bg-red-800/50 rounded-[12px] transition-colors"
                  title="Xoa lenh sua chua"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-white/80 active:text-white active:bg-white/20 rounded-[12px] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[20px] p-3 border border-blue-200 shadow-sm">
                <p className="text-[10px] text-blue-600 uppercase tracking-wider font-medium">Ngay nhan</p>
                <p className="text-sm font-semibold text-blue-900 mt-0.5">
                  {new Date(order.receive_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-[20px] p-3 border border-red-200 shadow-sm">
                <p className="text-[10px] text-red-500 uppercase tracking-wider font-medium">Ngay tra</p>
                <p className="text-sm font-semibold text-red-900 mt-0.5">
                  {new Date(order.return_date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Tien do</p>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm ${
                  order.status === 'completed'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                    : order.status === 'in_progress'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                }`}>
                  {order.status === 'completed' ? 'Hoan thanh' : order.status === 'in_progress' ? 'Dang lam' : 'Cho xu ly'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-sm ${progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-12 text-right">{progress}%</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{completedCount}/{totalCount} hang muc hoan thanh</p>
              {order.waiting_for_parts && (
                <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-100 rounded-[12px] border border-amber-200">
                  <Package className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-amber-800 font-semibold">Dang doi phu tung</p>
                    {(order as any).parts_order_start_time && (order as any).parts_expected_end_time && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] text-amber-700">
                          <span className="font-medium">Bat dau:</span> {formatFullDateTime((order as any).parts_order_start_time)}
                        </p>
                        <p className="text-[10px] text-amber-700">
                          <span className="font-medium">Du kien:</span> {formatFullDateTime((order as any).parts_expected_end_time)}
                        </p>
                      </div>
                    )}
                    {order.parts_note && (
                      <p className="text-[10px] text-amber-700 mt-1 italic">{order.parts_note}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {repairItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 rounded-[20px] border border-orange-100">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[12px] flex items-center justify-center shadow-sm">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Sua Chua</h3>
                    <span className="text-[10px] text-orange-500 font-medium">({repairItems.length})</span>
                  </div>
                  <div className="space-y-2">
                    {renderItemList(repairItems)}
                  </div>
                </div>
              )}

              {paintItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2 rounded-[20px] border border-sky-100">
                    <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-blue-500 rounded-[12px] flex items-center justify-center shadow-sm">
                      <PaintBucket className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Dong Son</h3>
                    <span className="text-[10px] text-sky-500 font-medium">({paintItems.length})</span>
                  </div>
                  <div className="space-y-2">
                    {renderItemList(paintItems)}
                  </div>
                </div>
              )}

              {uncategorizedItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Chua phan loai</h3>
                    <span className="text-[10px] text-gray-400">({uncategorizedItems.length})</span>
                  </div>
                  <div className="space-y-2">
                    {renderItemList(uncategorizedItems)}
                  </div>
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">Chua co hang muc nao</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pb-safe-bottom bg-white/80 flex-shrink-0" />
      </div>

      {captureMode && (
        <ImageCaptureModal
          title={captureMode.type === 'start' ? 'Chup anh bat dau' : 'Chup anh hoan thanh'}
          onCapture={handleImageCapture}
          onClose={() => setCaptureMode(null)}
        />
      )}

      {galleryItem && galleryItem.images && (
        <ImageGalleryModal
          images={galleryItem.images}
          itemName={galleryItem.name}
          onClose={() => setGalleryItem(null)}
        />
      )}

      {showEditModal && (
        <EditRepairOrderModal
          orderId={orderId}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchData();
            onUpdate();
          }}
        />
      )}

      {transferItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full rounded-t-[20px] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Chuyen Giao Cong Viec</h3>
                <button
                  onClick={() => {
                    setTransferItem(null);
                    setSelectedTransferWorkerId('');
                  }}
                  className="p-1.5 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-[12px] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-[20px] p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Hang muc</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{transferItem.item.name}</p>
              </div>

              <div className="bg-amber-50 rounded-[20px] p-3 border border-amber-100">
                <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Tho hien tai</p>
                <p className="text-sm font-medium text-amber-800 mt-0.5">
                  {workers.find(w => w.id === transferItem.workerId)?.name || transferItem.item.worker?.name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Chuyen giao cho</label>
                <select
                  value={selectedTransferWorkerId}
                  onChange={(e) => setSelectedTransferWorkerId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="">Chon tho...</option>
                  {getWorkerOptions(transferItem.item.repair_type)
                    .filter(w => w.id !== (transferItem.workerId || transferItem.item.worker_id))
                    .map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex gap-3">
              <button
                onClick={() => {
                  setTransferItem(null);
                  setSelectedTransferWorkerId('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-[20px] font-medium text-sm active:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Huy
              </button>
              <button
                onClick={() => {
                  const fromWorkerId = transferItem.workerId || transferItem.item.worker_id;
                  if (selectedTransferWorkerId && fromWorkerId) {
                    transferWork(transferItem.item.id, fromWorkerId, selectedTransferWorkerId);
                  }
                }}
                disabled={!selectedTransferWorkerId}
                className="flex-1 py-3 bg-amber-500 text-white rounded-[20px] font-medium text-sm active:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-all"
              >
                Xac Nhan
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}

      {showSupplementaryList && order && (
        <SupplementarySlipListModal
          orderId={orderId}
          customerName={order.customer_name}
          vehicleName={order.vehicle_name}
          licensePlate={order.license_plate}
          onClose={() => setShowSupplementaryList(false)}
        />
      )}

      {showQuoteList && order && (
        <SupplementaryQuoteListModal
          orderId={orderId}
          licensePlate={order.license_plate}
          onClose={() => {
            setShowQuoteList(false);
            fetchData();
            onUpdate();
          }}
        />
      )}

      {pendingAssignment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full rounded-t-[20px] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Thoi Luong Du Kien</h3>
                <button
                  onClick={() => setPendingAssignment(null)}
                  className="p-1.5 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-[12px] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-[20px] p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Hang muc</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{pendingAssignment.itemName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Gio</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Phut</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Vi du: 0 gio 15 phut nghia la 15 phut.
              </p>
            </div>

            <div className="px-5 pb-5 pt-2 flex gap-3">
              <button
                onClick={() => setPendingAssignment(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-[20px] font-medium text-sm active:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Huy
              </button>
              <button
                onClick={confirmWorkerAssignment}
                className="flex-1 py-3 bg-red-500 text-white rounded-[20px] font-medium text-sm active:bg-red-600 active:scale-[0.98] transition-all"
              >
                Xac Nhan
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}

      {showPartsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-[60]">
          <div className="bg-white w-full rounded-t-[20px] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-semibold text-gray-900">Doi Phu Tung</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPartsModal(false);
                    setPartsNote('');
                  }}
                  className="p-1.5 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-[12px] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 rounded-[20px] p-3 border border-amber-100">
                <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium mb-1">Bien so xe</p>
                <p className="text-sm font-medium text-amber-800">{order?.license_plate}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Thoi gian bat dau dat <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={partsStartTime}
                  onChange={(e) => setPartsStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Thoi gian du kien nhan <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={partsEndTime}
                  onChange={(e) => setPartsEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Ghi chu phu tung can doi (khong bat buoc)</label>
                <textarea
                  value={partsNote}
                  onChange={(e) => setPartsNote(e.target.value)}
                  placeholder="VD: Can doi cop sau, den truoc trai..."
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-[20px] text-sm focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex gap-3">
              <button
                onClick={() => {
                  setShowPartsModal(false);
                  setPartsNote('');
                  setPartsStartTime('');
                  setPartsEndTime('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-[20px] font-medium text-sm active:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Huy
              </button>
              <button
                onClick={() => toggleWaitingForParts(partsNote, partsStartTime, partsEndTime)}
                disabled={!partsStartTime || !partsEndTime}
                className="flex-1 py-3 bg-amber-500 text-white rounded-[20px] font-medium text-sm active:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-all"
              >
                Xac Nhan
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </div>
  );
}
