import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../lib/supabase';

interface ConfigProps {
  umbral: number;
  onUpdateUmbral: (newVal: number) => void;
}

export default function Config({ umbral, onUpdateUmbral }: ConfigProps) {
  const [inputValue, setInputValue] = useState<number>(umbral);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync state with parent prop if it changes externally
  useEffect(() => {
    setInputValue(umbral);
  }, [umbral]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      val = 0;
    }
    // Limit range strictly
    setInputValue(Math.max(0, Math.min(4095, val)));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(parseInt(e.target.value, 10));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      
      const success = await api.updateUmbral(inputValue);
      if (success) {
        onUpdateUmbral(inputValue);
        setSavedSuccess(true);
        // Hide success banner after 3 seconds
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating threshold:', err);
    } finally {
      setSaving(false);
    }
  };

  // Helper to determine active range for visual highlight
  const getRangeClass = (min: number, max: number) => {
    if (inputValue >= min && inputValue <= max) {
      return 'bg-indigo-50/50 border-2 border-indigo-200/80 shadow-xs';
    }
    return 'opacity-65 hover:opacity-100';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-800 font-display">Configuración de Seguridad</h1>
        <p className="text-xs text-slate-500">Calibra el umbral de activación del sensor MQ2 para disparar alertas en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Card 1: Umbral Tuning Slider & Input (7 Cols) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 lg:col-span-7">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Calibración de Alerta</h2>
              <p className="text-xs text-slate-400">Establece el límite superior de ppm permitidos antes del estado de peligro</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Bidirectional Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Límite del Umbral</span>
                
                {/* Numeric Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    min={0}
                    max={4095}
                    className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm font-mono font-bold text-center bg-slate-50 text-slate-800 focus:outline-indigo-600 focus:border-indigo-600 transition"
                  />
                  <span className="text-xs font-bold text-slate-400 font-mono">ppm</span>
                </div>
              </div>

              {/* Range Slider */}
              <div className="relative pt-2">
                <input
                  type="range"
                  min={0}
                  max={4095}
                  value={inputValue}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
                />
                
                {/* Visual limits */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-2">
                  <span>0 (Limpio)</span>
                  <span>1500 (Tolerable)</span>
                  <span>3000 (Alerta)</span>
                  <span>4095 (Peligro)</span>
                </div>
              </div>
            </div>

            {/* Confirmation Banner */}
            {savedSuccess && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100/80 p-3.5 rounded-xl text-emerald-800 text-xs font-semibold animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>¡Umbral actualizado! El sensor MQ2 comparará las lecturas con el valor de <b>{umbral} ppm</b>.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-[10px] text-slate-400 font-medium">Los cambios se aplican inmediatamente</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

          </form>
        </div>

        {/* Card 2: Reference Ranges Information (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Guía de Concentración de Gas</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El sensor MQ2 de gas licuado de petróleo (LPG), propano, metano y humo reporta una señal analógica mapeada de 0 a 4095. Usa esta tabla para calibrar tus parámetros de seguridad:
            </p>

            <div className="space-y-2">
              
              {/* Range 1: Clean Air */}
              <div className={`p-3 rounded-xl border border-slate-100 flex justify-between items-center transition-all ${getRangeClass(0, 500)}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-extrabold text-slate-800">Aire limpio</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Atmósfera libre de gases tóxicos o humo</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">0 – 500</span>
              </div>

              {/* Range 2: Slight Presence */}
              <div className={`p-3 rounded-xl border border-slate-100 flex justify-between items-center transition-all ${getRangeClass(501, 1500)}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-extrabold text-slate-800">Presencia leve</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Humo ambiental o gases mínimos detectados</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">500 – 1500</span>
              </div>

              {/* Range 3: Moderate Alert */}
              <div className={`p-3 rounded-xl border border-slate-100 flex justify-between items-center transition-all ${getRangeClass(1501, 3000)}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-extrabold text-slate-800">Alerta moderada</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Posible fuga o presencia persistente de monóxido</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">1500 – 3000</span>
              </div>

              {/* Range 4: Critical Hazard */}
              <div className={`p-3 rounded-xl border border-slate-100 flex justify-between items-center transition-all ${getRangeClass(3001, 4095)}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span className="text-xs font-extrabold text-slate-800">Peligro crítico</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Fuga severa confirmada. Ventila de inmediato</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">3000 – 4095</span>
              </div>

            </div>
          </div>

          {/* Quick tip on ESP32 syncing */}
          <div className="bg-amber-50 border border-amber-100/80 p-4.5 rounded-2xl flex gap-3.5 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Nota de Sincronización IoT</h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                El módulo de control ESP32 lee este umbral continuamente desde tu tabla de configuración en Supabase. Al guardar este valor, el dispositivo IoT actualizará su regla interna de alarma acústica inmediatamente sin requerir reinicios manuales.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
