import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Settings,
  Database,
  Cpu,
  Save,
  CheckCircle2,
  Sliders,
  Cloud,
  Layers,
  Key,
  Shield,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [weatherKey, setWeatherKey] = useState('');
  const [yoloThresh, setYoloThresh] = useState(0.50);
  const [trackThresh, setTrackThresh] = useState(0.60);
  const [xgboostThresh, setXgboostThresh] = useState(75.0);
  const [sumoPath, setSumoPath] = useState('sumo');
  const [demoMode, setDemoMode] = useState(true);
  const [alertSound, setAlertSound] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSystemInfo(data);
      if (data.settings) {
        setWeatherKey(data.settings.openweather_api_key || '');
        setYoloThresh(data.settings.yolo_confidence_threshold || 0.50);
        setTrackThresh(data.settings.bytetrack_iou_threshold || 0.60);
        setXgboostThresh(data.settings.xgboost_critical_threshold || 75.0);
        setSumoPath(data.settings.sumo_binary_path || 'sumo');
        setDemoMode(data.settings.demo_mode ?? true);
        setAlertSound(data.settings.alert_sound_enabled ?? true);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings({
        openweather_api_key: weatherKey,
        yolo_confidence_threshold: parseFloat(yoloThresh),
        bytetrack_iou_threshold: parseFloat(trackThresh),
        xgboost_critical_threshold: parseFloat(xgboostThresh),
        sumo_binary_path: sumoPath,
        demo_mode: demoMode,
        alert_sound_enabled: alertSound,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      loadSettings();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Parameters & AI Architecture Settings"
        subtitle="Configure model confidence cutoffs, MySQL database links, OpenWeather API tokens, and TraCI simulation paths"
        badge="CORE CONFIG"
      />

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration parameters persisted and synchronized across workers.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-lg">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* AI Thresholds Section */}
            <div>
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 mb-4">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Inference Thresholds</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between font-semibold text-slate-300 mb-1">
                    <span>YOLO Confidence Cutoff</span>
                    <span className="text-cyan-400">{Math.round(yoloThresh * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="0.90"
                    step="0.05"
                    value={yoloThresh}
                    onChange={(e) => setYoloThresh(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500">Minimum score to retain vehicle/pedestrian box</span>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-300 mb-1">
                    <span>ByteTrack IoU Match Cutoff</span>
                    <span className="text-purple-400">{Math.round(trackThresh * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.85"
                    step="0.05"
                    value={trackThresh}
                    onChange={(e) => setTrackThresh(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-500">Bounding-box overlap threshold for ID continuity</span>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between font-semibold text-slate-300 mb-1">
                    <span>XGBoost Critical Blackspot Alert Threshold</span>
                    <span className="text-rose-400">{xgboostThresh} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="1"
                    value={xgboostThresh}
                    onChange={(e) => setXgboostThresh(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <span className="text-[10px] text-slate-500">Predicted scores above this trigger immediate QRF alerts</span>
                </div>
              </div>
            </div>

            {/* External Integrations */}
            <div>
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 mb-4">
                <Cloud className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">External API Integrations</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">OpenWeather API Token</label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="Optional API Key (default: simulated IMD radar feed)"
                      value={weatherKey}
                      onChange={(e) => setWeatherKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">SUMO Microscopic Engine Path</label>
                  <input
                    type="text"
                    value={sumoPath}
                    onChange={(e) => setSumoPath(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Binary invocation path for TraCI controller</span>
                </div>
              </div>
            </div>

            {/* Operational Modes */}
            <div>
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 mb-4">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Command Center Flags</h3>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">Demonstration Mode Badging</div>
                    <div className="text-[10px] text-slate-400">Display DEMO DATA indicators across analytics and reports</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-200">Critical Audible Alert Chimes</div>
                    <div className="text-[10px] text-slate-400">Play tone on severe near-miss conflict detection</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertSound}
                    onChange={(e) => setAlertSound(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 text-blue-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-600/30 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-4 space-y-4 text-xs">
          {/* Database Live Health Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-cyan-400 font-bold">
              <Database className="w-4 h-4" />
              <span className="uppercase text-[11px] tracking-wider">MySQL 8.0 Telemetry</span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Server Host:</span>
                <span className="font-mono text-white font-bold">{systemInfo?.database?.host || 'localhost:3306'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Name:</span>
                <span className="font-mono text-white font-bold">{systemInfo?.database?.name || 'roadguard_tn'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Connection State:</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active Connected
                </span>
              </div>
            </div>
          </div>

          {/* AI Engines Status */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-purple-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span className="uppercase text-[11px] tracking-wider">AI Service Engines</span>
            </div>

            <div className="space-y-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Predictive Risk Model</div>
                <div className="font-semibold text-white mt-0.5">{systemInfo?.ai_engine?.xgboost_model}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Explainability Engine</div>
                <div className="font-semibold text-white mt-0.5">{systemInfo?.ai_engine?.shap_explainer}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Vision Pipeline</div>
                <div className="font-semibold text-white mt-0.5">{systemInfo?.ai_engine?.vision_pipeline}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Tracking Protocol</div>
                <div className="font-semibold text-emerald-400 mt-0.5">{systemInfo?.ai_engine?.tracking_engine}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

