import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import {
  BarChart3,
  TrendingDown,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function DepartmentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load department analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hourly risk curve
  const hourlyRiskData = [
    { hour: '00:00', risk_index: 68, description: 'High Freight Speed' },
    { hour: '03:00', risk_index: 74, description: 'Commercial Driver Fatigue' },
    { hour: '06:00', risk_index: 48, description: 'Early Commute' },
    { hour: '08:00', risk_index: 82, description: 'Morning Peak Transit Surge' },
    { hour: '11:00', risk_index: 54, description: 'Mid-Day Steady Flow' },
    { hour: '14:00', risk_index: 46, description: 'Off-Peak Fluid' },
    { hour: '17:00', risk_index: 88, description: 'Evening Peak Congestion & Jaywalking' },
    { hour: '20:00', risk_index: 76, description: 'Night Mixed Traffic' },
    { hour: '22:00', risk_index: 71, description: 'Late Highway Freight Inflow' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departmental Performance & Statewide Safety Analytics"
        subtitle="Inter-agency collaboration metrics between Highways Department, Traffic Police, Municipal Corporations, and District Collectors"
        badge="STATEWIDE CONSOLIDATED"
      />

      {/* Department Resolution Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(data?.department_performance || []).map((dept, i) => (
          <div
            key={i}
            className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span className="truncate">{dept.department.split('/')[0]}</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{dept.efficiency}%</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Efficiency Rating
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Work Orders Assigned:</span>
                  <span className="text-white font-semibold">{dept.assigned}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Interventions:</span>
                  <span className="text-emerald-400 font-semibold">{dept.completed}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Avg Resolution Time:</span>
              <span className="font-bold text-slate-200">{dept.avg_days} Days</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Risk Distribution Area Chart */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              24-Hour Diurnal Road Safety Risk Curve across Tamil Nadu Corridors
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated hourly risk coefficient identifying peak pedestrian danger and late-night commercial vehicle crashes
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20">
            Diurnal Model
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyRiskData}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="risk_index"
                name="Hourly Risk Index"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#riskGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Safety Leaderboard Ranking Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Tamil Nadu District Road Safety Index (DRSI) Ranking
            </h3>
            <p className="text-xs text-slate-400">Ranked by lowest critical blackspot density and fastest remediation</p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Target: Vision Zero TN 2030</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">State Rank</th>
                <th className="py-3 px-4">District & Zone</th>
                <th className="py-3 px-4">Average Risk Score</th>
                <th className="py-3 px-4">Critical Blackspots</th>
                <th className="py-3 px-4">High-Risk Segments</th>
                <th className="py-3 px-4">Monitored Locations</th>
                <th className="py-3 px-4 text-right">District Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(data?.district_risk_breakdown || []).map((dist, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{dist.district}</div>
                    <div className="text-[10px] text-slate-400">{dist.zone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white">{dist.average_risk_score}</span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dist.average_risk_score >= 70 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${dist.average_risk_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-400">{dist.critical_count}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">{dist.high_count}</td>
                  <td className="py-3 px-4 font-mono">{dist.total_monitored}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        dist.average_risk_score >= 72
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {dist.average_risk_score >= 72 ? 'Priority Attention' : 'Active Monitoring'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

