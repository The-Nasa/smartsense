import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AlertToast from './components/AlertToast';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Config from './pages/Config';
import UserWiFi from './pages/UserWiFi';
import { api, getSupabaseConfig } from './lib/supabase';
import { GasEvento, Usuario } from './types';

export default function App() {
  const [lastEvent, setLastEvent] = useState<GasEvento | null>(null);
  const [activeAlertEvent, setActiveAlertEvent] = useState<GasEvento | null>(null);
  const [umbral, setUmbral] = useState<number>(1500);
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Load configuration and user on mount
  useEffect(() => {
    const bootstrapApp = async () => {
      try {
        setLoading(true);
        const threshold = await api.getUmbral();
        setUmbral(threshold);

        const userData = await api.getUsuario();
        setUser(userData);
      } catch (err) {
        console.error('Error bootstrapping SmartSense configuration:', err);
      } finally {
        setLoading(false);
      }
    };

    bootstrapApp();
  }, []);

  // Listen to gas events in real-time
  useEffect(() => {
    if (loading) return;

    // Subscribe to unified real-time event stream (Supabase vs Simulator fallback)
    const unsubscribe = api.subscribeToEvents((event) => {
      setLastEvent(event);
      
      // If the incoming measurement crosses our active threshold, display the global toast alert
      if (event.valor_gas > umbral) {
        setActiveAlertEvent(event);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loading, umbral]);

  const handleUpdateUmbral = (newVal: number) => {
    setUmbral(newVal);
  };

  const handleUpdateUser = (updatedUser: Usuario) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-screen w-screen h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-display font-black text-indigo-600 text-[10px] uppercase">
            MQ2
          </div>
        </div>
        <h2 className="text-base font-extrabold text-slate-800 tracking-tight font-display">Iniciando SmartSense...</h2>
        <p className="text-xs text-slate-400 mt-1">Conectando canales de telemetría IoT</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50/50 text-slate-800 flex">
        
        {/* Persistent Side Navigation (Desktop) & Bottom Navigation (Mobile) */}
        <Sidebar onOpenConfigModal={() => setIsConfigModalOpen(true)} />

        {/* Global Toast Alert */}
        <AlertToast
          event={activeAlertEvent}
          onClose={() => setActiveAlertEvent(null)}
        />

        {/* Supabase Connection Setup & Info Wizard */}
        <SupabaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />

        {/* Main Workspace Frame */}
        <main className="flex-1 md:pl-64 min-h-screen flex flex-col">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
            <Routes>
              
              {/* Route 1: Main Monitoring Dashboard */}
              <Route
                path="/"
                element={
                  <Dashboard
                    lastEvent={lastEvent}
                    umbral={umbral}
                    onOpenConfigModal={() => setIsConfigModalOpen(true)}
                  />
                }
              />

              {/* Route 2: Historical log records table */}
              <Route
                path="/historial"
                element={<History umbral={umbral} />}
              />

              {/* Route 3: Threshold calibration slider */}
              <Route
                path="/config"
                element={
                  <Config
                    umbral={umbral}
                    onUpdateUmbral={handleUpdateUmbral}
                  />
                }
              />

              {/* Route 4: Contact profile and wifi credentials */}
              <Route
                path="/usuario"
                element={<UserWiFi onUpdateUser={handleUpdateUser} />}
              />

            </Routes>
          </div>
        </main>

      </div>
    </BrowserRouter>
  );
}
