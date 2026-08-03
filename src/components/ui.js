import { Download } from 'lucide-react';
import React from 'react';

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-sm">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-brand-faint text-brand border-brand/20',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.inactive;
  // "accepted" is the platform value for the PRD's "active" connection state
  const label = status === 'accepted' ? 'active (accepted)' : status;
  return (
    <span className={`inline-block text-xs font-medium border rounded-full px-2.5 py-0.5 ${style}`}>
      {label}
    </span>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            {headers.map((h) => (
              <th key={h} className="py-2.5 pr-4 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function ExportButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-light"
    >
      <Download size={14} /> Export CSV
    </button>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`bg-brand text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-brand-light disabled:opacity-60 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function DateRangePicker({ days, setDays }) {
  return (
    <div className="flex gap-1">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
            days === d
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-gray-600 border-gray-300 hover:border-brand'
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
      {error}
    </p>
  );
}

export function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}
