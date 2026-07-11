import { useState, useEffect } from 'react';
import { Calendar, Filter, FileSpreadsheet, ShieldAlert, ShieldCheck, ChevronLeft, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../lib/supabase';
import { GasEvento } from '../types';

interface HistoryProps {
  umbral: number;
}

export default function History({ umbral }: HistoryProps) {
  // Filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [onlyAlerts, setOnlyAlerts] = useState<boolean>(false);

  // Data
  const [events, setEvents] = useState<GasEvento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Load history whenever filters change
  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const res = await api.getGasEventos({
        onlyAlerts,
        dateFrom: dateFrom ? dateFrom : undefined,
        dateTo: dateTo ? dateTo : undefined,
      });
      setEvents(res);
      setCurrentPage(1); // Reset to page 1 on search
    } catch (err) {
      console.error('Error fetching filtered history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [dateFrom, dateTo, onlyAlerts, umbral]);

  // Statistics calculation for the current filtered period
  const totalLecturas = events.length;
  const totalAlertas = events.filter(e => e.valor_gas > umbral).length;
  const totalNormales = totalLecturas - totalAlertas;
  
  const promedioGas = totalLecturas > 0
    ? Math.round(events.reduce((sum, e) => sum + e.valor_gas, 0) / totalLecturas)
    : 0;

  const maxGas = totalLecturas > 0
    ? Math.max(...events.map(e => e.valor_gas))
    : 0;

  const minGas = totalLecturas > 0
    ? Math.min(...events.map(e => e.valor_gas))
    : 0;

  const alertPercentage = totalLecturas > 0 ? Math.round((totalAlertas / totalLecturas) * 100) : 0;
  const normalPercentage = totalLecturas > 0 ? 100 - alertPercentage : 0;

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(totalLecturas / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = events.slice(startIndex, startIndex + itemsPerPage);

  // Export to CSV function
  const handleExportCSV = () => {
    if (events.length === 0) return;

    // Headers
    const headers = ['ID Evento', 'Fecha y Hora', 'Valor Gas (ppm)', 'Estado (Alerta)'];
    
    // Rows
    const rows = events.map(e => [
      e.id,
      new Date(e.created_at).toLocaleString(),
      e.valor_gas,
      e.valor_gas > umbral ? 'ALERTA' : 'Normal'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Create file blob & download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartSense_Historial_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-800 font-display">Historial de Eventos</h1>
        <p className="text-xs text-slate-500">Consulta y descarga el registro completo de mediciones registradas por el sensor</p>
      </div>

      {/* Period Statistics Summary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Stat Card 1: Promedio, Max & Min */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-3">
            <BarChart3 className="w-4 h-4" />
            Metas del Periodo
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Promedio</span>
              <span className="text-sm font-extrabold text-slate-700 font-mono">{promedioGas}</span>
            </div>
            <div className="p-2 bg-red-50 text-red-700 rounded-xl">
              <span className="text-[10px] text-red-500 font-semibold block mb-0.5">Máximo</span>
              <span className="text-sm font-extrabold text-red-700 font-mono">{maxGas}</span>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <span className="text-[10px] text-emerald-500 font-semibold block mb-0.5">Mínimo</span>
              <span className="text-sm font-extrabold text-slate-700 font-mono">{minGas}</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2: Alertas vs Lecturas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4" />
            Alertas vs Lecturas
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <p className="text-3xl font-extrabold text-slate-800 font-display leading-none">
                {totalAlertas} <span className="text-xs font-medium text-slate-400">alertas</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">De un total de {totalLecturas} lecturas</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-md">
              Ratio: {totalLecturas > 0 ? ((totalAlertas / totalLecturas) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Stat Card 3: Alert Ratio Percentage Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            Distribución de Mediciones
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span className="text-emerald-600">Normales ({normalPercentage}%)</span>
              <span className="text-red-600">Alertas ({alertPercentage}%)</span>
            </div>
            
            {/* Visual ratio bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {totalLecturas > 0 ? (
                <>
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${normalPercentage}%` }} />
                  <div className="bg-red-500 h-full transition-all" style={{ width: `${alertPercentage}%` }} />
                </>
              ) : (
                <div className="bg-slate-200 h-full w-full" />
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Filters & Export Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        
        {/* Row 1: Filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
            
            {/* Date From */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 placeholder:text-slate-400 focus:outline-indigo-600 transition"
                title="Desde la fecha"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 placeholder:text-slate-400 focus:outline-indigo-600 transition"
                title="Hasta la fecha"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <button
              onClick={() => setOnlyAlerts(!onlyAlerts)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                onlyAlerts
                  ? 'bg-red-50 border-red-200 text-red-600 shadow-inner'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {onlyAlerts ? 'Solo Alertas' : 'Todos los Registros'}
            </button>

          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">ID Registro</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Valor Gas (ppm)</th>
                <th className="px-6 py-4 text-center">Estado del Ambiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    <span className="animate-spin border-2 border-slate-300 border-t-indigo-600 rounded-full w-4 h-4 inline-block mr-2 align-middle" />
                    Buscando registros en la base de datos...
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No se encontraron mediciones para el rango seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((e) => {
                  const isAlert = e.valor_gas > umbral;
                  return (
                    <tr
                      key={e.id}
                      className={`transition-colors hover:bg-slate-50/50 ${
                        isAlert ? 'bg-red-50/40 hover:bg-red-50/60' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-[10px] select-all">
                        {e.id}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-medium">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-800 text-sm">
                        {e.valor_gas} ppm
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {isAlert ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-black uppercase text-[10px] rounded-lg">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                            Alerta de Fuga
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black uppercase text-[10px] rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Limpio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <b className="text-slate-800 font-bold">{startIndex + 1}</b> a{' '}
              <b className="text-slate-800 font-bold">
                {Math.min(startIndex + itemsPerPage, totalLecturas)}
              </b>{' '}
              de <b className="text-slate-800 font-bold">{totalLecturas}</b> registros
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-600 px-3">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
