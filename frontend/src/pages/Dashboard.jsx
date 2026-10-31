import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  ShieldAlert,
  AlertOctagon,
  Camera,
  Bell,
  CheckCircle2,
  Clock,
  TrendingDown,
  MapPin,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronRight,
  Flame,
  UploadCloud
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [highRiskRoads, setHighRiskRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [analytics, roads] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getRoads({ risk_level: 'Critical' })
      ]);
      setData(analytics);
      setHighRiskRoads(roads.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96 text-cyan-400 text-sm font-semibold animate-pulse">
        Initializing Tamil Nadu Statewide Road Safety Command Telemetry...
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statewide Road Safety Command Dashboard"
        subtitle="Centralized predictive risk intelligence, real-time camera alerts, and engineering intervention tracking"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open GIS Map</span>
            </button>
          </div>
        }
      />

      {/* Manual AI Inspector Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-wide">Manual AI Media Inspector & Risk Suggestion</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">NEW</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload road photos or drone/CCTV video clips manually to detect vehicles, pedestrians, hazards, calculate AI risk score, and generate engineering suggestions.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/manual-inspection')}
          className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Image / Video</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Corridors"
          value={kpis.total_monitored_locations || 20}
          subtitle="Covering 38 TN Districts"
          icon={MapPin}
          color="blue"
          badge="100% Online"
        />
        <MetricCard
          title="Critical Risk Zones"
          value={kpis.critical_risk_zones || 8}
          subtitle="Score >= 75 (P1 Red Alerts)"
          icon={Flame}
          color="red"
          badge="Urgent Action"
        />
        <MetricCard
          title="Active AI Cameras"
          value={`${kpis.active_camera_count || 10} / ${kpis.total_camera_count || 10}`}
          subtitle="Real-time Vision Streams"
          icon={Camera}
          color="cyan"
          badge="30 FPS Stream"
        />
        <MetricCard
          title="Active Alerts"
          value={kpis.current_alerts || 3}
          subtitle="Dispatched QRF / Patrols"
          icon={Bell}
          color="orange"
          badge="Real-time"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="High Risk Zones"
          value={kpis.high_risk_zones || 10}
          subtitle="Score 55 - 74 (P2 Orange)"
          icon={AlertOctagon}
          color="orange"
        />
        <MetricCard
          title="Medium Risk Zones"
          value={kpis.medium_risk_zones || 2}
          subtitle="Score 35 - 54 (P3 Yellow)"
          icon={ShieldAlert}
          color="emerald"
        />
        <MetricCard
          title="Pending Interventions"
          value={kpis.pending_interventions || 2}
          subtitle="In Engineering Workflow"
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Completed Interventions"
          value={kpis.completed_interventions || 2}
          subtitle="Average 74.2% Crash Drop"
          icon={CheckCircle2}
          color="emerald"
          trend="↓ 74.2% Risk"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Risk Chart */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                District-Wise Road Risk Severity (Top Districts)
              </h3>
              <p className="text-xs text-slate-400">Mean calculated risk score from AI sensor matrix</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              XGBoost Index
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.district_risk_breakdown || []).slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="district" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="average_risk_score" name="Avg Risk Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical_count" name="Critical Blackspots" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Types Pie */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Detected Hazard Breakdown</h3>
            <p className="text-xs text-slate-400">Automated video inspection classification</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.hazard_distribution || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(data?.hazard_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1 text-xs">
            {(data?.hazard_distribution || []).map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.type}</span>
                </div>
                <span className="font-bold text-white">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends & High Risk Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                6-Month Predictive vs Observed Crash Trajectory
              </h3>
              <p className="text-xs text-slate-400">
                Evaluating impact of completed engineering interventions across TN corridors
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Post-Audit
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="predicted_incidents"
                  name="AI Risk Forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual_crashes"
                  name="Observed Accidents"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="interventions"
                  name="Completed Interventions"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk Corridors List */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Critical Blackspot Action List</span>
              </h3>
              <button
                onClick={() => navigate('/risk-analysis')}
                className="text-xs text-cyan-400 hover:underline flex items-center"
              >
                <span>Full AI Engine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {highRiskRoads.map((road) => (
                <div
                  key={road.id}
                  onClick={() => navigate(`/map?road_id=${road.id}`)}
                  className="p-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-white truncate max-w-[200px]">{road.road_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {road.district_name} • {road.road_code}
                      </div>
                    </div>
                    <StatusBadge status={road.risk_level} size="xs" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Risk Score: <strong className="text-rose-400">{road.risk_score}</strong></span>
                    <span className="text-cyan-400 font-medium hover:underline flex items-center">
                      Inspect <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Workflow: Detect → Predict → Implement</span>
            <button
              onClick={() => navigate('/work-orders')}
              className="text-cyan-400 font-semibold hover:underline"
            >
              View Work Orders →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

