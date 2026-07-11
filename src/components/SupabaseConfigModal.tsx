import React, { useState } from 'react';
import { X, Database, Copy, Check, ShieldAlert, Sparkles, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseCredentials, clearSupabaseCredentials, triggerManualLeak } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [isMock, setIsMock] = useState(currentConfig.isMock);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql' | 'test'>('credentials');

  if (!isOpen) return null;

  const sqlCode = `-- 1. Tabla de configuración (Umbral del Sensor)
create table configuracion (
  id bigint primary key default 1,
  umbral_gas integer not null default 1500,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar configuración inicial
insert into configuracion (id, umbral_gas) 
values (1, 1500) 
on conflict (id) do nothing;

-- 2. Tabla de usuarios (Datos del usuario y WiFi)
create table usuarios (
  id bigint primary key default 1,
  nombre text not null,
  email text not null,
  telefono text not null,
  wifi_ssid text not null,
  wifi_password text,
  notif_email boolean not null default true,
  notif_sms boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar usuario inicial
insert into usuarios (id, nombre, email, telefono, wifi_ssid, wifi_password, notif_email, notif_sms)
values (1, 'Carlos Mendoza', 'carlos.mendoza@smartsense.io', '+34 612 345 678', 'SmartSense_IoT_2G', 'securepass123', true, false)
on conflict (id) do nothing;

-- 3. Tabla de registros de eventos de gas
create table gas_eventos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  valor_gas integer not null,
  alerta boolean not null
);

-- Habilitar Supabase Realtime para la tabla gas_eventos
alter publication supabase_realtime add table gas_eventos;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(url.trim(), key.trim(), isMock);
    onClose();
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    onClose();
  };

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
              <h2 className="text-lg font-bold text-slate-800 font-display">Conexión con Supabase</h2>
              <p className="text-xs text-slate-500">Conecta tu base de datos o simula las lecturas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Credenciales
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Esquema SQL
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulador de Pruebas
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'credentials' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex gap-3">
                <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-semibold">¿Cómo funciona la integración?</p>
                  <p>Por defecto, SmartSense inicia en <b>Modo Simulador</b> generando lecturas automáticas cada 3 segundos. Para conectarlo a tu proyecto real de Supabase, copia el código de la pestaña <b>Esquema SQL</b> en tu consola de Supabase, completa los datos a continuación y desmarca el modo simulador.</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">Modo Simulador de Lecturas</label>
                  <p className="text-xs text-slate-500">Genera datos locales de gas si no tienes Supabase activo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMock(!isMock)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                    isMock ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isMock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!isMock && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      SUPABASE_URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      required={!isMock}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      SUPABASE_ANON_KEY
                    </label>
                    <input
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required={!isMock}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                {(currentConfig.url || currentConfig.key) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-lg text-sm transition"
                  >
                    Restablecer
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-xs transition"
                >
                  Aplicar Configuración
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tablas Requeridas en Supabase</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-md transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>
              
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto max-h-[350px] border border-slate-800">
                  {sqlCode}
                </pre>
              </div>
              <p className="text-xs text-slate-500 italic">
                * Nota: Ejecuta este bloque en el menú "SQL Editor" de tu panel de Supabase. El comando final habilita la comunicación por Realtime (WebSockets) indispensable para el dashboard en vivo.
              </p>
            </div>
          )}

          {activeTab === 'test' && (
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
                  className="p-3 border border-emerald-100 hover:border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl text-left group transition"
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
                  className="p-3 border border-amber-100 hover:border-amber-200 bg-amber-50/20 hover:bg-amber-50/50 rounded-xl text-left group transition"
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
                  className="p-3 border border-red-100 hover:border-red-200 bg-red-50/20 hover:bg-red-50/50 rounded-xl text-left group transition"
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
          )}
        </div>
      </div>
    </div>
  );
}
