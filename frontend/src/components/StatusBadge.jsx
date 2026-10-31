import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
  const s = String(status || '').trim();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'Critical' || s === 'Severe Gridlock' || s === 'Urgent P1' || s === 'Severe Warning') {
    styles = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
  } else if (s === 'High' || s === 'Dense' || s === 'High P2' || s === 'Advisory' || s === 'Major') {
    styles = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (s === 'Medium' || s === 'Moderate' || s === 'Medium P3' || s === 'Minor') {
    styles = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  } else if (s === 'Low' || s === 'Fluid' || s === 'Routine P4' || s === 'Normal' || s === 'Repaired' || s === 'Closed') {
    styles = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (s === 'Online' || s === 'Approved' || s === 'Completed') {
    styles = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  } else if (s === 'In Progress' || s === 'Work Assignment' || s === 'Implementation' || s === 'Verification') {
    styles = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  } else if (s === 'Pending Approval' || s === 'Field Review Requested') {
    styles = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }

  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses} ${styles}`}>
      {s}
    </span>
  );
}

