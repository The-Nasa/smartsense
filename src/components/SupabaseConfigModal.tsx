import React from 'react';
import { X, Database, ShieldAlert, Sparkles, Play } from 'lucide-react';
import { triggerManualLeak } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  if (!isOpen) return null;

  const handleTriggerTest = (type: 'leve' | 'moderada' | 'critica') => {
    triggerManualLeak(type);
    onClose();
  };

  return (
    <div id="supabase-config-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Database className="w-5 h-5" id="config-db-icon" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Simulador de Pruebas</h2>
              <p className="text-xs text-slate-500">Inyecta lecturas simuladas en tiempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Inyectar Gas de Prueba</h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Utiliza estas opciones para simular eventos repentinos de gas. Esto inyectará un registro inmediatamente para probar los indicadores visuales, el parpadeo de alerta de la barra superior y los avisos de advertencia en vivo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleTriggerTest('leve')}
                className="p-3 border border-emerald-100 hover:border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl text-left group transition cursor-pointer"
              >
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded uppercase mb-2">Aire Limpio / Leve</span>
                <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  Inyectar ~800 ppm
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Por debajo del umbral estándar. Estado normal.</p>
              </button>

              <button
                onClick={() => handleTriggerTest('moderada')}
                className="p-3 border border-amber-100 hover:border-amber-200 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl text-left group transition cursor-pointer"
              >
                <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] rounded uppercase mb-2">Alerta Moderada</span>
                <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  Inyectar ~2200 ppm
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Por encima del umbral. Activa indicador de alerta.</p>
              </button>

              <button
                onClick={() => handleTriggerTest('critica')}
                className="p-3 border border-red-100 hover:border-red-200 bg-red-50/20 hover:bg-red-50/50 rounded-xl text-left group transition cursor-pointer"
              >
                <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-800 font-bold text-[9px] rounded uppercase mb-2">Peligro Crítico</span>
                <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  Inyectar ~3850 ppm
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Nivel crítico. Activa alarmas y parpadeos intensos.</p>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-500">¿Quieres detener las lecturas continuas del simulador?</span>
              </div>
              <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                Generando lecturas automáticas cada 3s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
