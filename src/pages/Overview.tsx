import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';
import {
  ClipboardList,
  FileCheck,
  Stethoscope,
  Calculator,
  FileSignature,
  Wrench,
  CheckCircle2,
  CreditCard,
  CarFront,
  RefreshCw,
  Car
} from 'lucide-react';

type MenuSection = 'overview' | 'repair-orders' | 'repair-schedule' | 'my-work' | 'appointments' | 'customer-care' | 'marketing' | 'parts-inventory' | 'vehicle-records' | 'inspection-requests' | 'quotes' | 'service-requests' | 'customers' | 'quality-inspection' | 'payment-invoices' | 'settings';

interface StepData {
  key: string;
  step: string;
  label: string;
  icon: typeof ClipboardList;
  count: number;
  route: MenuSection;
}

interface OverviewProps {
  onNavigate?: (section: MenuSection) => void;
}

interface OverviewData {
  vrOrders: { id: string; status: string }[];
  repairOrders: { id: string; status: string; return_date: string }[];
  inspections: { id: string; repair_order_id: string; overall_result: string; status: string }[];
}

export function Overview({ onNavigate }: OverviewProps) {
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!loading) setRefreshing(true);
    try {
      const data = await api.get<OverviewData>('api-overview', '/');

      const vrOrders = data.vrOrders || [];
      const repairOrders = data.repairOrders || [];
      const inspections = data.inspections || [];

      const vrStatusCounts: Record<string, number> = {};
      vrOrders.forEach(o => {
        vrStatusCounts[o.status] = (vrStatusCounts[o.status] || 0) + 1;
      });

      const activeRepairOrders = repairOrders.filter(o => o.status === 'in_progress' || o.status === 'pending').length;
      const completedInspections = inspections.filter(i => i.status === 'completed' && i.overall_result === 'pass');
      const inspectedOrderIds = new Set(completedInspections.map(i => i.repair_order_id));
      const completedRepairOrders = repairOrders.filter(o => o.status === 'completed');
      const awaitingPayment = completedRepairOrders.filter(o => inspectedOrderIds.has(o.id)).length;

      setSteps([
        { key: 'received', step: '01', label: 'Tiep Nhan', icon: ClipboardList, count: vrStatusCounts['received'] || 0, route: 'vehicle-records' },
        { key: 'inspecting', step: '02', label: 'Kiem Tra', icon: FileCheck, count: vrStatusCounts['inspecting'] || 0, route: 'inspection-requests' },
        { key: 'diagnosed', step: '03', label: 'Chan Doan', icon: Stethoscope, count: vrStatusCounts['diagnosed'] || 0, route: 'vehicle-records' },
        { key: 'quoted', step: '04', label: 'Bao Gia', icon: Calculator, count: vrStatusCounts['quoted'] || 0, route: 'quotes' },
        { key: 'approved', step: '05', label: 'YC Dich Vu', icon: FileSignature, count: vrStatusCounts['approved'] || 0, route: 'service-requests' },
        { key: 'in_progress', step: '06', label: 'Sua Chua', icon: Wrench, count: activeRepairOrders, route: 'repair-orders' },
        { key: 'inspection', step: '07', label: 'Nghiem Thu', icon: CheckCircle2, count: completedInspections.length, route: 'quality-inspection' },
        { key: 'payment', step: '08', label: 'Thanh Toan', icon: CreditCard, count: awaitingPayment, route: 'payment-invoices' },
        { key: 'delivered', step: '09', label: 'Ban Giao', icon: CarFront, count: vrStatusCounts['delivered'] || 0, route: 'vehicle-records' },
      ]);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    );
  }

  const totalVehicles = steps.reduce((sum, s) => sum + s.count, 0);
  const deliveredCount = steps.find(s => s.key === 'delivered')?.count || 0;
  const processingCount = totalVehicles - deliveredCount;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh',  weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center active:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <Car className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{totalVehicles}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Tong xe</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{deliveredCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Da giao</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-1.5">
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{processingCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Dang xu ly</p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => onNavigate?.(step.route)}
              className="card-pressable w-full flex items-center gap-3 p-3"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-gray-900">{step.label}</p>
                <p className="text-[10px] text-gray-400 font-medium">Buoc {step.step}</p>
              </div>
              <div className={`min-w-[40px] h-8 rounded-xl flex items-center justify-center px-2 ${
                step.count > 0 ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <span className={`text-sm font-bold ${step.count > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                  {step.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
