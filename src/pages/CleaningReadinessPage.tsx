import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { CleaningTask } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const CleaningReadinessPage: React.FC = () => {
  const { globalSearch, addToast, refreshData } = useHospital();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = () => {
    api.getCleaningTasks().then(setTasks);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (effectiveSearch) {
      const match =
        t.bedNumber.toLowerCase().includes(effectiveSearch) ||
        t.wardName.toLowerCase().includes(effectiveSearch) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(effectiveSearch));
      if (!match) return false;
    }
    return true;
  });

  const handleUpdateStatus = async (taskId: string, newStatus: CleaningTask['status']) => {
    try {
      await api.updateCleaningStatus(taskId, newStatus, undefined, currentUser);
      addToast('success', 'Cleaning Updated', `Task moved to ${newStatus}.`);
      fetchTasks();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Bed Cleaning & Readiness Command</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Terminal disinfection, inspection sign-off, and rapid bed turnaround workflows
          </p>
        </div>

        {/* Turnaround KPI Card */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Avg Turnaround:</span>
          <span className="text-emerald-400 font-bold">36 min</span>
          <span className="text-slate-500">(Target: &le; 45m)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed, ward, assigned staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Readiness States</option>
          <option value="PENDING">PENDING (Awaiting Sanitizer)</option>
          <option value="IN_PROGRESS">IN PROGRESS (Disinfecting)</option>
          <option value="COMPLETED">COMPLETED (Awaiting Inspection)</option>
          <option value="INSPECTED">INSPECTED (Certified & Ready)</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bed & Task ID</th>
                <th className="py-3 px-4">Ward / Area</th>
                <th className="py-3 px-4 text-center">Protocol Priority</th>
                <th className="py-3 px-4 text-center">Cleaning Status</th>
                <th className="py-3 px-4">Assigned Sanitation Staff</th>
                <th className="py-3 px-4">Notes & Inspection Sign-off</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{task.bedNumber}</div>
                    <div className="font-mono text-[10px] text-cyan-400">{task.id} · {task.bedId}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {task.wardName}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        task.priority === 'POST_INFECTION'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : task.priority === 'URGENT'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {task.priority.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        task.status === 'INSPECTED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : task.status === 'COMPLETED'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 animate-pulse'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-200">{task.assignedTo || 'Unassigned (General Pool)'}</span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-2">
                      {task.notes || 'Terminal disinfection'}
                    </p>
                    {task.inspectedBy && (
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Inspected by: {task.inspectedBy}</span>
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {task.status === 'PENDING' ? (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Start Cleaning
                      </button>
                    ) : task.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Mark Completed
                      </button>
                    ) : task.status === 'COMPLETED' ? (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'INSPECTED')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Inspect & Release Bed
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Bed Available</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
