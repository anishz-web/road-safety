import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Camera,
  UploadCloud,
  Cpu,
  CloudRain,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Activity,
  GitCompare,
  BarChart3,
  Bell,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Main Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Tamil Nadu Safety Map', icon: MapPin },
  { path: '/cameras', label: 'Camera Monitoring', icon: Camera },
  { path: '/manual-inspection', label: 'Manual AI Media Inspector', icon: UploadCloud },
  { path: '/risk-analysis', label: 'AI Risk Analysis', icon: Cpu },
  { path: '/weather', label: 'Weather Intelligence', icon: CloudRain },
  { path: '/hazards', label: 'Hazard Detection', icon: AlertTriangle },
  { path: '/recommendations', label: 'Safety Recommendations', icon: Lightbulb },
  { path: '/work-orders', label: 'Intervention Work Orders', icon: FileCheck },
  { path: '/simulation', label: 'Digital Twin Simulation', icon: Activity },
  { path: '/before-after', label: 'Before & After Analysis', icon: GitCompare },
  { path: '/analytics', label: 'Department Analytics', icon: BarChart3 },
  { path: '/alerts', label: 'Alerts & Notifications', icon: Bell },
  { path: '/reports', label: 'Official Reports', icon: FileText },
  { path: '/users', label: 'Users & Roles', icon: Users },
  { path: '/settings', label: 'System Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-[#0a0f1d] border-r border-slate-800 flex flex-col flex-shrink-0 z-30 select-none">
      {/* Brand & State Seal */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/40">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold border border-cyan-400/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold tracking-wider text-white text-base">ROADGUARD</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">TN</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">
            Govt of Tamil Nadu • Road Safety
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Command Center Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30 font-semibold shadow-sm shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
            </NavLink>
          );
        })}
      </div>

      {/* Footer State Seal Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>TN-CADS Core v2.4</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
          DEMO DATA
        </span>
      </div>
    </aside>
  );
}

