import { NavLink } from 'react-router-dom';
import { Flame, LineChart, ClipboardList, Settings, User, Database, Radio } from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase';

interface SidebarProps {
  onOpenConfigModal: () => void;
}

export default function Sidebar({ onOpenConfigModal }: SidebarProps) {
  const config = getSupabaseConfig();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LineChart },
    { to: '/historial', label: 'Historial', icon: ClipboardList },
    { to: '/config', label: 'Configuración', icon: Settings },
    { to: '/usuario', label: 'Usuario & WiFi', icon: User },
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
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
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

        {/* Connection Status & Trigger Modal */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onOpenConfigModal}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              config.isMock
                ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
                : 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  config.isMock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {config.isMock ? <Radio className="w-3.5 h-3.5 animate-pulse" /> : <Database className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Base</p>
                <p className={`text-xs font-semibold ${config.isMock ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {config.isMock ? 'Modo Simulador' : 'Supabase Activo'}
                </p>
              </div>
            </div>
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
                `flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-lg transition-all ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
