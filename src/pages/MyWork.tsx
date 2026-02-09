import { useState, useEffect } from 'react';
import type { RepairItem, GeneralRepairOrder, RepairItemImage } from '../lib/supabase';
import { api } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, Play, Car, Image as ImageIcon } from 'lucide-react';
import ImageCaptureModal from '../components/repairs/ImageCaptureModal';
import ImageGalleryModal from '../components/repairs/ImageGalleryModal';

interface WorkItemWithOrder extends RepairItem {
  order?: GeneralRepairOrder;
  images?: RepairItemImage[];
}

interface MyWorkResponse {
  pending?: WorkItemWithOrder[];
  inProgress?: WorkItemWithOrder[];
  completed?: WorkItemWithOrder[];
}

export function MyWork() {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<WorkItemWithOrder[]>([]);
  const [inProgressItems, setInProgressItems] = useState<WorkItemWithOrder[]>([]);
  const [completedItems, setCompletedItems] = useState<WorkItemWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'in_progress' | 'completed'>('in_progress');
  const [captureItem, setCaptureItem] = useState<{ itemId: string; orderId: string } | null>(null);
  const [galleryItem, setGalleryItem] = useState<WorkItemWithOrder | null>(null);

  useEffect(() => {
    if (user?.worker_id) {
      fetchMyWork();
    }
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMyWork = async () => {
    if (!user?.worker_id) return;
    setLoading(true);

    try {
      const response = await api.get<MyWorkResponse | WorkItemWithOrder[]>('api-my-work', '/', { worker_id: user.worker_id });

      if (Array.isArray(response)) {
        setPendingItems(response.filter(i => i.status === 'pending'));
        setInProgressItems(response.filter(i => i.status === 'in_progress'));
        setCompletedItems(response.filter(i => i.status === 'completed'));
      } else if (response) {
        setPendingItems(response.pending || []);
        setInProgressItems(response.inProgress || []);
        setCompletedItems(response.completed || []);
      }
    } catch (err) {
      console.error('Error fetching my work:', err);
      setPendingItems([]);
      setInProgressItems([]);
      setCompletedItems([]);
    }

    setLoading(false);
  };

  const initiateComplete = (itemId: string, orderId: string) => {
    setCaptureItem({ itemId, orderId });
  };

  const handleImageCapture = async (imageData: string) => {
    if (!captureItem) return;
    const { itemId, orderId } = captureItem;

    try {
      await api.post('api-my-work', `/items/${itemId}/complete`, {
        imageData,
        worker_id: user?.worker_id,
        order_id: orderId,
      });

      setCaptureItem(null);
      fetchMyWork();
    } catch (error) {
      console.error('Error completing item:', error);
      alert(error instanceof Error ? error.message : 'Co loi xay ra khi hoan thanh cong viec');
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const diff = now.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCompletedDuration = (startedAt: string, completedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} ngay ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  if (!user?.worker_id) {
    return (
      <div className="flex items-center justify-center px-6 py-20">
        <p className="text-gray-400 text-sm text-center">Tai khoan chua duoc lien ket voi tho sua chua.</p>
      </div>
    );
  }

  const activeItems = [...pendingItems, ...inProgressItems];

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-gray-400 mb-3">Xin chao, {user.display_name}</p>
        <div className="tab-bar">
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`tab-item ${activeTab === 'in_progress' ? 'tab-item-active' : ''}`}
          >
            <Play className="w-3.5 h-3.5 inline mr-1" />
            Cong viec ({activeItems.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`tab-item ${activeTab === 'completed' ? 'tab-item-active' : ''}`}
          >
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
            Hoan thanh ({completedItems.length})
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : activeTab === 'in_progress' ? (
          activeItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Khong co cong viec duoc phan cong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeItems.map((item) => (
                <div key={item.id} className="card border-red-100 overflow-visible">
                  <div className="h-1 bg-red-500 rounded-t-2xl" />
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                    {item.order && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Car className="w-3.5 h-3.5" />
                        <span className="font-mono">{item.order.license_plate}</span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">{item.order.vehicle_name}</span>
                      </div>
                    )}
                    {item.status === 'pending' ? (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Da duoc phan cong - Cho bat dau
                        </span>
                      </div>
                    ) : item.started_at && (
                      <div className="flex items-center gap-2 text-red-600 mb-3">
                        <Clock className="w-5 h-5" />
                        <span className="font-mono text-2xl font-bold tracking-tight">{formatDuration(item.started_at)}</span>
                      </div>
                    )}
                    {item.status === 'in_progress' && (
                      <button
                        onClick={() => initiateComplete(item.id, item.order_id)}
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:bg-emerald-600 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Hoan thanh cong viec
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : completedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">Chua co cong viec hoan thanh</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedItems.map((item) => (
              <div key={item.id} className="card p-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-through truncate">{item.name}</h3>
                        {item.order && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {item.order.license_plate} - {item.order.vehicle_name}
                          </p>
                        )}
                      </div>
                      {item.images && item.images.length > 0 && (
                        <button
                          onClick={() => setGalleryItem(item)}
                          className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                    {item.started_at && item.completed_at && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                        {formatCompletedDuration(item.started_at, item.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {captureItem && (
        <ImageCaptureModal
          title="Chup anh hoan thanh cong viec"
          onCapture={handleImageCapture}
          onClose={() => setCaptureItem(null)}
        />
      )}

      {galleryItem && galleryItem.images && (
        <ImageGalleryModal
          images={galleryItem.images}
          itemName={galleryItem.name}
          onClose={() => setGalleryItem(null)}
        />
      )}
    </div>
  );
}
