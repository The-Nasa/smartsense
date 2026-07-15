import React, { useState, useEffect } from 'react';
import { User, Wifi, Edit2, Check, X, Eye, EyeOff, Mail, Phone, Sparkles, KeyRound, AlertCircle } from 'lucide-react';
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

  // Password change form states
  const [editPassword, setEditPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPwd, setShowCurrentPwd] = useState<boolean>(false);
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

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


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual.');
      return;
    }
    if (currentPassword !== (user.password || '')) {
      setPasswordError('La contraseña actual es incorrecta.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    try {
      setSavingField('password');
      const updated = await api.updateUsuario(user.id, { password: newPassword });
      setUser(updated);
      onUpdateUser(updated);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setEditPassword(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err) {
      setPasswordError('Error al guardar la contraseña. Intenta de nuevo.');
    } finally {
      setSavingField(null);
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

        {/* Columna Izquierda: Configuración de la Cuenta */}
        <div className="space-y-6">
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

          {/* Card 4: Cambio de Contraseña de Acceso */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Contraseña de Acceso Web</h2>
                  <p className="text-[10px] text-slate-400">Cambia la contraseña con la que ingresas al panel</p>
                </div>
              </div>

              {!editPassword && (
                <button
                  onClick={() => { setEditPassword(true); setPasswordError(null); setPasswordSuccess(false); }}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Cambiar
                </button>
              )}
            </div>

            {editPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">

                {/* Current password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                      placeholder="Tu contraseña actual"
                      className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition font-mono"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                    placeholder="Repite la nueva contraseña"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-600 transition font-mono"
                    required
                  />
                </div>

                {/* Error/Success feedback */}
                {passwordError && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>¡Contraseña actualizada con éxito!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError(null);
                    }}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingField === 'password' || passwordSuccess}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-60"
                  >
                    {savingField === 'password' ? (
                      <><span className="w-3 h-3 border-2 border-indigo-300/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                    ) : (
                      <><Check className="w-3.5 h-3.5" /> Guardar Contraseña</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Contraseña de acceso</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">{'•'.repeat(Math.max(8, user.password?.length || 8))}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Configuración del Dispositivo */}
        <div className="space-y-6">
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
      </div>
    </div>
  );
}
