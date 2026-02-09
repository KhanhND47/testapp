import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui long nhap ten dang nhap');
      return;
    }
    if (!password) {
      setError('Vui long nhap mat khau');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password, remember);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Dang nhap that bai');
    }
  };

  return (
    <div className="mobile-shell min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12" style={{ paddingTop: 'calc(var(--safe-top) + 48px)' }}>
        <div className="text-center mb-10">
          <img
            src="https://dana365garage.com/wp-content/uploads/2025/10/logo-dana365-garage-trung-tam-sua-chua-o-to-da-nang-e1761275008441.png"
            alt="DANA365 Garage"
            className="h-16 w-auto object-contain mx-auto mb-4"
          />
          <p className="text-gray-400 text-sm">He thong quan ly garage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600 font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ten dang nhap
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-12"
                placeholder="Nhap ten dang nhap"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mat khau
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12"
                placeholder="Nhap mat khau"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 text-red-600 border-gray-300 rounded-lg focus:ring-red-500"
            />
            <label htmlFor="remember" className="ml-3 text-sm text-gray-600">
              Ghi nho dang nhap
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Dang Nhap
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-gray-300 text-xs pb-8" style={{ paddingBottom: 'calc(var(--safe-bottom) + 32px)' }}>
        2024 DANA365 Garage
      </p>
    </div>
  );
}
