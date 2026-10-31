import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Camera,
  Play,
  Pause,
  UploadCloud,
  Radio,
  Sliders,
  ShieldAlert,
  Car,
  User,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Maximize2
} from 'lucide-react';

export default function CameraMonitoring() {
  const [cameras, setCameras] = useState([]);
  const [selectedCam, setSelectedCam] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const data = await api.getCameras();
      setCameras(data);
      if (data.length > 0 && !selectedCam) {
        selectCamera(data[0]);
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  };

  const selectCamera = async (cam) => {
    setSelectedCam(cam);
    try {
      const tel = await api.getCameraTelemetry(cam.id);
      setTelemetry(tel);
    } catch (err) {
      console.error('Failed to load camera telemetry:', err);
    }
  };

  // Poll live telemetry periodically
  useEffect(() => {
    if (!selectedCam) return;
    const interval = setInterval(async () => {
      try {
        const tel = await api.getCameraTelemetry(selectedCam.id);
        setTelemetry(tel);
      } catch (err) {
        // silent fallback
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedCam]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('camera_id', selectedCam ? selectedCam.id : 1);

    try {
      const res = await api.uploadMediaAnalysis(formData);
      setAnalysisResult(res);
    } catch (err) {
      alert('Upload inspection failed: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Vision & Traffic Video Analytics"
        subtitle="Real-time vehicle counting, pedestrian tracking, anonymous ByteTrack IDs, and speed compliance monitoring"
        actions={
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Image / Video for AI Inspection</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Camera Player Stream Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Stream Player Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-extrabold text-white">{selectedCam?.camera_code || 'CAM-CHE-001'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-400 font-medium">{selectedCam?.model_name || 'Hikvision DarkFighter AI'}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span className="text-[11px] font-mono">{telemetry?.fps || 30} FPS</span>
                <span className="text-[11px] font-mono">{selectedCam?.resolution || '3840x2160'}</span>
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                    showOverlay
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  AI Overlay: {showOverlay ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative aspect-video bg-[#070b14] flex items-center justify-center overflow-hidden group select-none">
              {/* Synthetic Road Camera Scene Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 opacity-90" />

              {/* Perspective Road Markings */}
              <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-40">
                <div className="w-96 h-full border-x-4 border-dashed border-amber-400/40 transform -skew-x-12" />
                <div className="w-96 h-full border-x-4 border-dashed border-amber-400/40 transform skew-x-12" />
              </div>

              {/* Active Detection Bounding Boxes Overlay */}
              {showOverlay && telemetry?.vehicles && (
                <div className="absolute inset-0 p-6 pointer-events-none">
                  {/* Vehicle Bounding Box 1 */}
                  <div className="absolute top-[28%] left-[22%] w-48 h-28 border-2 border-blue-500 rounded bg-blue-500/10 shadow-lg shadow-blue-500/20">
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded">
                      #TN-V-1029 | Car | 54.2 km/h
                    </div>
                  </div>

                  {/* Vehicle Bounding Box 2 (Speeding Alert) */}
                  <div className="absolute top-[42%] right-[25%] w-56 h-36 border-2 border-rose-500 rounded bg-rose-500/15 animate-pulse">
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-rose-600 text-[10px] font-bold text-white rounded flex items-center space-x-1">
                      <span>! SPEEDING</span>
                      <span>#TN-V-1034 | 74.8 km/h</span>
                    </div>
                  </div>

                  {/* Pedestrian Bounding Box */}
                  <div className="absolute bottom-[20%] left-[45%] w-14 h-28 border-2 border-purple-500 rounded bg-purple-500/15">
                    <div className="absolute -top-5 left-0 px-1 py-0.5 bg-purple-600 text-[9px] font-bold text-white rounded">
                      #TN-P-0442
                    </div>
                  </div>

                  {/* Near Miss Warning Box */}
                  {telemetry.safety_alerts?.length > 0 && (
                    <div className="absolute top-4 right-4 p-2.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs shadow-xl flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                      <div>
                        <div className="font-bold text-white">Surrogate Near-Miss Brake Event</div>
                        <div className="text-[10px] text-rose-300">TTC: 1.2s • Deceleration: 6.2 m/s²</div>
                      </div>
                    </div>
                  )}

                  {/* Privacy Protocol Watermark */}
                  <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono flex items-center space-x-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>ByteTrack Anonymous Pipeline • Zero PII / Facial Recognition Disabled</span>
                  </div>
                </div>
              )}

              {/* Feed Status Display */}
              <div className="z-10 text-center pointer-events-none">
                <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                  Tamil Nadu Safe Corridor Optical Stream
                </div>
                <div className="text-white font-bold text-sm mt-1">{selectedCam?.camera_code} Live Telemetry</div>
              </div>
            </div>

            {/* Bottom Stream Metrics Bar */}
            <div className="p-4 bg-slate-900/70 border-t border-slate-800 grid grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Tracks</span>
                <div className="font-extrabold text-white text-base mt-0.5">{telemetry?.active_tracks_count || 7}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Traffic Density</span>
                <div className="font-extrabold text-cyan-400 text-base mt-0.5">{telemetry?.traffic_density_pcu || 185} PCU</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pedestrians in Zone</span>
                <div className="font-extrabold text-purple-400 text-base mt-0.5">{telemetry?.pedestrians_in_zone || 4}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Detection Status</span>
                <div className="font-extrabold text-emerald-400 text-base mt-0.5">Optimal (98%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera List & Live Telemetry Inspector */}
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Installed Highway Vision Feeds</span>
              <span className="text-xs text-slate-400 font-normal">{cameras.length} Active Feeds</span>
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {cameras.map((cam) => {
                const isSelected = selectedCam?.id === cam.id;
                return (
                  <div
                    key={cam.id}
                    onClick={() => selectCamera(cam)}
                    className={`p-3 rounded-lg border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-blue-600/20 border-cyan-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{cam.camera_code}</span>
                      </div>
                      <StatusBadge status={cam.status} size="xs" />
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 truncate">{cam.model_name}</div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>IP: {cam.ip_address}</span>
                      <span className="font-semibold text-cyan-400">{cam.camera_type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Inspection Media Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">YOLO + OpenCV Road Inspection Tool</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Road Footage (Image / Video Clip)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-900 border border-slate-800 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md flex items-center justify-center space-x-2"
              >
                {uploadLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running YOLO Object Detection & OpenCV Pipeline...</span>
                  </>
                ) : (
                  <span>Execute AI Detection & Hazard Extraction</span>
                )}
              </button>
            </form>

            {/* Analysis Results View */}
            {analysisResult && (
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-4">
                <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>AI Inference Complete • {analysisResult.metrics?.processing_time_ms} ms</span>
                </div>

                {/* Annotated Output Preview */}
                {analysisResult.annotated_preview_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={analysisResult.annotated_preview_url}
                      alt="Annotated Inspection"
                      className="w-full object-cover max-h-72"
                    />
                  </div>
                )}

                {/* Extracted Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Total Vehicles</span>
                    <div className="text-base font-bold text-white">{analysisResult.metrics?.total_vehicles}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Pedestrians Tracked</span>
                    <div className="text-base font-bold text-purple-400">{analysisResult.metrics?.total_pedestrians}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Hazards Tagged</span>
                    <div className="text-base font-bold text-rose-400">{analysisResult.metrics?.hazards_detected?.length || 0}</div>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
                  {analysisResult.metrics?.tracking_protocol}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

