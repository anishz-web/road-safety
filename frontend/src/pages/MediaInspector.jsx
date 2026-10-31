import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  UploadCloud,
  FileVideo,
  FileImage,
  Cpu,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Car,
  User,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  DollarSign,
  Clock,
  Building2,
  Flame,
  Check
} from 'lucide-react';

const SAMPLE_PRESETS = [
  {
    name: 'Kathipara Interchange',
    type: 'Image (Wet Road & Weaving)',
    filename: 'sample_kathipara.jpg',
    road_name: 'Kathipara Cloverleaf Junction, Guindy',
    district_id: 1,
    weather: 'Moderate Rain',
    speed_limit: 50,
    has_crossing: false,
    has_lights: true
  },
  {
    name: 'Sholinganallur OMR',
    type: 'Image (High Jaywalking Zone)',
    filename: 'sample_omr_jaywalking.jpg',
    road_name: 'Sholinganallur Junction, OMR',
    district_id: 1,
    weather: 'Dry',
    speed_limit: 60,
    has_crossing: false,
    has_lights: true
  },
  {
    name: 'Salem NH-44 Bypass',
    type: 'Image (Pothole Defect)',
    filename: 'sample_salem_pothole.jpg',
    road_name: 'Seelanaickenpatti Bypass Junction',
    district_id: 4,
    weather: 'Heavy Downpour',
    speed_limit: 60,
    has_crossing: false,
    has_lights: false
  }
];

