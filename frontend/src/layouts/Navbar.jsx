import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell,
  Shield,
  UserCheck,
  ChevronDown,
  LogOut,
  Radio,
  Building2,
  HardHat,
  Siren,
  SlidersHorizontal,
  UploadCloud
} from 'lucide-react';

const DEMO_ROLES = [
  {
    id: 1,
    full_name: 'Thiru K. Balasubramanian, IAS',
    role: 'State Administrator',
    department: 'Transport & Road Safety Commission',
    badge_id: 'TN-IAS-084',
    icon: Shield,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    id: 2,
    full_name: 'Dr. S. Meenakshi, DRO',
    role: 'District Road Safety Officer',
    department: 'District Collectorate Chennai',
    badge_id: 'TN-REV-341',
    icon: Building2,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  {
    id: 3,
    full_name: 'ADGP Pradeep Kumar, IPS',
    role: 'Traffic Police Officer',
    department: 'Tamil Nadu Traffic Police Headquarters',
    badge_id: 'TN-IPS-109',
    icon: Siren,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  },
  {
    id: 4,
    full_name: 'Er. R. Senthil Nathan, SE',
    role: 'Highway Engineer',
    department: 'Highways Department & NHAI TN Cell',
    badge_id: 'TN-PWD-512',
    icon: HardHat,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    id: 5,
    full_name: 'Er. M. Geetha, Superintending Engg',
    role: 'Municipal Officer',
    department: 'Greater Chennai Corporation / Municipalities',
    badge_id: 'TN-GCC-781',
    icon: SlidersHorizontal,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  }
];

export default function Navbar() {
  const { user, logout, switchDemoRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between z-20 shadow-md">
      {/* Title & Live Pulse */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-white tracking-wide">
              TAMIL NADU STATEWIDE ROAD SAFETY COMMAND CENTER
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/40">
              SECRETARIAT CHENNAI
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span>Decision Support System</span>
            <span>•</span>
            <span className="flex items-center text-emerald-400 font-medium">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Live AI Inference Streams Active (248 Feeds)
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Manual Media AI Inspector Button */}
        <button
          onClick={() => navigate('/manual-inspection')}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 border border-cyan-400/40 transition active:scale-95"
          title="Upload road image or video to run AI risk inspection & get suggestions"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-200" />
          <span>Manual AI Inspector</span>
        </button>

        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Role</div>
              <div className="font-semibold text-white leading-tight">{user?.role || 'State Administrator'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch Operational Persona
              </div>
              <div className="mt-1 space-y-1">
                {DEMO_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = user?.role === r.role;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchDemoRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start space-x-2.5 transition text-xs ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/40 text-cyan-200'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded border ${r.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{r.full_name}</div>
                        <div className="text-[10px] text-cyan-400 font-medium">{r.role}</div>
                        <div className="text-[10px] text-slate-400 truncate">{r.department}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Bell Shortcut */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition"
          title="Critical Alerts"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            3
          </span>
        </button>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow">
            {user?.full_name ? user.full_name.charAt(0) : 'K'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

