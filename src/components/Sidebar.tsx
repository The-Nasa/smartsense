import { NavLink } from 'react-router-dom';
import { Flame, LineChart, ClipboardList, Settings, User, Users, LogOut, Volume2, VolumeX } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function Sidebar({ onLogout, soundEnabled = true, onToggleSound }: SidebarProps) {

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LineChart },
    { to: '/historial', label: 'Historial', icon: ClipboardList },
    { to: '/config', label: 'Configuración', icon: Settings },
    { to: '/usuario', label: 'Usuario & WiFi', icon: User },
    { to: '/destinatarios', label: 'Destinatarios', icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen fixed left-0 top-0 z-20">
        {/* Project Branding */}
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-xl text-white shadow-xs shadow-rose-500/30">
            <Flame className="w-5 h-5 fill-rose-100" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 tracking-tight font-display">SmartSense</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">IoT Gas Monitor</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={`sidebar-link-${item.to.replace('/', 'home')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sound Toggle & Logout (Desktop) */}
        <div className="px-4 pb-4 space-y-2">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-emerald-100 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50'
                  : 'border-slate-100 bg-slate-50/40 text-slate-400 hover:bg-slate-50'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {soundEnabled ? 'Alarma Activa' : 'Alarma Silenciada'}
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Bottom-Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex justify-around items-center px-2 z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={`mobile-link-${item.to.replace('/', 'home')}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-lg transition-all ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}

        {/* Logout Button (Mobile) */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1 w-16 py-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Salir</span>
        </button>
      </nav>
    </>
  );
}
