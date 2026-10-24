import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Users,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { BedRequest } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface BedRequestsPageProps {
  onRequestBedClick: () => void;
}

export const BedRequestsPage: React.FC<BedRequestsPageProps> = ({ onRequestBedClick }) => {
  const { globalSearch, addToast, refreshData } = useHospital();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<BedRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [allocateQty, setAllocateQty] = useState(1);
  const [allocationNotes, setAllocationNotes] = useState('');

  const fetchRequests = () => {
    api.getBedRequests().then(setRequests);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    if (effectiveSearch) {
      const match =
        r.requestingDepartment.toLowerCase().includes(effectiveSearch) ||
        (r.requestedWardName && r.requestedWardName.toLowerCase().includes(effectiveSearch)) ||
        r.reason.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const handleFulfillSubmit = async (reqId: string) => {
    try {
      await api.fulfillBedRequest(reqId, allocateQty, allocationNotes, currentUser);
      addToast('success', 'Allocation Updated', `Allocated ${allocateQty} bed(s) to request.`);
      setFulfillingId(null);
      setAllocationNotes('');
      fetchRequests();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const totalRequested = requests.reduce((sum, r) => sum + r.numberOfBeds, 0);
  const totalAllocated = requests.reduce((sum, r) => sum + (r.allocatedQuantity || 0), 0);
  const outstandingDemand = totalRequested - totalAllocated;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-purple-400" />
            <span>Inter-Ward Bed Requests & Surge Placement Demand</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centrally manage departmental bed shortage requests, partial allocations, and capacity escalations
          </p>
        </div>

        <button
          onClick={onRequestBedClick}
          className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Bed Placement Request</span>
        </button>
      </div>

      {/* Demand Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400">Total Inpatient Beds Requested</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{totalRequested} beds</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Across all registered requests</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-emerald-400">Allocated & Fulfilled</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{totalAllocated} beds</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Successfully placed in wards</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-rose-400">Outstanding Unfulfilled Demand</p>
          <p className="text-2xl font-bold text-rose-300 mt-1 font-mono">{outstandingDemand} beds</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting ward capacity / discharges</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search requesting department, destination ward, reason..."
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
          <option value="ALL">All Request Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="PARTIALLY_FULFILLED">PARTIALLY FULFILLED</option>
          <option value="FULFILLED">FULFILLED</option>
          <option value="UNDER_REVIEW">UNDER REVIEW</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Priorities</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="URGENT">Urgent</option>
          <option value="ROUTINE">Routine</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket & Origin</th>
                <th className="py-3 px-4">Destination Ward</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Requested Qty</th>
                <th className="py-3 px-4 text-center">Allocated Qty</th>
                <th className="py-3 px-4 text-center">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((req) => {
                const outstanding = req.numberOfBeds - (req.allocatedQuantity || 0);
                return (
                  <tr key={req.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{req.requestingDepartment}</div>
                      <div className="font-mono text-[10px] text-cyan-400">
                        {req.id} · {req.requestingStaff}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {req.requestedWardName || 'Any Available Ward'}
                      <div className="text-[10px] text-slate-400">{req.bedCategory}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          req.priority === 'EMERGENCY'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : req.priority === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {req.numberOfBeds}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {req.allocatedQuantity || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                      {outstanding}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          req.status === 'FULFILLED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : req.status === 'PARTIALLY_FULFILLED'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-200 leading-relaxed text-[11px] line-clamp-2">
                        {req.reason}
                      </p>
                      {req.resolutionNotes && (
                        <p className="text-[10px] text-cyan-300 mt-1">Note: {req.resolutionNotes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status !== 'FULFILLED' ? (
                        <button
                          onClick={() => {
                            setFulfillingId(req.id);
                            setAllocateQty(Math.min(1, outstanding));
                          }}
                          className="bg-cyan-700 hover:bg-cyan-600 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                        >
                          Allocate Beds
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Fulfilled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Drawer / Modal */}
      {fulfillingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-white">Allocate Capacity to Bed Request</h3>
            <p className="text-xs text-slate-400">
              Confirm human authorization before reallocating beds to the requesting department.
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Quantity of Beds to Allocate</label>
              <input
                type="number"
                min={1}
                max={5}
                value={allocateQty}
                onChange={(e) => setAllocateQty(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Resolution / Allocation Notes</label>
              <textarea
                rows={2}
                value={allocationNotes}
                onChange={(e) => setAllocationNotes(e.target.value)}
                placeholder="e.g. Bed 24 assigned; Bed 25 being sanitized..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setFulfillingId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFulfillSubmit(fulfillingId)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
