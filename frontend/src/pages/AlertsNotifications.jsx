import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Bell,
  AlertTriangle,
  Siren,
  CheckCircle2,
  Send,
  Radio,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Flame
} from 'lucide-react';

export default function AlertsNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [unacknowledgedOnly, setUnacknowledgedOnly] = useState(false);
  const [dispatchModal, setDispatchModal] = useState({ open: false, alert: null });
  const [patrolUnit, setPatrolUnit] = useState('Traffic Quick Response Force (QRF) Highway Unit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [selectedLevel, unacknowledgedOnly]);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (selectedLevel !== 'All') params.alert_level = selectedLevel;
      if (unacknowledgedOnly) params.unacknowledged_only = true;
      const data = await api.getAlerts(params);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.actionAlert(alertId, 'acknowledge');
      loadAlerts();
    } catch (err) {
      alert('Acknowledge failed: ' + err.message);
    }
  };

  const handleDispatchConfirm = async () => {
    if (!dispatchModal.alert) return;
    setSubmitting(true);
    try {
      await api.actionAlert(dispatchModal.alert.id, 'dispatch', patrolUnit);
      setDispatchModal({ open: false, alert: null });
      loadAlerts();
    } catch (err) {
      alert('Dispatch failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statewide Critical Incident & Alerts Dispatch Center"
        subtitle="Real-time multi-agency notifications triggered by AI video analytics, weather radars, and patrol reports"
        badge="REAL-TIME BROADCAST"
      />

      {/* Filter Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Severity Filter:</span>
            {['All', 'Critical', 'High', 'Medium'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedLevel === lvl
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 pl-3 border-l border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={unacknowledgedOnly}
              onChange={(e) => setUnacknowledgedOnly(e.target.checked)}
              className="rounded bg-slate-800 text-blue-600 focus:ring-0"
            />
            <span className="text-slate-300">Show Unresolved Incidents Only</span>
          </label>
        </div>

        <button
          onClick={loadAlerts}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh Feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition shadow-lg text-xs ${
              !alert.is_acknowledged
                ? 'bg-slate-900/90 border-rose-500/40 shadow-rose-950/20'
                : 'bg-[#0f172a] border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    alert.alert_level === 'Critical'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                      : alert.alert_level === 'High'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-blue-500/20 text-cyan-400 border-blue-500/40'
                  }`}
                >
                  {alert.alert_level === 'Critical' ? (
                    <Flame className="w-5 h-5" />
                  ) : (
                    <Siren className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={alert.alert_level} size="xs" />
                    <span className="text-cyan-400 font-semibold">{alert.district_name}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{alert.source}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">{alert.title}</h3>
                  <p className="text-slate-300 mt-1 leading-relaxed">{alert.message}</p>

                  {alert.dispatched_units && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Dispatched: {alert.dispatched_units}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 flex-shrink-0 mt-2 sm:mt-0">
                <span className="text-[10px] text-slate-500 font-mono">
                  {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Live'}
                </span>

                <div className="flex items-center space-x-2">
                  {!alert.is_acknowledged ? (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px] transition"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => setDispatchModal({ open: true, alert })}
                        className="flex items-center space-x-1 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-md shadow-rose-600/30 transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch QRF Patrol</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-xs flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Modal */}
      {dispatchModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
              <Siren className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>Dispatch Emergency Road Safety Patrol</span>
            </h3>

            <div className="mt-3 text-slate-300">
              Incident: <strong className="text-white">{dispatchModal.alert?.title}</strong>
            </div>

            <div className="mt-4">
              <label className="block text-slate-400 font-semibold mb-1">Select Response Unit / Agency</label>
              <select
                value={patrolUnit}
                onChange={(e) => setPatrolUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="Traffic Quick Response Force (QRF) Highway Unit">
                  Traffic Police Quick Reaction Patrol Unit (QRF)
                </option>
                <option value="Highways Incident Management Emergency Van">
                  NHAI / State Highway Incident Recovery Van
                </option>
                <option value="Municipal Drainage & Recovery Crew">
                  City Corporation Drainage & Hazard Clearance Crew
                </option>
                <option value="108 Emergency Medical & Ambulance Unit">
                  108 Emergency Medical Services Support
                </option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDispatchModal({ open: false, alert: null })}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDispatchConfirm}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30"
              >
                {submitting ? 'Transmitting Alert...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

