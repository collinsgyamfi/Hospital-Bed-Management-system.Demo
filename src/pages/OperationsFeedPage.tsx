import React, { useState } from 'react';
import {
  Activity,
  Filter,
  Search,
  AlertTriangle,
  Building,
  User,
  Plus,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { OperationalEvent } from '../types/hospital.ts';

interface OperationsFeedPageProps {
  onReportWardClick: () => void;
}

export const OperationsFeedPage: React.FC<OperationsFeedPageProps> = ({ onReportWardClick }) => {
  const { feedEvents, wardSummaries, globalSearch } = useHospital();
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = feedEvents.filter((e) => {
    if (eventTypeFilter !== 'ALL' && e.eventType !== eventTypeFilter) return false;
    if (wardFilter !== 'ALL' && e.wardId !== wardFilter) return false;
    if (priorityFilter !== 'ALL' && e.priority !== priorityFilter) return false;
    if (effectiveSearch) {
      const match =
        e.title.toLowerCase().includes(effectiveSearch) ||
        e.description.toLowerCase().includes(effectiveSearch) ||
        e.wardName.toLowerCase().includes(effectiveSearch) ||
        e.staffName.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Hospital Operations Activity Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            "What's Happening Across the Hospital" — Live inter-ward communication and event stream
          </p>
        </div>

        <button
          onClick={onReportWardClick}
          className="flex items-center gap-1.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast Ward Update</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, patients, staff, descriptions..."
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
          <option value="ADMISSION">Admissions</option>
          <option value="DISCHARGE">Discharges</option>
          <option value="TRANSFER">Transfers</option>
          <option value="BED_STATUS">Bed Changes</option>
          <option value="BED_REQUEST">Bed Requests</option>
          <option value="CLEANING">Cleaning & Readiness</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="CAPACITY_WARNING">Capacity Warnings</option>
          <option value="WARD_UPDATE">Ward Reports</option>
        </select>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Wards</option>
          {wardSummaries.map((w) => (
            <option key={w.wardId} value={w.wardId}>
              {w.wardName} ({w.wardCode})
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Priorities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Feed Stream */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No events match the selected filter criteria.
          </div>
        ) : (
          filtered.map((evt) => {
            const priorityColors = {
              CRITICAL: 'border-l-4 border-l-rose-500 bg-rose-950/20 border-slate-800',
              URGENT: 'border-l-4 border-l-amber-500 bg-amber-950/20 border-slate-800',
              WARNING: 'border-l-4 border-l-orange-500 bg-orange-950/20 border-slate-800',
              INFO: 'border-l-4 border-l-cyan-500 bg-slate-900 border-slate-800',
            }[evt.priority];

            return (
              <div
                key={evt.id}
                className={`p-4 rounded-xl border ${priorityColors} flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs shadow-md`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{evt.title}</span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-semibold">
                      {evt.wardName}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                      {evt.eventType}
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed text-xs">{evt.description}</p>

                  {evt.actionRequired && (
                    <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-[11px] font-medium">
                      Operational Action Required: {evt.actionRequired}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{evt.staffName}</span>
                    </span>
                    <span>·</span>
                    <span>{new Date(evt.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold">{evt.status}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                      evt.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : evt.priority === 'URGENT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {evt.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
