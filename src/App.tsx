import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AlertToast from './components/AlertToast';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Config from './pages/Config';
import UserWiFi from './pages/UserWiFi';
import ManageUsers from './pages/ManageUsers';
import LoginLock from './components/LoginLock';
import { api } from './lib/supabase';
import { GasEvento, Usuario } from './types';

export default function App() {
  const [lastEvent, setLastEvent] = useState<GasEvento | null>(null);
  const [activeAlertEvent, setActiveAlertEvent] = useState<GasEvento | null>(null);
  const [umbral, setUmbral] = useState<number>(1500);
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('smartsense_session_active') === 'true'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    localStorage.getItem('smartsense_sound_enabled') !== 'false'
  );

  // Refs for alarm audio and push notification cooldown
  const alarmPlayingRef = useRef<boolean>(false);
  const lastPushTimestampRef = useRef<number>(0);
  const PUSH_COOLDOWN_MS = 30000; // 30 seconds between push notifications

  const handleLogout = () => {
    localStorage.removeItem('smartsense_session_active');
    localStorage.removeItem('smartsense_active_user_id');
    setIsAuthenticated(false);
    setUser(null);
  };

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('smartsense_sound_enabled', String(next));
      return next;
    });
  }, []);

  // --- AUDIBLE ALARM (Web Audio API — no external file needed) ---
  const playAlarmBeep = useCallback(() => {
    if (alarmPlayingRef.current) return; // Don't overlap beeps
    alarmPlayingRef.current = true;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Play 3 rapid descending beeps
      const beepDuration = 0.15;
      const frequencies = [880, 660, 880]; // Hz: high-low-high pattern

      frequencies.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'square';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + i * (beepDuration + 0.05));
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * (beepDuration + 0.05) + beepDuration);

        oscillator.start(audioCtx.currentTime + i * (beepDuration + 0.05));
        oscillator.stop(audioCtx.currentTime + i * (beepDuration + 0.05) + beepDuration);
      });

      // Release lock after all beeps finish
      setTimeout(() => {
        alarmPlayingRef.current = false;
        audioCtx.close();
      }, (frequencies.length * (beepDuration + 0.05) + 0.1) * 1000);
    } catch (err) {
      console.warn('Web Audio API not available for alarm:', err);
      alarmPlayingRef.current = false;
    }
  }, []);

  // --- BROWSER PUSH NOTIFICATIONS ---
  useEffect(() => {
    // Request permission on first authenticated load
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  const sendPushNotification = useCallback((event: GasEvento) => {
    const now = Date.now();
    if (now - lastPushTimestampRef.current < PUSH_COOLDOWN_MS) return; // Cooldown active

    if ('Notification' in window && Notification.permission === 'granted') {
      lastPushTimestampRef.current = now;
      try {
        new Notification('⚠️ SmartSense — Fuga de Gas Detectada', {
          body: `Nivel crítico: ${event.valor_gas} ppm. Toma precauciones de inmediato.`,
          icon: '/favicon.ico',
          tag: 'smartsense-alert', // Replaces previous notification instead of stacking
          requireInteraction: true,
        });
      } catch (err) {
        console.warn('Push notification failed:', err);
      }
    }
  }, []);

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

      // If the incoming measurement crosses our active threshold
      if (event.valor_gas > umbral) {
        setActiveAlertEvent(event);

        // Play audible alarm beep if sound is enabled
        if (soundEnabled) {
          playAlarmBeep();
        }

        // Send browser push notification (with cooldown)
        sendPushNotification(event);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loading, umbral, soundEnabled, playAlarmBeep, sendPushNotification]);

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

  if (!isAuthenticated) {
    return <LoginLock onUnlock={(loggedInUser) => {
      setUser(loggedInUser);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50/50 text-slate-800 flex">

        {/* Persistent Side Navigation (Desktop) & Bottom Navigation (Mobile) */}
        <Sidebar onLogout={handleLogout} soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        {/* Global Toast Alert */}
        <AlertToast
          event={activeAlertEvent}
          onClose={() => setActiveAlertEvent(null)}
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

              {/* Route 5: Manage alert recipients */}
              <Route
                path="/destinatarios"
                element={<ManageUsers />}
              />

            </Routes>
          </div>
        </main>

      </div>
    </BrowserRouter>
  );
}
