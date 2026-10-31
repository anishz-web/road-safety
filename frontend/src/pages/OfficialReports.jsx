import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  FileText,
  Printer,
  Download,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function OfficialReports() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [reportType, setReportType] = useState('blackspot_audit');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(console.error);
    generateReport();
  }, []);

  const generateReport = async (dist = selectedDistrict, type = reportType) => {
    setLoading(true);
    try {
      const params = { report_type: type };
      if (dist) params.district_id = dist;
      const data = await api.generateReport(params);
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData?.high_risk_corridors) return;
    const headers = ['Road Code', 'Corridor Name', 'District', 'Road Type', 'Risk Score', 'Risk Level', 'Speed Limit'];
    const rows = reportData.high_risk_corridors.map((r) => [
      `"${r.road_code}"`,
      `"${r.road_name}"`,
      `"${r.district}"`,
      `"${r.road_type}"`,
      r.risk_score,
      `"${r.risk_level}"`,
      r.speed_limit
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TN_Road_Safety_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const meta = reportData?.report_metadata || {};
  const summary = reportData?.executive_summary || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Road Safety Gazette & Audit Reports"
        subtitle="Government-formatted compliance audit report, blackspot prioritization, and certified civil interventions summary"
        badge="OFFICIAL STATE RECORD"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        }
      />

      {/* Control Selector */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">District Scope:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                generateReport(e.target.value, reportType);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Statewide (All Districts)</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <span className="text-slate-400">Report Focus:</span>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                generateReport(selectedDistrict, e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
            >
              <option value="blackspot_audit">Quarterly Blackspot Audit & Risk Forecast</option>
              <option value="intervention_progress">Civil Engineering Interventions Status</option>
              <option value="statewide_compliance">Annual Road Safety Authority Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Official Government Document Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-200 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Official Header */}
        <div className="text-center pb-6 border-b-2 border-slate-700 print:border-black">
          <div className="text-xs uppercase tracking-widest font-black text-cyan-400 print:text-blue-900">
            {meta.title}
          </div>
          <h2 className="text-lg font-extrabold text-white print:text-black mt-1">
            {meta.subtitle}
          </h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 print:text-gray-600 font-mono">
            <span>Ref No: {meta.reference_no}</span>
            <span>•</span>
            <span>Date: {meta.generated_at}</span>
            <span>•</span>
            <span className="font-bold text-amber-400 print:text-red-700">{meta.status}</span>
          </div>
        </div>

        {/* Executive Summary Metrics Box */}
        <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:bg-gray-100 print:border-gray-300">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 print:text-blue-900 mb-3">
            Executive Summary & Key Performance Indicators
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Audited Corridors</span>
              <span className="text-xl font-black text-white print:text-black">{summary.total_corridors_audited}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Critical Blackspots</span>
              <span className="text-xl font-black text-rose-400 print:text-red-600">{summary.critical_blackspots_identified}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Completed Treatments</span>
              <span className="text-xl font-black text-emerald-400 print:text-green-700">{summary.completed_treatments}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Mean Crash Drop</span>
              <span className="text-xl font-black text-cyan-400 print:text-blue-800">{summary.average_crash_reduction_observed}</span>
            </div>
          </div>
        </div>

        {/* High Risk Corridors Section Table */}
        <div className="my-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
            1. Identified Critical & High Risk Blackspot Corridors
          </h4>
          <div className="overflow-x-auto border border-slate-800 print:border-gray-300 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 print:bg-gray-200 print:text-black uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Corridor Name</th>
                  <th className="p-2.5">District</th>
                  <th className="p-2.5">Classification</th>
                  <th className="p-2.5">Risk Score</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Speed Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {(reportData?.high_risk_corridors || []).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono text-cyan-400 print:text-black font-semibold">{r.road_code}</td>
                    <td className="p-2.5 font-bold text-white print:text-black">{r.road_name}</td>
                    <td className="p-2.5 text-slate-300 print:text-black">{r.district}</td>
                    <td className="p-2.5 text-slate-400 print:text-black">{r.road_type}</td>
                    <td className="p-2.5 font-bold text-rose-400 print:text-black">{r.risk_score}</td>
                    <td className="p-2.5">
                      <StatusBadge status={r.risk_level} size="xs" />
                    </td>
                    <td className="p-2.5 text-slate-300 print:text-black">{r.speed_limit} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verified Interventions Section */}
        <div className="my-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
            2. Verified Engineering Interventions & Post-Audit Metrics
          </h4>
          <div className="overflow-x-auto border border-slate-800 print:border-gray-300 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 print:bg-gray-200 print:text-black uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Work Order</th>
                  <th className="p-2.5">Corridor</th>
                  <th className="p-2.5">Audit Window</th>
                  <th className="p-2.5">Speed Before/After</th>
                  <th className="p-2.5">Conflicts Before/After</th>
                  <th className="p-2.5">Crash Drop %</th>
                  <th className="p-2.5">Certified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {(reportData?.verified_interventions || []).map((m, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-mono text-cyan-400 print:text-black">{m.wo_no}</td>
                    <td className="p-2.5 font-bold text-white print:text-black">{m.road}</td>
                    <td className="p-2.5 text-slate-300 print:text-black">{m.window}</td>
                    <td className="p-2.5 text-slate-300 print:text-black">
                      {m.speed_before} → <strong>{m.speed_after} km/h</strong>
                    </td>
                    <td className="p-2.5 text-slate-300 print:text-black">
                      {m.conflicts_before} → <strong>{m.conflicts_after} /day</strong>
                    </td>
                    <td className="p-2.5 font-bold text-emerald-400 print:text-green-700">
                      ↓ {m.crash_reduction_pct}%
                    </td>
                    <td className="p-2.5 text-[11px] text-slate-400 print:text-black">{m.certified_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="mt-12 pt-6 border-t-2 border-slate-700 print:border-black grid grid-cols-3 gap-6 text-center text-xs">
          {(reportData?.signatories || []).map((sig, i) => (
            <div key={i} className="space-y-1">
              <div className="font-bold text-white print:text-black">{sig.name}</div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">{sig.title}</div>
              <div className="text-[9px] text-cyan-400 print:text-blue-900 font-mono mt-1">Digitally Signed ✓</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

