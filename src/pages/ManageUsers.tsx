import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, Phone, ShieldCheck, Plus, X, AlertTriangle, Sparkles, Eye, EyeOff, KeyRound, Edit2 } from 'lucide-react';
import { api } from '../lib/supabase';
import { Usuario } from '../types';

export default function ManageUsers() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  
  // Form states
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [notifEmail, setNotifEmail] = useState<boolean>(true);
  const [notifSms, setNotifSms] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setNombre('');
    setEmail('');
    setTelefono('');
    setPassword('');
    setShowFormPassword(false);
    setNotifEmail(true);
    setNotifSms(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: Usuario) => {
    setEditingUser(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setTelefono(u.telefono);
    setPassword(u.password || '');
    setShowFormPassword(false);
    setNotifEmail(u.notif_email);
    setNotifSms(u.notif_sms);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsuarios();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim() || !email.trim() || !telefono.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      if (editingUser) {
        // Edit existing user
        const updated = await api.updateUsuario(editingUser.id, {
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          password: password || undefined,
          notif_email: notifEmail,
          notif_sms: notifSms
        });
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? updated : u));
      } else {
        // Add new user
        const newUser = await api.addUsuario({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          wifi_ssid: '',
          wifi_password: '',
          notif_email: notifEmail,
          notif_sms: notifSms,
          password: password || undefined
        });
        setUsers((prev) => [...prev, newUser]);
      }

      setIsModalOpen(false);
      setEditingUser(null);
      
      // Reset form
      setNombre('');
      setEmail('');
      setTelefono('');
      setPassword('');
      setShowFormPassword(false);
      setNotifEmail(true);
      setNotifSms(false);
    } catch (err: any) {
      console.error('Error saving user:', err);
      setErrorMsg(err.message || 'Error al intentar guardar los datos del destinatario.');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(userToDelete.id);
      const success = await api.deleteUsuario(userToDelete.id);
      if (success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      }
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleNotification = async (id: number, field: 'notif_email' | 'notif_sms', val: boolean) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: val } : u))
    );

    try {
      await api.updateUsuario(id, { [field]: val });
    } catch (err) {
      console.error(`Error toggling notification status for user ${id}:`, err);
      // Revert in case of failure
      loadUsers();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 font-display">Destinatarios de Alertas</h1>
          <p className="text-xs text-slate-500">Administra las personas que recibirán correos y SMS en tiempo real cuando ocurra un incidente</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Destinatario
        </button>
      </div>

      {loading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 text-sm bg-white border border-slate-100 rounded-2xl shadow-xs">
          <span className="animate-spin border-2 border-slate-300 border-t-indigo-600 rounded-full w-6 h-6 mb-2" />
          Sincronizando lista de destinatarios...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div
              key={u.id}
              className={`bg-white border p-6 rounded-2xl shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-200/80 ${
                u.id === 1 ? 'border-indigo-100 ring-2 ring-indigo-50/50' : 'border-slate-100'
              }`}
            >
              <div className="space-y-4">
                {/* Header card info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">{u.nombre}</h2>
                      {u.id === 1 && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded uppercase">
                          Propietario
                        </span>
                      )}
                    </div>
                  </div>

                  {u.id !== 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                        title="Editar destinatario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        disabled={actionLoading === u.id}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-50"
                        title="Eliminar destinatario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact data */}
                <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{u.telefono || 'Sin teléfono'}</span>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="mt-6 pt-4 border-t border-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className={`w-3.5 h-3.5 ${u.notif_email ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-700">Notificaciones Email</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(u.id, 'notif_email', !u.notif_email)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden ${
                      u.notif_email ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        u.notif_email ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className={`w-3.5 h-3.5 ${u.notif_sms ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-700">Notificaciones SMS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(u.id, 'notif_sms', !u.notif_sms)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden ${
                      u.notif_sms ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        u.notif_sms ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 font-display">
                    {editingUser ? 'Editar Destinatario' : 'Nuevo Destinatario'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {editingUser ? 'Actualiza los datos del contacto' : 'Agrega contactos a la lista de avisos del sistema'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sofía Mendoza"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: sofia.mendoza@email.com"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Celular / Teléfono (Con código de país)
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +51 987 654 321"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition"
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1.5"><KeyRound className="w-3 h-3" /> Contraseña de Acceso <span className="text-slate-400 font-normal normal-case">(opcional)</span></span>
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar vacío para no asignar contraseña"
                    className="w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-indigo-600 focus:border-indigo-600 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">¿Notificar Email?</span>
                  <button
                    type="button"
                    onClick={() => setNotifEmail(!notifEmail)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden ${
                      notifEmail ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        notifEmail ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">¿Notificar SMS?</span>
                  <button
                    type="button"
                    onClick={() => setNotifSms(!notifSms)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden ${
                      notifSms ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        notifSms ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-lg text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-xs transition"
                >
                  {editingUser ? 'Actualizar Destinatario' : 'Guardar Destinatario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-full">
                <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">¿Eliminar destinatario?</h3>
                <p className="text-[10px] text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong className="text-slate-800 font-extrabold">{userToDelete.nombre}</strong>? Dejará de recibir alertas de seguridad por correo o SMS.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading !== null}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition disabled:opacity-55"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-60"
              >
                {actionLoading === userToDelete.id ? (
                  <><span className="w-3 h-3 border-2 border-rose-300/40 border-t-white rounded-full animate-spin" /> Eliminando...</>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
