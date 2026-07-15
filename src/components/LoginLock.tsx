import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Flame, AlertCircle, LogIn, Mail, Lock } from 'lucide-react';
import { api } from '../lib/supabase';
import { Usuario } from '../types';

interface LoginLockProps {
  onUnlock: (user: Usuario) => void;
}

export default function LoginLock({ onUnlock }: LoginLockProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Auto-focus email field on mount
  useEffect(() => {
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
  }, []);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      triggerShake('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await api.login(trimmedEmail, password);

      if (user) {
        setSuccess(true);
        // Persist session
        localStorage.setItem('smartsense_session_active', 'true');
        localStorage.setItem('smartsense_active_user_id', String(user.id));
        setTimeout(() => {
          onUnlock(user);
        }, 700);
      } else {
        setLoading(false);
        triggerShake('Correo electrónico o contraseña incorrectos.');
      }
    } catch (err) {
      setLoading(false);
      triggerShake('Error al conectar. Verifica tu conexión e intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">

      {/* Background Ambient Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-rose-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-violet-900/5 blur-[100px] pointer-events-none" />

      {/* Main Login Container */}
      <div
        className={`w-full max-w-sm bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 ${
          shaking ? 'animate-shake' : ''
        } ${success ? 'scale-[0.98] opacity-90 border-emerald-500/30' : ''}`}
      >
        {/* App Logo & Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-lg ${
            success ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/20'
          }`}>
            <Flame className="w-5 h-5 text-white fill-rose-100" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight font-display block leading-none">SmartSense</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">IoT Gas Monitor</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-xs text-slate-400 mt-1">Ingresa tus credenciales para acceder al panel de control</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className={`w-4 h-4 transition-colors duration-200 ${email ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="tu@correo.com"
                autoComplete="email"
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 hover:border-slate-600/80 focus:border-indigo-500/80 focus:bg-slate-800 text-white text-sm rounded-xl outline-none transition-all duration-200 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className={`w-4 h-4 transition-colors duration-200 ${password ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading || success}
                className="w-full pl-10 pr-11 py-3 bg-slate-800/60 border border-slate-700/60 hover:border-slate-600/80 focus:border-indigo-500/80 focus:bg-slate-800 text-white text-sm rounded-xl outline-none transition-all duration-200 placeholder:text-slate-600 disabled:opacity-50 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || success}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 mt-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg focus:outline-none cursor-pointer disabled:cursor-not-allowed ${
              success
                ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-[0.98]'
                : loading
                ? 'bg-indigo-600/70 text-indigo-200 shadow-indigo-500/10'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-300/40 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : success ? (
              <>
                <span className="text-base">✓</span>
                Acceso concedido
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Help text */}
        <p className="text-[10px] text-slate-600 text-center mt-6">
          ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
        </p>

      </div>

      {/* Shaking Animation Inline CSS */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px); }
          30%, 60%, 90% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `}</style>

    </div>
  );
}
