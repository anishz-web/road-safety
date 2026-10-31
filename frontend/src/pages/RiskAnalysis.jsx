import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Cpu,
  Sliders,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Flame,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function RiskAnalysis() {
  const [roads, setRoads] = useState([]);
  const [selectedRoadId, setSelectedRoadId] = useState('');

  // Interactive Model Input Features
  const [density, setDensity] = useState(210);
  const [avgSpeed, setAvgSpeed] = useState(48);
  const [p85Speed, setP85Speed] = useState(66);
  const [speedLimit, setSpeedLimit] = useState(50);
  const [pedestrians, setPedestrians] = useState(280);
  const [lanes, setLanes] = useState(4);
  const [junctionType, setJunctionType] = useState(1); // 0: Grade, 1: Signal, 2: Rotary, 3: Uncontrolled
  const [rainfall, setRainfall] = useState(15);
  const [visibility, setVisibility] = useState(4500);
  const [friction, setFriction] = useState(0.42);
  const [hasCrossing, setHasCrossing] = useState(false);
  const [hasLights, setHasLights] = useState(true);
  const [hazards, setHazards] = useState(2);
  const [accidents, setAccidents] = useState(11);

  // Output prediction state
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRoads().then((data) => {
      setRoads(data);
      if (data.length > 0) {
        setSelectedRoadId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleRunPrediction = async () => {
    setLoading(true);
    try {
      const payload = {
        road_location_id: selectedRoadId ? parseInt(selectedRoadId, 10) : null,
        vehicle_density: parseFloat(density),
        avg_speed_kmh: parseFloat(avgSpeed),
        p85_speed_kmh: parseFloat(p85Speed),
        speed_limit: parseFloat(speedLimit),
        pedestrian_count: parseFloat(pedestrians),
        lanes: parseInt(lanes, 10),
        road_type_code: 3,
        junction_type_code: parseInt(junctionType, 10),
        rainfall_mm: parseFloat(rainfall),
        visibility_meters: parseFloat(visibility),
        surface_friction_index: parseFloat(friction),
        has_pedestrian_crossing: hasCrossing,
        has_street_lights: hasLights,
        active_hazards_count: parseInt(hazards, 10),
        historical_accidents_annual: parseInt(accidents, 10),
      };

      const res = await api.predictRisk(payload);
      setPrediction(res);
    } catch (err) {
      alert('Risk prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunPrediction();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive AI Road Risk & SHAP Explainability Engine"
        subtitle="Gradient Boosted Decision Trees (XGBoost) with Shapley Additive Explanations for proactive blackspot prevention"
        badge="XGBoost-TN-v2.4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Control Panel */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Road Corridor Parametric Sandbox</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">16 Feature Vector</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Road Preset Selector */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Select Tamil Nadu Corridor Preset</label>
              <select
                value={selectedRoadId}
                onChange={(e) => setSelectedRoadId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.road_name} ({r.district_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders Grid */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Vehicle Density (PCU/km)</span>
                <span className="text-cyan-400 font-bold">{density} PCU</span>
              </div>
              <input
                type="range"
                min="40"
                max="320"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>85th % Speed</span>
                  <span className="text-rose-400 font-bold">{p85Speed} km/h</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={p85Speed}
                  onChange={(e) => setP85Speed(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Speed Limit</span>
                  <span className="text-slate-300 font-bold">{speedLimit} km/h</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="10"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Pedestrian Crossing Friction (crossings/hr)</span>
                <span className="text-purple-400 font-bold">{pedestrians} /hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                value={pedestrians}
                onChange={(e) => setPedestrians(e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Rainfall (mm/hr)</span>
                  <span className="text-cyan-400 font-bold">{rainfall} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Pavement Skid (BPN)</span>
                  <span className="text-amber-400 font-bold">{friction}</span>
                </div>
                <input
                  type="range"
                  min="0.28"
                  max="0.80"
                  step="0.02"
                  value={friction}
                  onChange={(e) => setFriction(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Junction Configuration</label>
              <select
                value={junctionType}
                onChange={(e) => setJunctionType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="0">Grade Separated Interchange</option>
                <option value="1">Signalized Multi-Leg Intersection</option>
                <option value="2">Substandard Rotary / Roundabout</option>
                <option value="3">Uncontrolled Skewed T-Junction / Blind Cut</option>
              </select>
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCrossing}
                  onChange={(e) => setHasCrossing(e.target.checked)}
                  className="rounded bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">Has Zebra Crossing</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLights}
                  onChange={(e) => setHasLights(e.target.checked)}
                  className="rounded bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">High-Mast Lighting</span>
              </label>
            </div>

            <button
              onClick={handleRunPrediction}
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Computing Decision Trees...</span>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Execute XGBoost + SHAP Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Panel & SHAP Explainability */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Score Prediction Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Calculated Risk Metric
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-4xl font-black text-white">{prediction?.risk_score || 0}</span>
                  <span className="text-sm text-slate-400">/ 100</span>
                  <StatusBadge status={prediction?.risk_category} />
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Model Confidence</div>
                <div className="text-base font-bold text-emerald-400">
                  {Math.round((prediction?.confidence_score || 0.92) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Est. Crash Probability: <strong>{prediction?.predicted_accident_prob || 0.38}</strong>
                </div>
              </div>
            </div>

            {/* Model Limitations Notice */}
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start space-x-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{prediction?.data_limitations}</span>
            </div>
          </div>

          {/* SHAP Feature Contribution Waterfall / Bar Chart */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  SHAP Explainability: Why Was This Score Assigned?
                </h3>
                <p className="text-xs text-slate-400">
                  Feature attributions (Shapley Values) showing positive vs mitigating risk drivers
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                TreeExplainer Output
              </span>
            </div>

            {prediction?.shap_breakdown && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prediction.shap_breakdown}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="factor_name" type="category" stroke="#64748b" fontSize={10} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val) => [`${val > 0 ? '+' : ''}${val} points`, 'SHAP Attribution']}
                    />
                    <Bar dataKey="shap_value" name="Risk Contribution" radius={[0, 4, 4, 0]}>
                      {prediction.shap_breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.shap_value > 0 ? '#ef4444' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Detailed Factors List with Explanations */}
            <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">
              {prediction?.shap_breakdown?.map((f, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border flex items-start justify-between ${
                    f.shap_value > 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>{f.factor_name}</span>
                      <span className="text-[10px] opacity-70">({f.feature_value})</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{f.description}</div>
                  </div>
                  <span className="font-extrabold text-sm ml-3 flex-shrink-0">
                    {f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

