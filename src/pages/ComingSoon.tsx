import { Clock, Wrench } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="px-4 pb-4">
        <div className="card p-8 text-center">
          <div className="relative mb-6 inline-block">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <Wrench className="w-10 h-10 text-red-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-4">{description}</p>

          <div className="status-badge bg-red-50 text-red-600 inline-flex items-center gap-1.5 px-3 py-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Dang phat trien
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Tinh nang nay se som duoc cap nhat. Cam on ban da kien nhan cho doi!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
