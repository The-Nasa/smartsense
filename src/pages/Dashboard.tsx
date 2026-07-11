import { useState, useEffect } from 'react';
import { Flame, ShieldCheck, ShieldAlert, AlertTriangle, Clock, TrendingUp, AlertOctagon, RefreshCw, Sparkles } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { api, mockDb } from '../lib/supabase';
import { GasEvento } from '../types';

interface DashboardProps {
  lastEvent: GasEvento | null;
  umbral: number;
  onOpenConfigModal: () => void;
}

export default function Dashboard({ lastEvent, umbral, onOpenConfigModal }: DashboardProps) {
  const [history, setHistory] = useState<GasEvento[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial events for the graph
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const events = await api.getGasEventos();
      // Slice to get last 50, but sort ascending for the chart
      const chartEvents = [...events].slice(0, 50).reverse();
      setHistory(chartEvents);
    } catch (err) {
      console.error('Error loading dashboard chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // When a new event arrives in real-time, append it to the chart history
  useEffect(() => {
    if (lastEvent) {
      setHistory((prev) => {
        const updated = [...prev, lastEvent];
        if (updated.length > 50) {
          updated.shift(); // Keep only last 50
        }
        return updated;
      });
    }
  }, [lastEvent]);

  // Calculations for cards
  const latestReading = lastEvent || (history.length > 0 ? history[history.length - 1] : null);
  const currentVal = latestReading ? latestReading.valor_gas : 0;
  const isAlertActive = currentVal > umbral;

  // Total de alertas del día
  const todayAlertsCount = () => {
    const todayStr = new Date().toDateString();
    // Search in whole local history
    const allTodayEvents = mockDb.getEventsRaw().filter((e) => {
      const eDate = new Date(e.created_at).toDateString();
      return eDate === todayStr && e.valor_gas > umbral;
    });
    return allTodayEvents.length;
  };

  // Último evento registrado (hace X minutos)
  const getMinutesSinceLastEvent = () => {
    if (!latestReading) return 'Sin datos';
    const diffMs = currentTime.getTime() - new Date(latestReading.created_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Hace menos de un minuto';
    if (diffMins === 1) return 'Hace 1 minuto';
    return `Hace ${diffMins} minutos`;
  };

  // Time elapsed for the active alert panel
  const getActiveAlertDuration = () => {
    if (!latestReading || !isAlertActive) return '';
    const diffSecs = Math.floor((currentTime.getTime() - new Date(latestReading.created_at).getTime()) / 1000);
    if (diffSecs < 60) return `${diffSecs} segundos`;
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Formatter for chart tooltip time
  const formatChartTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      
      {/* Top Bar Navigation/Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Flame className="w-6 h-6 animate-pulse text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 font-display">SmartSense</h1>
            <p className="text-xs text-slate-500">Monitoreo de Gas en Tiempo Real</p>
          </div>
        </div>

        {/* State Badge & Current Clock */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Badge de estado */}
          {isAlertActive ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider animate-pulse shadow-sm shadow-red-100">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Fuga detectada
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm shadow-emerald-50">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ambiente seguro
            </div>
          )}

          {/* Clock */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
            <span className="text-slate-300">|</span>
            <span>{currentTime.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Lectura actual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lectura Actual</span>
            <span className={`p-1.5 rounded-lg text-xs font-bold ${isAlertActive ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
              ppm
            </span>
          </div>
          <div className="mt-2">
            <p className={`text-4xl font-extrabold font-display leading-none tracking-tight ${isAlertActive ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
              {currentVal}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5">Rango del sensor: 0 - 4095</p>
          </div>
        </div>

        {/* Metric 2: Estado digital del MQ2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado MQ2</span>
            <span className="text-[10px] text-slate-400 font-mono">Digital</span>
          </div>
          <div className="mt-2">
            <p className={`text-3xl font-black font-display uppercase tracking-tight ${isAlertActive ? 'text-red-600' : 'text-emerald-600'}`}>
              {isAlertActive ? 'ALERTA' : 'normal'}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">Umbral configurado: <b className="text-slate-700">{umbral} ppm</b></p>
          </div>
        </div>

        {/* Metric 3: Total de alertas del día */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas Hoy</span>
            <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-4xl font-extrabold font-display text-slate-800 leading-none">
              {todayAlertsCount()}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5">Superaciones de umbral registradas</p>
          </div>
        </div>

        {/* Metric 4: Último evento registrado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Último Registro</span>
            <RefreshCw onClick={fetchHistory} className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-transform hover:rotate-180" />
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800 leading-tight">
              {getMinutesSinceLastEvent()}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5">Actualización automática cada 3s</p>
          </div>
        </div>

      </div>

      {/* Active Alert Warning Panel */}
      {isAlertActive && latestReading && (
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-xs">
          <div className="flex gap-3.5">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-md">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-red-950 text-base font-display">Advertencia: ¡Concentración de Gas Crítica!</h3>
              <p className="text-xs text-red-800 mt-0.5">
                Se ha superado el umbral seguro de gas. Nivel detectado: <b className="font-mono text-sm">{latestReading.valor_gas} ppm</b>.
              </p>
              <div className="flex gap-4 text-[11px] text-red-600 mt-2 font-medium">
                <span><b>Hora exacta:</b> {new Date(latestReading.created_at).toLocaleTimeString()}</span>
                <span>•</span>
                <span><b>Tiempo transcurrido:</b> {getActiveAlertDuration()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenConfigModal}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl shadow-xs transition"
          >
            Verificar Conexión
          </button>
        </div>
      )}

      {/* Recharts Gas Line Chart Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Gráfico de Concentración de Gas</h2>
              <p className="text-xs text-slate-400">Últimas 50 lecturas analizadas en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-xs text-slate-500 font-medium mr-4">Lectura (ppm)</span>
            <span className="w-3.5 border-t border-dashed border-red-500" />
            <span className="text-xs text-red-600 font-bold">Umbral ({umbral} ppm)</span>
          </div>
        </div>

        {/* Line Chart */}
        <div className="w-full h-[320px] pt-4">
          {loading && history.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              <span className="animate-spin border-2 border-slate-300 border-t-indigo-600 rounded-full w-5 h-5 mr-2" />
              Cargando historial de mediciones...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  tickFormatter={formatChartTime}
                  stroke="#94a3b8"
                  fontSize={9}
                  dy={8}
                />
                <YAxis
                  domain={[0, 4095]}
                  stroke="#94a3b8"
                  fontSize={10}
                  dx={-4}
                />
                <Tooltip
                  labelFormatter={(label) => `Hora: ${new Date(label).toLocaleTimeString()} - ${new Date(label).toLocaleDateString()}`}
                  formatter={(value: any) => [`${value} ppm`, 'Lectura Gas']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                />
                <ReferenceLine
                  y={umbral}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{ value: `Umbral (${umbral})`, fill: '#ef4444', fontSize: 9, position: 'top' }}
                />
                <Line
                  type="monotone"
                  dataKey="valor_gas"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.valor_gas > umbral) {
                      return (
                        <circle key={payload.id} cx={cx} cy={cy} r={4.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1} />
                      );
                    }
                    return null;
                  }}
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Simulator Guidance Quick Tip Banner */}
      {api.isMock() && (
        <div className="bg-indigo-50/40 border border-indigo-100/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
            <p className="text-xs">
              <b>Modo demostrativo activo:</b> El simulador genera lecturas automáticas. Puedes calibrar o forzar alertas instantáneas desde el panel de pruebas.
            </p>
          </div>
          <button
            onClick={onOpenConfigModal}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-2xs transition"
          >
            Abrir Panel de Control
          </button>
        </div>
      )}

    </div>
  );
}
