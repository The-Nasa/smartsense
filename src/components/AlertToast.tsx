import { useEffect } from 'react';
import { ShieldAlert, X, Bell } from 'lucide-react';
import { GasEvento } from '../types';

interface AlertToastProps {
  event: GasEvento | null;
  onClose: () => void;
}

export default function AlertToast({ event, onClose }: AlertToastProps) {
  useEffect(() => {
    if (event) {
      // Auto close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      id="live-alert-toast"
      className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-600 text-white rounded-2xl shadow-2xl border border-red-500 overflow-hidden animate-bounce-short"
    >
      <div className="p-4 flex gap-3.5">
        <div className="p-2.5 bg-white/10 rounded-xl text-white shrink-0 h-fit self-start animate-pulse">
          <ShieldAlert className="w-6 h-6" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-200 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 fill-red-200" />
              Alerta en tiempo real
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-extrabold text-white text-base tracking-tight font-display">
            ¡Fuga de Gas Detectada!
          </h3>
          <p className="text-xs text-red-100">
            Nivel actual del sensor: <b className="text-white font-mono text-sm">{event.valor_gas} ppm</b>
          </p>
          <p className="text-[10px] text-red-200">
            Hora: {new Date(event.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="bg-red-700/60 px-4 py-2 text-center text-[10px] font-semibold text-red-100 border-t border-red-500/30">
        Revisa la pestaña "Dashboard" para monitorear el evento en vivo.
      </div>
    </div>
  );
}
