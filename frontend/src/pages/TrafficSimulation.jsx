import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  Activity,
  Play,
  RotateCcw,
  Sliders,
  TrendingDown,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Car
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function TrafficSimulation() {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('location_id') || 1;

  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('roundabout_pedestrian');
  const [flowRate, setFlowRate] = useState(1800);
  const [duration, setDuration] = useState(3600);
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getScenarios().then(setScenarios).catch(console.error);
    runSim('roundabout_pedestrian', 1800);
  }, []);

  const runSim = async (scen = selectedScenario, flow = flowRate) => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        location_id: locationId,
        scenario: scen,
        flow_rate: flow,
        duration_seconds: duration,
      });
      setSimResults(res);
    } catch (err) {
      alert('Simulation execution failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const metrics = simResults?.metrics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="SUMO Digital Twin Microscopic Traffic Simulator"
        subtitle="Simulating urban corridor interventions using TraCI Python Trajectory Controller & Surrogate Safety Metrics (TTC)"
        badge="ECLIPSE SUMO v1.19"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Controls Panel */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">TraCI Simulation Parameters</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Scenario Chooser */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Select Intervention Scenario</label>
              <div className="space-y-1.5">
                {scenarios.map((sc) => {
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedScenario(sc.id);
                        runSim(sc.id, flowRate);
                      }}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/25 border-cyan-400 text-white shadow-md shadow-blue-900/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{sc.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{sc.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inflow Demand Slider */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Vehicle Inflow Demand</span>
                <span className="text-cyan-400 font-bold">{flowRate} PCU/hr</span>
              </div>
              <input
                type="range"
                min="800"
                max="2600"
                step="100"
                value={flowRate}
                onChange={(e) => setFlowRate(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-1"
              />
            </div>

            <button
              onClick={() => runSim(selectedScenario, flowRate)}
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Executing Micro-Simulation Steps...</span>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run TraCI Microscopic Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Visualizer & Time Series Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Scenario Title Banner */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                  Active Simulation Run
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{simResults?.scenario_label}</h3>
                <p className="text-xs text-slate-400 mt-1">{simResults?.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Location ID: #{locationId}</span>
                <div className="text-xs text-emerald-400 font-bold mt-1">
                  Surrogate TTC Conflict Drop: {metrics.conflict_reduction_pct}%
                </div>
              </div>
            </div>

            {/* Performance KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Average Delay</span>
                <div className="text-lg font-extrabold text-white mt-1">
                  {metrics.avg_delay_sec_per_vehicle || 0}s
                </div>
                <span className="text-[10px] text-slate-400">per vehicle</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Hourly Throughput</span>
                <div className="text-lg font-extrabold text-cyan-400 mt-1">
                  {metrics.network_throughput_veh_hr || 0}
                </div>
                <span className="text-[10px] text-slate-400">vehicles/hr</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Queue Length</span>
                <div className="text-lg font-extrabold text-amber-400 mt-1">
                  {metrics.avg_queue_length_meters || 0}m
                </div>
                <span className="text-[10px] text-slate-400">mean queue</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Critical Conflicts</span>
                <div className="text-lg font-extrabold text-rose-400 mt-1">
                  {metrics.conflict_events_ttc_critical || 0}
                </div>
                <span className="text-[10px] text-slate-400">TTC &lt; 1.5s events</span>
              </div>
            </div>
          </div>

          {/* Time Series Dynamic Flow Progression */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Microscopic Queue Length & Travel Speed Trajectory (3600s Run)
                </h3>
                <p className="text-xs text-slate-400">
                  Step-by-step Krauss car-following velocity vs queue accumulation
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                TraCI Step 1.0s
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simResults?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="queue_length_m"
                    name="Queue Length (m)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_speed_kmh"
                    name="Operating Speed (km/h)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="delay_sec"
                    name="Vehicle Delay (sec)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

