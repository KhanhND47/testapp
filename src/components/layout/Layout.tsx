import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';

export type MenuSection = 'overview' | 'performance' | 'repair-orders' | 'repair-schedule' | 'my-work' | 'appointments' | 'customer-care' | 'marketing' | 'parts-inventory' | 'vehicle-records' | 'inspection-requests' | 'quotes' | 'service-requests' | 'customers' | 'quality-inspection' | 'payment-invoices' | 'settings';

interface LayoutProps {
  children: ReactNode;
  currentSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
  title: string;
}

export function Layout({ children, currentSection, onSectionChange, title }: LayoutProps) {
  return (
    <div className="mobile-shell">
      <MobileHeader title={title} onSectionChange={onSectionChange} />
      <main className="page-container">
        {children}
      </main>
      <BottomNav currentSection={currentSection} onSectionChange={onSectionChange} />
    </div>
  );
}
