import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { MaintenanceTask, Bed } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const MaintenancePage: React.FC = () => {
  const { globalSearch, addToast, refreshData } = useHospital();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  // Form states
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [issueCategory, setIssueCategory] = useState<MaintenanceTask['issueCategory']>('Mechanical Frame');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [loading, setLoading] = useState(false);

  const fetchTasks = () => {
    api.getMaintenanceTasks().then(setTasks);
    api.getBeds().then(setBeds);
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
        t.issueCategory.toLowerCase().includes(effectiveSearch) ||
        t.description.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !description.trim()) {
      addToast('error', 'Validation Error', 'Please select a bed and provide an issue description.');
      return;
    }

    try {
      setLoading(true);
      await api.reportMaintenance(
        {
          bedId: selectedBedId,
          issueCategory,
          description: description.trim(),
          priority,
        },
        currentUser
      );

      addToast('warning', 'Bed Out of Service', 'Maintenance hold created; bed set to OUT_OF_SERVICE.');
      setShowReportModal(false);
      setDescription('');
      fetchTasks();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToService = async (taskId: string) => {
    const resolution = prompt('Enter repair verification details (e.g. Replaced actuator gear; tested with 150kg load):');
    if (!resolution) return;

    try {
      await api.updateMaintenanceStatus(
        taskId,
        'RETURNED_TO_SERVICE',
        currentUser.fullName,
        resolution,
        currentUser
      );
      addToast('success', 'Repaired', 'Bed returned to clinical service.');
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
            <Wrench className="w-5 h-5 text-rose-400" />
            <span>Biomedical Maintenance & Out-of-Service Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking damaged frames, motors, and mattress integrity before releasing beds back to patients
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Defective Bed (Mark OOS)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed, ward, category, defect description..."
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
          <option value="ALL">All Maintenance Statuses</option>
          <option value="REPORTED">REPORTED (Awaiting Technician)</option>
          <option value="IN_PROGRESS">IN PROGRESS (Under Repair)</option>
          <option value="RETURNED_TO_SERVICE">RETURNED TO SERVICE</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bed & Work Order</th>
                <th className="py-3 px-4">Ward / Location</th>
                <th className="py-3 px-4">Fault Category</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Defect Summary & Repair Log</th>
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
                  <td className="py-3.5 px-4 font-medium text-amber-300">
                    {task.issueCategory}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        task.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : task.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        task.status === 'RETURNED_TO_SERVICE'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-200 leading-relaxed text-[11px]">
                      {task.description}
                    </p>
                    {task.resolutionSummary && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        Repair: {task.resolutionSummary} (Tech: {task.assignedTechnician})
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {task.status !== 'RETURNED_TO_SERVICE' ? (
                      <button
                        onClick={() => handleReturnToService(task.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Certify Repair & Return
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>In Service</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Defect Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 text-slate-100">
            <h3 className="text-sm font-bold text-white">Report Bed Defect (Take Out of Service)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Taking a bed out of service automatically removes it from the operational bed capacity until signed off by bio-engineering.
            </p>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Bed to Take Out of Service *</label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">-- Choose Bed --</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.id}) - Currently {b.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Issue Category *</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Mechanical Frame">Mechanical Frame</option>
                    <option value="Electrical / Motor">Electrical / Motor</option>
                    <option value="Mattress / Waterproofing">Mattress / Waterproofing</option>
                    <option value="Side Rails / Locks">Side Rails / Locks</option>
                    <option value="IV Pole Mount">IV Pole Mount</option>
                    <option value="Sanitation Defect">Sanitation Defect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Defect Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="CRITICAL">Critical (Immediate Hazard)</option>
                    <option value="HIGH">High (Prevents Usage)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Defect Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hydraulic elevation pump leaking fluid; bed unable to elevate headrest safely..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold"
                >
                  {loading ? 'Submitting...' : 'Mark Out of Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
