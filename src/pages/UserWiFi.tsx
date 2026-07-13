import React, { useState, useEffect } from 'react';
import { User, Wifi, Bell, Edit2, Check, X, Eye, EyeOff, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../lib/supabase';
import { Usuario } from '../types';

interface UserWiFiProps {
  onUpdateUser: (updatedUser: Usuario) => void;
}

export default function UserWiFi({ onUpdateUser }: UserWiFiProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Form states
  const [editProfile, setEditProfile] = useState<boolean>(false);
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');

  const [editWifi, setEditWifi] = useState<boolean>(false);
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const u = await api.getUsuario();
        setUser(u);

        // Initialize form fields
        setNombre(u.nombre);
        setEmail(u.email);
        setTelefono(u.telefono);
        setWifiSsid(u.wifi_ssid);
        setWifiPassword(u.wifi_password || '');
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingField('profile');
      const updated = await api.updateUsuario(1, {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
      });
      setUser(updated);
      onUpdateUser(updated);
      setEditProfile(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingField(null);
    }
  };

  const handleUpdateWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingField('wifi');
      const updated = await api.updateUsuario(1, {
        wifi_ssid: wifiSsid.trim(),
        wifi_password: wifiPassword,
      });
      setUser(updated);
      onUpdateUser(updated);
      setEditWifi(false);
    } catch (err) {
      console.error('Error saving wifi credentials:', err);
    } finally {
      setSavingField(null);
    }
  };

  const handleToggleNotification = async (field: 'notif_email' | 'notif_sms', val: boolean) => {
    if (!user) return;

    // Optimistic update
    const nextUser = { ...user, [field]: val };
    setUser(nextUser);
    onUpdateUser(nextUser);

    try {
      await api.updateUsuario(1, { [field]: val });
    } catch (err) {
      console.error(`Error toggling ${field} status:`, err);
      // Revert if error
      setUser(user);
      onUpdateUser(user);
    }
  };

  if (loading || !user) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
        <span className="animate-spin border-2 border-slate-300 border-t-indigo-600 rounded-full w-5 h-5 mb-2" />
        Sincronizando perfil del usuario...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">

      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-800 font-display">Usuario & Configuración IoT</h1>
        <p className="text-xs text-slate-500">Gestiona tus datos de contacto, credenciales WiFi para el microcontrolador y canales de notificación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Card 1: Datos Personales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Datos Personales</h2>
            </div>

            {!editProfile && (
              <button
                onClick={() => setEditProfile(true)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Perfil
              </button>
            )}
          </div>

          {editProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email de Alerta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono Móvil (SMS)</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNombre(user.nombre);
                    setEmail(user.email);
                    setTelefono(user.telefono);
                    setEditProfile(false);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingField === 'profile'}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Nombre</span>
                  <span className="text-xs font-semibold text-slate-800">{user.nombre}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Email</span>
                  <span className="text-xs font-semibold text-slate-800">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Teléfono SMS</span>
                  <span className="text-xs font-semibold text-slate-800">{user.telefono}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Configuración WiFi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Wifi className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Parámetros WiFi IoT</h2>
            </div>

            {!editWifi && (
              <button
                onClick={() => setEditWifi(true)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Red
              </button>
            )}
          </div>

          {editWifi ? (
            <form onSubmit={handleUpdateWifi} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SSID de la Red</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Ej: MiRedCasa_2.4G"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña WPA2</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Contraseña oculta"
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWifiSsid(user.wifi_ssid);
                    setWifiPassword(user.wifi_password || '');
                    setEditWifi(false);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingField === 'wifi'}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar Red
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">SSID actual</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">{user.wifi_ssid}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Clave de Red</span>
                <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-xl px-3 py-2 mt-1">
                  <span className="text-xs font-mono font-medium text-slate-700">
                    {showPassword ? user.wifi_password : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 text-amber-900 text-[10px] font-semibold p-3 border border-amber-100 rounded-xl flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Nota importante: El ESP32 leerá estos datos al reiniciarse.</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Card 3: Canales de Notificaciones */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5 max-w-2xl">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Canales de Alerta & Notificaciones</h2>
            <p className="text-[10px] text-slate-400">Activa o desactiva las alarmas directas de telemetría</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-slate-50">

          {/* Email notifications toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-semibold text-slate-800 block">Notificar por Correo Electrónico</span>
              <p className="text-[11px] text-slate-400">
                Recibe un correo electrónico con información detallada de la concentración de gas al superar el umbral.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Enviar a: <b className="text-slate-700">{user.email}</b>
              </div>
            </div>

            <button
              onClick={() => handleToggleNotification('notif_email', !user.notif_email)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden shrink-0 ${user.notif_email ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.notif_email ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* SMS notifications toggle */}
          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-semibold text-slate-800 block">Notificar por Mensajes SMS</span>
              <p className="text-[11px] text-slate-400">
                Recibe alertas de seguridad inmediatas en tu teléfono móvil ante emergencias críticas.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Enviar a: <b className="text-slate-700">{user.telefono}</b>
              </div>
            </div>

            <button
              onClick={() => handleToggleNotification('notif_sms', !user.notif_sms)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden shrink-0 ${user.notif_sms ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.notif_sms ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

        </div>

        {/* Integration notice */}
        <div className="bg-indigo-50/50 border border-indigo-100/30 p-4.5 rounded-xl text-[11px] text-indigo-950 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            Las notificaciones automatizadas se despachan a través de Edge Functions programadas en Supabase Triggers, garantizando un tiempo de entrega de menos de 1.5 segundos ante emergencias.
          </span>
        </div>
      </div>

    </div>
  );
}
