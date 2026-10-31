import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  Camera,
  MapPin,
  Clock,
  Layers,
  Check,
  RefreshCw
} from 'lucide-react';

const HAZARD_TYPES = [
  'Pothole / Road Surface Cratering',
  'Illegal Shoulder Parking / Encroachment',
  'Missing / Faded Road Markings',
  'Damaged Median / Missing Guardrail',
  'Waterlogging / Drainage Failure',
  'Malfunctioning Traffic Signal',
  'Blind Curve Visibility Obstruction'
];

export default function HazardDetection() {
  const [hazards, setHazards] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [roads, setRoads] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form State
  const [roadLocationId, setRoadLocationId] = useState('');
  const [hazardType, setHazardType] = useState(HAZARD_TYPES[0]);
  const [severity, setSeverity] = useState('Major');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    api.getDistricts().then(setDistricts).catch(console.error);
    api.getRoads().then((data) => {
      setRoads(data);
      if (data.length > 0) setRoadLocationId(data[0].id);
    }).catch(console.error);
  }, []);

  const loadData = async () => {
    try {
      const params = {};
      if (selectedSeverity !== 'All') params.severity = selectedSeverity;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      const data = await api.getHazards(params);
      setHazards(data);
    } catch (err) {
      console.error('Failed to load hazards:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSeverity, selectedStatus]);

  const handleStatusUpdate = async (hazardId, newStatus) => {
    try {
      await api.updateHazardStatus(hazardId, newStatus);
      loadData();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('road_location_id', roadLocationId);
    formData.append('hazard_type', hazardType);
    formData.append('severity', severity);
    if (file) formData.append('file', file);

    try {
      await api.reportHazard(formData);
      setReportModalOpen(false);
      setFile(null);
      loadData();
    } catch (err) {
      alert('Reporting failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Road Surface Hazard & Defect Management"
        subtitle="AI-detected pavement cratering, structural obstructions, waterlogging, and repair verification lifecycle"
        actions={
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Report Road Defect</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Severity:</span>
            {['All', 'Critical', 'Major', 'Minor'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
            <span>Status:</span>
            {['All', 'Detected', 'Engineer Verified', 'Assigned', 'In Progress', 'Repaired'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hazards Catalog Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Corridor & Location</th>
                <th className="py-3 px-4">Hazard Classification</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4 text-right">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {hazards.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{h.road_name || `Location #${h.road_location_id}`}</div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{h.latitude ? `${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}` : 'Geotagged'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{h.hazard_type}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={h.severity} size="xs" />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                    {Math.round(h.ai_confidence * 100)}%
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={h.status} size="xs" />
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400">
                    {h.reported_by}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {h.status !== 'Repaired' && (
                      <button
                        onClick={() => handleStatusUpdate(h.id, 'Repaired')}
                        className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition"
                      >
                        Mark Repaired
                      </button>
                    )}
                    {h.status === 'Detected' && (
                      <button
                        onClick={() => handleStatusUpdate(h.id, 'Engineer Verified')}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/30 font-semibold text-[11px] transition"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Defect Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Report Road Defect & Dispatch Field Verification
            </h3>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Road Corridor</label>
                <select
                  value={roadLocationId}
                  onChange={(e) => setRoadLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                >
                  {roads.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.road_name} ({r.district_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Hazard Classification</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {HAZARD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Severity Rating</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Critical">Critical (Immediate Hazard)</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Photographic Evidence</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white cursor-pointer bg-slate-900 border border-slate-800 rounded-lg p-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Registering Defect...' : 'Submit Defect Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