export default function MediaInspector() {
  const [file, setFile] = useState(null);
  const [roadName, setRoadName] = useState('Kathipara Cloverleaf Junction, Guindy');
  const [districtId, setDistrictId] = useState(1);
  const [weatherCondition, setWeatherCondition] = useState('Dry');
  const [speedLimit, setSpeedLimit] = useState(50);
  const [hasCrossing, setHasCrossing] = useState(false);
  const [hasLights, setHasLights] = useState(true);

  const [districts, setDistricts] = useState([]);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [convertedWorkOrders, setConvertedWorkOrders] = useState({});
  const [convertingId, setConvertingId] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(console.error);
    api.getRoads().then(setRoads).catch(console.error);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSelectPreset = async (preset) => {
    setRoadName(preset.road_name);
    setDistrictId(preset.district_id);
    setWeatherCondition(preset.weather);
    setSpeedLimit(preset.speed_limit);
    setHasCrossing(preset.has_crossing);
    setHasLights(preset.has_lights);

    try {
      const response = await fetch(`/uploads/${preset.filename}`);
      const blob = await response.blob();
      const mockFile = new File([blob], preset.filename, { type: 'image/jpeg' });
      setFile(mockFile);
    } catch (err) {
      console.warn('Could not fetch preset file:', err);
    }
  };

  const handleSubmitAnalysis = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      alert('Please select an image or video file first, or click one of the demo samples.');
      return;
    }

    setLoading(true);
    setResults(null);
    setConvertedWorkOrders({});

    const formData = new FormData();
    formData.append('file', file);
    formData.append('road_name', roadName);
    formData.append('district_id', districtId);
    formData.append('weather_condition', weatherCondition);
    formData.append('speed_limit', speedLimit);
    formData.append('has_pedestrian_crossing', hasCrossing);
    formData.append('has_street_lights', hasLights);

    try {
      const data = await api.inspectMedia(formData);
      setResults(data);
    } catch (err) {
      alert('Media AI Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToWorkOrder = async (sug) => {
    setConvertingId(sug.id);
    try {
      const payload = {
        title: sug.title,
        problem_identified: sug.problem_identified,
        suggested_solution: sug.suggested_solution,
        responsible_department: sug.responsible_department,
        priority: sug.priority,
        expected_risk_reduction_pct: sug.expected_risk_reduction_pct,
        estimated_cost_inr: sug.estimated_cost_inr,
        estimated_timeline_days: sug.estimated_timeline_days,
        road_name: roadName,
        district_id: parseInt(districtId, 10),
      };

      const res = await api.convertSuggestionToWorkOrder(payload);
      setConvertedWorkOrders((prev) => ({
        ...prev,
        [sug.id]: res.work_order_no,
      }));
    } catch (err) {
      alert('Work Order conversion failed: ' + err.message);
    } finally {
      setConvertingId(null);
    }
  };

  const risk = results?.risk_assessment || {};
  const metrics = results?.vision_metrics || {};
  const media = results?.media_info || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual AI Media Inspector & Risk Advisory"
        subtitle="Upload road images or CCTV/drone video footage for automatic object detection, risk factor extraction, and engineering suggestions"
        badge="MANUAL AI INSPECTOR"
      />

      {/* Upload Zone & Context Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Upload & Controls */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload Road Image or Video Footage
            </h3>
          </div>

          <form onSubmit={handleSubmitAnalysis} className="space-y-4">
            {/* Drag & Drop File Zone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-400/60 rounded-xl p-6 text-center bg-slate-900/60 transition group cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-cyan-400 border border-blue-500/20 flex items-center justify-center shadow group-hover:scale-105 transition">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    {file ? file.name : 'Click or Drag & Drop Footage Here'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP, MP4, AVI, MOV, WEBM (CCTV or Drone Clips)
                  </div>
                </div>
                {file && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                    {(file.size / 1024 / 1024).toFixed(2)} MB Selected
                  </span>
                )}
              </div>
            </div>

            {/* Quick Demonstration Samples */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Or 1-Click Test with Prepared Tamil Nadu Footage
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition"
                  >
                    <div className="font-bold text-white text-[11px] truncate">{p.name}</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5 truncate">{p.type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Corridor / Road Name</label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. GST Road, Kathipara"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">District Location</label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Environmental Weather</label>
                <select
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Dry">Dry Sunlight (Optimal Friction)</option>
                  <option value="Light Rain">Light Rain Showers</option>
                  <option value="Moderate Rain">Moderate Monsoon Rain</option>
                  <option value="Heavy Downpour">Heavy Downpour / Flash Flooding</option>
                  <option value="Fog / Low Visibility">Dense Fog / Low Visibility</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Posted Speed Limit</label>
                <select
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="40">40 km/h (Urban Core)</option>
                  <option value="50">50 km/h (Arterial)</option>
                  <option value="60">60 km/h (State Highway)</option>
                  <option value="80">80 km/h (National Highway)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCrossing}
                  onChange={(e) => setHasCrossing(e.target.checked)}
                  className="rounded bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">Zebra Crossing Present</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLights}
                  onChange={(e) => setHasLights(e.target.checked)}
                  className="rounded bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">High-Mast Street Lights</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Video Frames, Detecting Risks & Suggestions...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Analyze Image / Video with AI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Media Inspection Preview */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Visual AI Detection Overlay</h3>
              </div>
              {results && (
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700"
                >
                  {showOriginal ? 'Show AI Bounding Boxes' : 'Show Original Footage'}
                </button>
              )}
            </div>

            {results?.media_info?.annotated_preview_url ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
                <img
                  src={showOriginal ? media.file_url : media.annotated_preview_url}
                  alt="AI Detection Preview"
                  className="w-full h-full object-contain"
                />

                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-cyan-300 font-mono">
                  {media.media_type === 'video' ? 'VIDEO KEYFRAME INSPECTION' : 'IMAGE AI INSPECTION'}
                </div>

                {metrics.hazards_detected?.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-rose-600/90 text-white font-bold text-[10px] animate-pulse flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{metrics.hazards_detected.length} HAZARD DETECTED</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <FileImage className="w-12 h-12 mb-2 opacity-40 text-cyan-400" />
                <div className="font-semibold text-xs text-slate-400">Media Preview Canvas</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Upload an image or video above to view OpenCV & YOLO detection boxes and hazard tags.
                </div>
              </div>
            )}
          </div>

          {/* Extracted Flow Numbers */}
          {results && (
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold">Vehicles</span>
                <div className="text-base font-bold text-white">{metrics.total_vehicles || 0}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold">Pedestrians</span>
                <div className="text-base font-bold text-purple-400">{metrics.total_pedestrians || 0}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold">85th % Speed</span>
                <div className="text-base font-bold text-rose-400">{metrics.p85_speed_kmh || 0} km/h</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold">Conflicts</span>
                <div className="text-base font-bold text-amber-400">{metrics.near_miss_conflicts || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results View: Risk Score, Risk Factors, and AI Suggestions */}
      {results && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* AI Calculated Risk Score Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Predictive Risk Assessment
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-4xl font-black text-white">{risk.risk_score}</span>
                  <span className="text-sm text-slate-400">/ 100</span>
                  <StatusBadge status={risk.risk_category} />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Corridor: <strong className="text-white">{roadName}</strong> • Evaluated via XGBoost-TN-v2.4
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence</span>
                <div className="text-lg font-bold text-emerald-400">
                  {Math.round((risk.confidence_score || 0.92) * 100)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Crash Probability: <strong className="text-rose-400">{risk.predicted_accident_prob}</strong>
                </div>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    risk.risk_score >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : risk.risk_score >= 55
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${risk.risk_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Identified Risk Factors from Uploaded Footage</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Empirical risk contributors extracted by computer vision and XGBoost explainability
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                {results.risk_factors?.length || 0} Factors Identified
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {results.risk_factors?.map((rf, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={rf.severity} size="xs" />
                      <span className="font-bold text-white text-xs">{rf.factor_name}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{rf.description}</p>
                    <div className="text-[10px] text-cyan-400 font-mono">{rf.benchmark}</div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center flex-shrink-0">
                    <span className="text-xs font-black text-rose-400">
                      +{rf.impact_points} pts
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Risk Impact</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable AI Safety Suggestions */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span>Actionable AI Safety Suggestions & Interventions</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted engineering proposals to eliminate identified risks (requires human approval)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {results.ai_suggestions?.map((sug) => {
                const isConverted = convertedWorkOrders[sug.id];
                return (
                  <div
                    key={sug.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={sug.priority} size="xs" />
                            <span className="text-[10px] text-cyan-400 font-semibold">{sug.responsible_department}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1.5 leading-snug">{sug.title}</h4>
                        </div>
                      </div>

                      <div className="mt-2.5 p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300 text-[11px]">
                        <strong className="text-cyan-400 block mb-0.5">Recommended Solution:</strong>
                        {sug.suggested_solution}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase">Crash Reduction</span>
                          <div className="text-xs font-black text-emerald-400 mt-0.5">
                            ↓ {sug.expected_risk_reduction_pct}%
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase">Est. Budget</span>
                          <div className="text-xs font-black text-white mt-0.5">
                            ₹{(sug.estimated_cost_inr / 100000).toFixed(1)}L
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase">Target Days</span>
                          <div className="text-xs font-black text-slate-300 mt-0.5">
                            {sug.estimated_timeline_days}d
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {isConverted ? (
                        <div className="text-emerald-400 font-bold flex items-center space-x-1.5 text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sanctioned: {isConverted}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConvertToWorkOrder(sug)}
                          disabled={convertingId === sug.id}
                          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {convertingId === sug.id ? 'Sanctioning Work Order...' : 'Approve & Create Work Order'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

