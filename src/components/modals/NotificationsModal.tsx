import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, CheckCheck, Bell, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDateID } from '../../utils/formatters';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinance();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'achievement':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'goal':
        return <CheckCircle2 className="w-4 h-4 text-sky-600" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">Pemberitahuan & Peringatan</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Baca Semua</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada pemberitahuan baru.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markNotificationRead(item.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-neutral-50/60 border-neutral-200 opacity-75'
                    : 'bg-white border-neutral-300 shadow-xs ring-1 ring-emerald-500/10'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold ${item.read ? 'text-neutral-800' : 'text-neutral-900'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400 tabular-nums shrink-0">
                        {formatDateID(item.date, 'short')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
