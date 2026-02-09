import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { MenuSection } from './components/layout/Layout';
import { Marketing } from './pages/Marketing';
import { RepairOrders } from './pages/RepairOrders';
import { RepairSchedule } from './pages/RepairSchedule';
import { MyWork } from './pages/MyWork';
import { Login } from './pages/Login';
import { ComingSoon } from './pages/ComingSoon';
import { Settings } from './pages/Settings';
import { Appointments } from './pages/Appointments';
import { PartsInventory } from './pages/PartsInventory';
import { VehicleRecords } from './pages/VehicleRecords';
import InspectionRequests from './pages/InspectionRequests';
import Quotes from './pages/Quotes';
import ServiceRequests from './pages/ServiceRequests';
import { Customers } from './pages/Customers';
import QualityInspection from './pages/QualityInspection';
import PaymentInvoices from './pages/PaymentInvoices';
import { Overview } from './pages/Overview';
import { Performance } from './pages/Performance';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const sectionTitles: Record<MenuSection, string> = {
  'overview': 'Tong Quan',
  'performance': 'Hieu Suat',
  'repair-orders': 'Lenh Sua Chua',
  'repair-schedule': 'Lich Sua Chua',
  'my-work': 'Cong Viec Cua Toi',
  'appointments': 'Lich Hen',
  'customer-care': 'Cham Soc KH',
  'marketing': 'Marketing',
  'parts-inventory': 'Kho Phu Tung',
  'vehicle-records': 'Ho So Xe',
  'inspection-requests': 'Yeu Cau KT',
  'quotes': 'Bao Gia',
  'service-requests': 'Yeu Cau DV',
  'customers': 'Khach Hang',
  'quality-inspection': 'Kiem Tra CL',
  'payment-invoices': 'Thanh Toan',
  'settings': 'Cai Dat'
};

function AppContent() {
  const { user, loading, isAdmin, isWorker, isPaint, isPaintLead, isWorkerLead } = useAuth();
  const [currentSection, setCurrentSection] = useState<MenuSection>('overview');

  useEffect(() => {
    if (user && user.role) {
      if (isWorker || isPaint || isPaintLead || isWorkerLead) {
        setCurrentSection('repair-orders');
      } else if (isAdmin) {
        setCurrentSection('overview');
      } else {
        setCurrentSection('repair-orders');
      }
    }
  }, [user, isAdmin, isWorker, isPaint, isPaintLead, isWorkerLead]);

  if (loading) {
    return (
      <div className="mobile-shell min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Dang tai...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        if (isAdmin) return <Overview onNavigate={setCurrentSection} />;
        return <RepairOrders />;
      case 'performance':
        if (isAdmin || isWorkerLead || isPaintLead) return <Performance />;
        return <RepairOrders />;
      case 'repair-orders':
        return <RepairOrders />;
      case 'repair-schedule':
        if (isAdmin || isWorkerLead) return <RepairSchedule />;
        return <RepairOrders />;
      case 'my-work':
        if (isWorker || isPaint || isPaintLead || isWorkerLead) return <MyWork />;
        return <RepairOrders />;
      case 'appointments':
        if (isAdmin) return <Appointments />;
        return <RepairOrders />;
      case 'vehicle-records':
        if (isAdmin) return <VehicleRecords />;
        return <RepairOrders />;
      case 'inspection-requests':
        if (isAdmin || isWorkerLead) return <InspectionRequests />;
        return <RepairOrders />;
      case 'quotes':
        if (isAdmin) return <Quotes />;
        return <RepairOrders />;
      case 'service-requests':
        if (isAdmin) return <ServiceRequests />;
        return <RepairOrders />;
      case 'customers':
        if (isAdmin) return <Customers />;
        return <RepairOrders />;
      case 'quality-inspection':
        if (isAdmin || isWorkerLead) return <QualityInspection />;
        return <RepairOrders />;
      case 'payment-invoices':
        if (isAdmin) return <PaymentInvoices />;
        return <RepairOrders />;
      case 'marketing':
        if (isAdmin) return <Marketing />;
        return <RepairOrders />;
      case 'parts-inventory':
        if (isAdmin) return <PartsInventory />;
        return <RepairOrders />;
      case 'customer-care':
        if (isAdmin) return (
          <ComingSoon
            title="Cham Soc Khach Hang"
            description="Theo doi va cham soc khach hang, gui thong bao nhac lich bao duong dinh ky."
          />
        );
        return <RepairOrders />;
      case 'settings':
        if (isAdmin) return <Settings />;
        return <RepairOrders />;
      default:
        return <RepairOrders />;
    }
  };

  return (
    <Layout
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      title={sectionTitles[currentSection]}
    >
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
