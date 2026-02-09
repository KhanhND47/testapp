import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MenuSection } from './Layout';
import { User, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onSectionChange: (section: MenuSection) => void;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const [showAccount, setShowAccount] = useState(false);

  const roleLabel = user?.role === 'admin' ? 'Quan tri vien' :
    user?.role === 'worker_lead' ? 'Truong nhom tho' :
    user?.role === 'paint_lead' ? 'Truong nhom son' :
    user?.role === 'paint' ? 'Tho son' :
    user?.role === 'sales' ? 'Kinh doanh' : 'Tho sua chua';

  return (
    <>
      <header
        className="sticky top-0 z-30"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="relative">
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
            }}
          />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-6 rounded-full blur-xl"
            style={{ background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.12), transparent)' }}
          />

          <div className="relative flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://dana365garage.com/wp-content/uploads/2025/10/logo-dana365-garage-trung-tam-sua-chua-o-to-da-nang-e1761275008441.png"
                alt="DANA365"
                className="h-7 w-auto flex-shrink-0"
              />
              <h1 className="text-[17px] font-bold text-gray-800 truncate tracking-tight">{title}</h1>
            </div>
            <button
              onClick={() => setShowAccount(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(244, 114, 182, 0.12) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.08)',
              }}
            >
              <User className="w-4 h-4 text-violet-500" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {showAccount && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setShowAccount(false)} />
          <div className="bottom-sheet">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200/50 rounded-full" />
            </div>

            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #e84a5f 50%, #ec6990 100%)',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{user?.display_name}</p>
                  <p className="text-sm text-gray-400">{roleLabel}</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => {
                  setShowAccount(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-red-500 active:opacity-80 transition-all"
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                }}
              >
                <LogOut className="w-4 h-4" />
                Dang xuat
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
