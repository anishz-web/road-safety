import React from 'react';

export default function PageHeader({ title, subtitle, badge = 'STATE DEMO DATA', actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800 mb-6 gap-4">
      <div>
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
}

