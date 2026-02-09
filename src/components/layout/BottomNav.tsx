import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MenuSection } from './Layout';
import {
  LayoutDashboard,
  ClipboardList,
  Hammer,
  FolderOpen,
  MoreHorizontal,
  CalendarClock,
  Calendar,
  FileCheck,
  FileText,
  ClipboardCheck,
  Users,
  CreditCard,
  Package,
  Video,
  HeartHandshake,
  Gauge,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: MenuSection | '_more';
  label: string;
  icon: typeof LayoutDashboard;
}

interface MoreMenuItem {
  id: MenuSection;
  label: string;
  icon: typeof Settings;
}

const MORE_MENU_ADMIN: MoreMenuItem[] = [
  { id: 'performance', label: 'Hieu Suat', icon: Gauge },
  { id: 'repair-schedule', label: 'Lich Sua Chua', icon: CalendarClock },
  { id: 'appointments', label: 'Lich Hen', icon: Calendar },
  { id: 'inspection-requests', label: 'Yeu Cau Kiem Tra', icon: FileCheck },
  { id: 'quotes', label: 'Bao Gia', icon: FileText },
  { id: 'service-requests', label: 'Yeu Cau Dich Vu', icon: ClipboardCheck },
  { id: 'customers', label: 'Khach Hang', icon: Users },
  { id: 'quality-inspection', label: 'Kiem Tra Chat Luong', icon: ClipboardCheck },
  { id: 'payment-invoices', label: 'Phieu Thanh Toan', icon: CreditCard },
  { id: 'parts-inventory', label: 'Kho Phu Tung', icon: Package },
  { id: 'marketing', label: 'Marketing', icon: Video },
  { id: 'customer-care', label: 'Cham Soc Khach Hang', icon: HeartHandshake },
  { id: 'settings', label: 'Cai Dat', icon: Settings },
];

const MORE_MENU_LEAD: MoreMenuItem[] = [
  { id: 'performance', label: 'Hieu Suat', icon: Gauge },
  { id: 'inspection-requests', label: 'Yeu Cau Kiem Tra', icon: FileCheck },
  { id: 'settings', label: 'Cai Dat', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { id: 'overview', label: 'Tong quan', icon: LayoutDashboard },
  { id: 'repair-orders', label: 'Lenh SC', icon: ClipboardList },
  { id: 'vehicle-records', label: 'Ho so xe', icon: FolderOpen },
  { id: 'my-work', label: 'Cong viec', icon: Hammer },
  { id: '_more', label: 'Them', icon: MoreHorizontal },
];

const WORKER_NAV: NavItem[] = [
  { id: 'repair-orders', label: 'Lenh SC', icon: ClipboardList },
  { id: 'my-work', label: 'Cong viec', icon: Hammer },
];

const LEAD_NAV: NavItem[] = [
  { id: 'repair-orders', label: 'Lenh SC', icon: ClipboardList },
  { id: 'my-work', label: 'Cong viec', icon: Hammer },
  { id: 'quality-inspection', label: 'Kiem tra', icon: FolderOpen },
  { id: '_more', label: 'Them', icon: MoreHorizontal },
];

const SALES_NAV: NavItem[] = [
  { id: 'repair-orders', label: 'Lenh SC', icon: ClipboardList },
  { id: 'quotes', label: 'Bao gia', icon: FolderOpen },
  { id: 'service-requests', label: 'YC DV', icon: Hammer },
];

interface BottomNavProps {
  currentSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
}

export function BottomNav({ currentSection, onSectionChange }: BottomNavProps) {
  const { isAdmin, isWorkerLead, isPaintLead, isSales } = useAuth();
  const [showMore, setShowMore] = useState(false);

  let navItems: NavItem[];
  let moreMenuItems: MoreMenuItem[] = [];

  if (isAdmin) {
    navItems = ADMIN_NAV;
    moreMenuItems = MORE_MENU_ADMIN;
  } else if (isWorkerLead) {
    navItems = LEAD_NAV;
    moreMenuItems = MORE_MENU_LEAD;
  } else if (isPaintLead) {
    navItems = [...WORKER_NAV, { id: '_more' as const, label: 'Them', icon: MoreHorizontal }];
    moreMenuItems = MORE_MENU_LEAD;
  } else if (isSales) {
    navItems = SALES_NAV;
  } else {
    navItems = WORKER_NAV;
  }

  const handleNavClick = (id: string) => {
    if (id === '_more') {
      setShowMore(true);
    } else {
      onSectionChange(id as MenuSection);
    }
  };

  const handleMenuNavigate = (section: MenuSection) => {
    onSectionChange(section);
    setShowMore(false);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: 'var(--safe-bottom)', maxWidth: '480px', margin: '0 auto' }}
      >
        <div
          className="mx-3 mb-2.5"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '22px',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(139, 92, 246, 0.04)',
          }}
        >
          <div className="flex items-center justify-around h-[66px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isMore = item.id === '_more';
              const isActive = !isMore && currentSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
                  style={{ color: isActive ? '#dc2626' : '#9ca3af' }}
                >
                  <div
                    className="relative p-1.5 rounded-xl transition-all"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(244, 114, 182, 0.06) 100%)',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
                    } : {}}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {showMore && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setShowMore(false)} />
          <div className="bottom-sheet">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200/50 rounded-full" />
            </div>

            <div className="px-3 py-3 max-h-[60dvh] overflow-y-auto">
              <p className="px-2 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Cac muc khac
              </p>
              <div className="space-y-0.5">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuNavigate(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-gray-600 active:bg-white/50 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(0, 0, 0, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                        }}>
                        <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                      </div>
                      <span className="text-[14px] font-medium flex-1 text-left">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
