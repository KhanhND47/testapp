import { useState } from 'react';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import PendingInspections from '../components/quality/PendingInspections';
import CompletedInspections from '../components/quality/CompletedInspections';

type TabType = 'pending' | 'completed';

export default function QualityInspection() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Kiem Tra Chat Luong</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly nghiem thu chat luong sua chua</p>
      </div>

      <div className="px-4 pb-4">
        <div className="tab-bar mb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={activeTab === 'pending' ? 'tab-item-active' : 'tab-item'}
          >
            <ClipboardCheck className="w-4 h-4" />
            Doi Kiem Tra
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={activeTab === 'completed' ? 'tab-item-active' : 'tab-item'}
          >
            <CheckCircle2 className="w-4 h-4" />
            Da Nghiem Thu
          </button>
        </div>

        {activeTab === 'pending' && <PendingInspections />}
        {activeTab === 'completed' && <CompletedInspections />}
      </div>
    </div>
  );
}
