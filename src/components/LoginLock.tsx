import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete, AlertCircle, Flame } from 'lucide-react';

interface LoginLockProps {
  onUnlock: () => void;
}

export default function LoginLock({ onUnlock }: LoginLockProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [shaking, setShaking] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const CORRECT_PIN = '123456';

  // Check PIN when it reaches 6 digits
  useEffect(() => {
    if (pin.length === 6) {
      if (pin === CORRECT_PIN) {
        setSuccess(true);
        setError(false);
        setTimeout(() => {
          localStorage.setItem('smartsense_session_active', 'true');
          onUnlock();
        }, 800);
      } else {
        // Shaking error feedback
        setError(true);
        setShaking(true);
        setTimeout(() => setShaking(false), 500); // Shaking animation duration
        setTimeout(() => {
          setPin('');
        }, 600);
      }
    }
  }, [pin, onUnlock]);

  const handleKeyPress = (num: string) => {
    if (success || pin.length >= 6) return;
    setError(false);
    setPin((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (success || pin.length === 0) return;
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (success) return;
    setError(false);
    setPin('');
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, success]);

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Ambient Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-rose-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      {/* Main Lock Container */}
      <div 
        className={`w-full max-w-sm bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center transition-all ${
          shaking ? 'animate-shake' : ''
        } ${success ? 'scale-98 opacity-90 border-emerald-500/30' : ''}`}
      >
        {/* App Logo & Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <Flame className="w-5 h-5 fill-rose-100" />
          </div>
          <span className="text-lg font-black text-white tracking-tight font-display">SmartSense</span>
        </div>

        {/* Lock Icon */}
        <div className="mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            success 
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
              : error 
                ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' 
                : 'bg-slate-800/50 border border-slate-800 text-slate-400'
          }`}>
            {success ? <Unlock className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
          </div>
        </div>

        {/* Text descriptions */}
        <h2 className="text-base font-extrabold text-white text-center">Acceso de Seguridad</h2>
        <p className="text-xs text-slate-400 text-center mt-1 mb-8 max-w-[250px]">
          Ingresa el código PIN de 6 dígitos para desbloquear el panel
        </p>

        {/* PIN Indicators Dots */}
        <div className="flex justify-center gap-3.5 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                success 
                  ? 'bg-emerald-400 border-emerald-500 shadow-sm shadow-emerald-400/50 scale-110'
                  : i < pin.length
                    ? 'bg-indigo-500 border-indigo-600 shadow-xs shadow-indigo-500/30 scale-105'
                    : 'bg-slate-800 border-slate-700/60'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        <div className="h-6 mb-2 flex items-center justify-center">
          {error && (
            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Código PIN incorrecto</span>
            </div>
          )}
        </div>

        {/* Numeric Tactile Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="w-full aspect-square rounded-full bg-slate-800/30 hover:bg-slate-800/80 active:bg-slate-700 border border-slate-800/40 text-lg font-bold text-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          {/* Keypad Row 4: CLEAR (ESC) | 0 | BACKSPACE */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full aspect-square rounded-full text-xs font-extrabold text-slate-500 hover:text-slate-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider"
          >
            Borrar
          </button>
          
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-full aspect-square rounded-full bg-slate-800/30 hover:bg-slate-800/80 active:bg-slate-700 border border-slate-800/40 text-lg font-bold text-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          
          <button
            type="button"
            onClick={handleBackspace}
            className="w-full aspect-square rounded-full text-slate-500 hover:text-slate-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security advice warning */}
        <p className="text-[10px] text-slate-500 text-center mt-6">
          Por defecto el código es: <span className="font-mono text-slate-400 font-bold">123456</span>
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
