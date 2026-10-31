import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Lock, Mail, ArrowRight, Shield, Building2, HardHat, Siren, SlidersHorizontal } from 'lucide-react';

const DEMO_PERSONAS = [
  {
    email: 'state.admin@tn.gov.in',
    name: 'Thiru K. Balasubramanian, IAS',
    role: 'State Administrator',
    dept: 'Transport & Road Safety Commission',
    icon: Shield,
    badge: 'State HQ'
  },
  {
    email: 'dro.chennai@tn.gov.in',
    name: 'Dr. S. Meenakshi, DRO',
    role: 'District Road Safety Officer',
    dept: 'District Collectorate Chennai',
    icon: Building2,
    badge: 'District'
  },
  {
    email: 'traffic.police@tn.gov.in',
    name: 'ADGP Pradeep Kumar, IPS',
    role: 'Traffic Police Officer',
    dept: 'Tamil Nadu Traffic Police Headquarters',
    icon: Siren,
    badge: 'Police Wing'
  },
  {
    email: 'highway.engg@tn.gov.in',
    name: 'Er. R. Senthil Nathan, SE',
    role: 'Highway Engineer',
    dept: 'Highways Department & NHAI TN Cell',
    icon: HardHat,
    badge: 'Engineering'
  },
  {
    email: 'corp.officer@tn.gov.in',
    name: 'Er. M. Geetha, Superintending Engg',
    role: 'Municipal Officer',
    dept: 'Greater Chennai Corporation',
    icon: SlidersHorizontal,
    badge: 'Corporation'
  }
];

export default function Login() {
  const [email, setEmail] = useState('state.admin@tn.gov.in');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (persona) => {
    setEmail(persona.email);
    setPassword('Admin@123');
    switchDemoRole({
      id: 1,
      full_name: persona.name,
      email: persona.email,
      role: persona.role,
      department: persona.dept
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen w-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-cyan-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/25 border border-cyan-400/40 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">ROADGUARD TN</h1>
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold mt-1">
            State of Tamil Nadu • Road Safety Commission
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Centralized AI-Powered Predictive Road Safety & Traffic Intervention Management System
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Government Email / Service ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@tn.gov.in"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Secure Access PIN / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
              1-Click Government Demo Personas
            </div>
            <div className="space-y-1.5">
              {DEMO_PERSONAS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLogin(p)}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-1.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] text-slate-500">
          Official Government Management System • Restricted Department Access Only
        </div>
      </div>
    </div>
  );
}

