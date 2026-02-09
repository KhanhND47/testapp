import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';
import { Settings as SettingsIcon, Save, Bell, BellOff, CheckCircle, XCircle, Eye, EyeOff, ScanLine } from 'lucide-react';

export function Settings() {
  const [botToken, setBotToken] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ setting_key: string; setting_value: string }[]>('api-settings', '/');

      if (data) {
        const tokenSetting = data.find(s => s.setting_key === 'telegram_bot_token');
        const enabledSetting = data.find(s => s.setting_key === 'telegram_notifications_enabled');
        const geminiSetting = data.find(s => s.setting_key === 'gemini_api_key');

        if (tokenSetting) setBotToken(tokenSetting.setting_value);
        if (enabledSetting) setNotificationsEnabled(enabledSetting.setting_value === 'true');
        if (geminiSetting) setGeminiApiKey(geminiSetting.setting_value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await api.put('api-settings', '/', {
        settings: [
          { setting_key: 'telegram_bot_token', setting_value: botToken },
          { setting_key: 'telegram_notifications_enabled', setting_value: notificationsEnabled ? 'true' : 'false' },
          { setting_key: 'gemini_api_key', setting_value: geminiApiKey },
        ],
      });

      setMessage({ type: 'success', text: 'Cai dat da duoc luu thanh cong!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Loi khi luu cai dat. Vui long thu lai.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900">Cai Dat He Thong</h1>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <div className="card p-4">
            <div className="space-y-3">
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton h-10 w-full rounded" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cai Dat He Thong</h1>
            <p className="text-xs text-gray-500">Quan ly cau hinh ung dung</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {message && (
          <div className={`card p-3 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-teal-50 border-teal-200'
              : 'bg-red-50 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-teal-700' : 'text-red-700'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                notificationsEnabled ? 'bg-teal-100' : 'bg-gray-200'
              }`}>
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-teal-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Thong bao Telegram</h2>
                <p className="text-xs text-gray-500">Cau hinh bot gui thong bao tu dong</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <label className="flex items-center gap-3 min-h-[44px]">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-300 rounded-full peer-checked:bg-teal-500 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Bat thong bao Telegram</p>
                <p className="text-xs text-gray-400">Tu dong gui thong bao khi phan cong viec</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Nhap token tu BotFather"
                className="input-field w-full py-2.5 text-sm font-mono"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Lay token tu{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium"
                >
                  @BotFather
                </a>
                {' '}tren Telegram
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-1.5">Huong dan cai dat:</h3>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Mo Telegram va tim kiem @BotFather</li>
                <li>Gui lenh /newbot va lam theo huong dan</li>
                <li>Sao chep token va dan vao o tren</li>
                <li>Cau hinh Chat ID cho tung tho trong phan Quan ly</li>
                <li>De lay Chat ID, tho can gui tin nhan /start cho bot cua ban</li>
              </ol>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn-primary w-full py-3 text-sm font-semibold min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Dang luu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Luu cai dat
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-100">
                <ScanLine className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Nhan dien bien so xe</h2>
                <p className="text-xs text-gray-500">Cau hinh Google Gemini API cho nhan dien bien so</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Nhap Gemini API key"
                  className="input-field w-full py-2.5 pr-11 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-400 active:text-gray-600"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Lay API key mien phi tai{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
              <h3 className="text-sm font-semibold text-sky-900 mb-1.5">Huong dan:</h3>
              <ol className="text-xs text-sky-700 space-y-1 list-decimal list-inside">
                <li>Truy cap Google AI Studio (aistudio.google.com)</li>
                <li>Dang nhap bang tai khoan Google</li>
                <li>Nhan "Get API key" de tao key mien phi</li>
                <li>Sao chep key va dan vao o tren</li>
              </ol>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn-primary w-full py-3 text-sm font-semibold min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Dang luu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Luu cai dat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
