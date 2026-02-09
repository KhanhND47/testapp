import { useState } from 'react';
import { LayoutDashboard, PaintBucket, Wrench, Settings } from 'lucide-react';
import { MarketingDashboard } from '../components/marketing/MarketingDashboard';
import { ContentLine } from '../components/marketing/ContentLine';

type MarketingTab = 'dashboard' | 'paint' | 'repair' | 'maintenance';

const tabs = [
  { id: 'dashboard' as MarketingTab, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'paint' as MarketingTab, label: 'Sơn Xe', icon: PaintBucket },
  { id: 'repair' as MarketingTab, label: 'Sửa Chữa', icon: Wrench },
  { id: 'maintenance' as MarketingTab, label: 'Bảo Dưỡng', icon: Settings },
];

export function Marketing() {
  const [currentTab, setCurrentTab] = useState<MarketingTab>('dashboard');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 sm:p-2">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg
                  font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {currentTab === 'dashboard' && <MarketingDashboard />}
        {currentTab === 'paint' && <ContentLine contentLine="PAINT" />}
        {currentTab === 'repair' && <ContentLine contentLine="REPAIR" />}
        {currentTab === 'maintenance' && <ContentLine contentLine="MAINTENANCE" />}
      </div>
    </div>
  );
}
