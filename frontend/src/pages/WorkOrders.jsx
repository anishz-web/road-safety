import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Upload,
  ArrowRight,
  Filter,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const WORKFLOW_STAGES = [
  'AI Detection',
  'Recommendation',
  'Engineer Verification',
  'Department Approval',
  'Work Assignment',
  'Implementation',
  'Evidence Upload',
  'Verification',
  'Before/After Evaluation'
];

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedWO, setSelectedWO] = useState(null);
  const [advanceModal, setAdvanceModal] = useState({ open: false, wo: null });
  const [newStage, setNewStage] = useState('');
  const [progressPct, setProgressPct] = useState(50);
  const [notes, setNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkOrders();
  }, [selectedStage, selectedDept]);

  const loadWorkOrders = async () => {
    try {
      const params = {};
      if (selectedStage !== 'All') params.stage = selectedStage;
      if (selectedDept !== 'All') params.department = selectedDept;
      const data = await api.getWorkOrders(params);
      setWorkOrders(data);
      if (data.length > 0 && !selectedWO) {
        setSelectedWO(data[0]);
      }
    } catch (err) {
      console.error('Failed to load work orders:', err);
    }
  };

  const openAdvanceModal = (wo) => {
    const currentIdx = WORKFLOW_STAGES.indexOf(wo.current_stage);
    const next = currentIdx < WORKFLOW_STAGES.length - 1 ? WORKFLOW_STAGES[currentIdx + 1] : wo.current_stage;
    setNewStage(next);
    setProgressPct(Math.min(wo.progress_percentage + 20, 100));
    setNotes(wo.verification_notes || '');
    setAdvanceModal({ open: true, wo });
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!advanceModal.wo) return;
    setSubmitting(true);
    try {
      await api.advanceWorkOrderStage(advanceModal.wo.id, {
        stage: newStage,
        progress_percentage: parseInt(progressPct, 10),
        verification_notes: notes
      });
      setAdvanceModal({ open: false, wo: null });
      loadWorkOrders();
    } catch (err) {
      alert('Failed to advance work order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceUpload = async (woId, type) => {
    if (!evidenceFile) return;
    const formData = new FormData();
    formData.append('file', evidenceFile);
    formData.append('evidence_type', type);

    try {
      await api.uploadWorkOrderEvidence(woId, formData);
      alert('Photographic evidence uploaded successfully');
      setEvidenceFile(null);
      loadWorkOrders();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering Intervention Work Orders"
        subtitle="Tamil Nadu 9-Stage Government Engineering Workflow: AI Detection → Implementation → Before/After Evaluation"
        badge="GOVERNMENT AUDIT TRAIL"
      />

      {/* 9-Stage Progress Pipeline Indicator */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg overflow-x-auto scrollbar-none">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Statewide Engineering Intervention Lifecycle Pipeline
        </div>
        <div className="flex items-center space-x-2 min-w-[850px]">
          {WORKFLOW_STAGES.map((stg, i) => (
            <React.Fragment key={stg}>
              <div
                className={`flex-1 p-2 rounded-lg text-center text-[10px] font-semibold border transition ${
                  selectedWO?.current_stage === stg
                    ? 'bg-blue-600/30 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[9px] opacity-60">Stage 0{i + 1}</div>
                <div className="truncate mt-0.5">{stg}</div>
              </div>
              {i < WORKFLOW_STAGES.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
            >
              <option value="All">All Departments</option>
              <option value="Highways Department / NHAI">Highways Dept / NHAI</option>
              <option value="Traffic Police Department">Traffic Police Department</option>
              <option value="Municipal Corporation">Municipal Corporation</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <span className="text-slate-400">Filter Stage:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
            >
              <option value="All">All Stages</option>
              {WORKFLOW_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders List & Selected Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-7 space-y-3">
          {workOrders.map((wo) => {
            const isSelected = selectedWO?.id === wo.id;
            return (
              <div
                key={wo.id}
                onClick={() => setSelectedWO(wo)}
                className={`p-4 rounded-xl border transition cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-blue-600/15 border-cyan-500/50 shadow-lg shadow-blue-900/30'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-cyan-400 text-xs">{wo.work_order_no}</span>
                      <StatusBadge status={wo.status} size="xs" />
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1">{wo.title}</h4>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {wo.department} • {wo.assigned_division}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {wo.current_stage}
                    </span>
                    <div className="font-extrabold text-white text-sm mt-2">
                      ₹{wo.sanctioned_budget_inr ? (wo.sanctioned_budget_inr / 100000).toFixed(1) : 0} Lakhs
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Implementation Milestone</span>
                    <span className="font-bold text-white">{wo.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${wo.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Target Date: {wo.target_completion_date}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openAdvanceModal(wo);
                    }}
                    className="text-cyan-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <span>Advance Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Inspector Drawer */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Work Order Engineering Dossier</h3>
            <span className="text-cyan-400 font-mono font-bold">{selectedWO?.work_order_no}</span>
          </div>

          {selectedWO ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Sanction Details</span>
                <div className="mt-1 space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sanction Order No:</span>
                    <span className="font-mono text-white font-semibold">{selectedWO.sanction_order_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Agency:</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[200px]">{selectedWO.assigned_contractor_agency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sanctioned Budget:</span>
                    <span className="text-emerald-400 font-bold">₹{selectedWO.sanctioned_budget_inr?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Verification Notes</span>
                <div className="mt-1 p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedWO.verification_notes || 'No engineering notes recorded yet.'}
                </div>
              </div>

              {/* Before and After Photographic Evidence */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Photographic Evidence</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Before Implementation</span>
                    {selectedWO.before_photo_url ? (
                      <div className="aspect-video bg-slate-950 rounded flex items-center justify-center text-[10px] text-cyan-400 font-mono border border-slate-800">
                        Evidence Recorded ✓
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-950/60 rounded flex items-center justify-center text-[10px] text-slate-500">
                        Pending Upload
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">After Verification</span>
                    {selectedWO.after_photo_url ? (
                      <div className="aspect-video bg-slate-950 rounded flex items-center justify-center text-[10px] text-emerald-400 font-mono border border-slate-800">
                        Evidence Verified ✓
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-950/60 rounded flex items-center justify-center text-[10px] text-slate-500">
                        Pending Upload
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Upload Input */}
                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Upload Field Audit Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                    className="w-full text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white cursor-pointer bg-slate-900 border border-slate-800 rounded-lg p-1"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => handleEvidenceUpload(selectedWO.id, 'before')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700"
                    >
                      Save as 'Before'
                    </button>
                    <button
                      onClick={() => handleEvidenceUpload(selectedWO.id, 'after')}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold"
                    >
                      Save as 'After'
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openAdvanceModal(selectedWO)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2"
              >
                <span>Advance Workflow Stage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Select a work order from the list</div>
          )}
        </div>
      </div>

      {/* Advance Stage Modal */}
      {advanceModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Advance Government Workflow Stage
            </h3>

            <form onSubmit={handleAdvanceSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Engineering Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {WORKFLOW_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Completion Milestone %</span>
                  <span className="font-bold text-cyan-400">{progressPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPct}
                  onChange={(e) => setProgressPct(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Verification / Quality Inspection Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter quality inspection certificate details, field engineer sign-off..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModal({ open: false, wo: null })}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Updating...' : 'Authorize Stage Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

