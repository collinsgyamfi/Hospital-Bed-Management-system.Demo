import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AuditLogItem } from '../types/hospital.ts';
import { useHospital } from '../context/HospitalContext.tsx';

export const AuditLogsPage: React.FC = () => {
  const { globalSearch } = useHospital();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.getAuditLogs().then(setLogs);
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = logs.filter((l) => {
    if (eventTypeFilter !== 'ALL' && l.eventType !== eventTypeFilter) return false;
    if (effectiveSearch) {
      const match =
        l.userName.toLowerCase().includes(effectiveSearch) ||
        l.eventType.toLowerCase().includes(effectiveSearch) ||
        l.entityId.toLowerCase().includes(effectiveSearch) ||
        (l.reason && l.reason.toLowerCase().includes(effectiveSearch));
      if (!match) return false;
    }
    return true;
  });

  const eventTypes = Array.from(new Set(logs.map((l) => l.eventType)));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Immutable Governance Audit Trail & Security Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident operational event history capturing before-and-after states for every sensitive hospital action
          </p>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          {logs.length} Recorded Audit Entries
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user, event type, ticket ID, clinical reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Event Types</option>
          {eventTypes.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Event ID & Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Affected Record</th>
                <th className="py-3 px-4">Reason / Clinical Context</th>
                <th className="py-3 px-4 text-center">Outcome</th>
                <th className="py-3 px-4 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-200">{log.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{log.userName}</div>
                        <span className="text-[10px] font-mono text-cyan-400">{log.userRole}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>{log.entityType}</div>
                        <div className="text-[10px] text-slate-400">{log.entityId}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-300 text-[11px] line-clamp-2">
                          {log.reason || 'None provided'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{log.outcome}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-auto">
                          <span>{isExpanded ? 'Hide Diff' : 'View Diff'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded JSON State Diff */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={7} className="p-4 border-t border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block mb-1 font-semibold">BEFORE STATE:</span>
                              <pre className="text-amber-200/90 text-[11px] overflow-x-auto whitespace-pre-wrap">
                                {log.beforeState ? JSON.stringify(log.beforeState, null, 2) : 'null (Created anew)'}
                              </pre>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block mb-1 font-semibold">AFTER STATE:</span>
                              <pre className="text-emerald-200/90 text-[11px] overflow-x-auto whitespace-pre-wrap">
                                {log.afterState ? JSON.stringify(log.afterState, null, 2) : 'null'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
