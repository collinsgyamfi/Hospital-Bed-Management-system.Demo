import React, { useState } from 'react';
import {
  Building,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Bed,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { WardOccupancySummary } from '../types/hospital.ts';

interface WardsDirectoryProps {
  onSelectWard: (wardId: string) => void;
}

export const WardsDirectory: React.FC<WardsDirectoryProps> = ({ onSelectWard }) => {
  const { wardSummaries, globalSearch } = useHospital();
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof WardOccupancySummary>('occupancyPercentage');
  const [sortAsc, setSortAsc] = useState(false);

  const departments = Array.from(new Set(wardSummaries.map((w) => w.departmentName)));

  // Combine local search and header globalSearch
  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filteredWards = wardSummaries.filter((w) => {
    if (deptFilter !== 'ALL' && w.departmentName !== deptFilter) return false;
    if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
    if (effectiveSearch) {
      const match =
        w.wardName.toLowerCase().includes(effectiveSearch) ||
        w.wardCode.toLowerCase().includes(effectiveSearch) ||
        w.managerName.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const sortedWards = [...filteredWards].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof WardOccupancySummary) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Ward Name',
      'Ward Code',
      'Department',
      'Manager',
      'Installed Capacity',
      'Operational Capacity',
      'Occupied Beds',
      'Available Beds',
      'Reserved Beds',
      'Blocked Beds',
      'Out of Service',
      'Occupancy %',
      'Status',
      'Pending Admissions',
      'Pending Transfers',
      'Pending Requests',
      'Last Sync Time',
    ];

    const rows = sortedWards.map((w) => [
      `"${w.wardName}"`,
      `"${w.wardCode}"`,
      `"${w.departmentName}"`,
      `"${w.managerName}"`,
      w.installedCapacity,
      w.operationalCapacity,
      w.occupiedBeds,
      w.availableBeds,
      w.reservedBeds,
      w.blockedBeds,
      w.outOfServiceBeds,
      w.occupancyPercentage,
      `"${w.status}"`,
      w.pendingAdmissions,
      w.pendingTransfers,
      w.pendingRequests,
      `"${w.lastUpdated}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JGH_Ward_Capacity_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <span>Wards & Clinical Departments Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized capacity index connecting all registered inpatient care wards at Juaboso Government Hospital
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search ward name, code, manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Clinical Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Operational Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="APPROACHING_CAPACITY">Approaching Capacity</option>
            <option value="HIGH_OCCUPANCY">High Occupancy</option>
            <option value="FULL">Full</option>
            <option value="OVER_CAPACITY">Over Capacity</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('wardName')}>
                  <div className="flex items-center gap-1">
                    <span>Ward & Code</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Department & Manager</th>
                <th className="py-3 px-3 text-center cursor-pointer" onClick={() => handleSort('installedCapacity')}>
                  Installed
                </th>
                <th className="py-3 px-3 text-center cursor-pointer" onClick={() => handleSort('operationalCapacity')}>
                  Operational
                </th>
                <th className="py-3 px-3 text-center text-blue-400 cursor-pointer" onClick={() => handleSort('occupiedBeds')}>
                  Occupied
                </th>
                <th className="py-3 px-3 text-center text-emerald-400 cursor-pointer" onClick={() => handleSort('availableBeds')}>
                  Available
                </th>
                <th className="py-3 px-3 text-center text-slate-400">OOS / Blocked</th>
                <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('occupancyPercentage')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Occupancy</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Operational Status</th>
                <th className="py-3 px-3 text-center">Pending Queues</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sortedWards.map((w) => {
                return (
                  <tr
                    key={w.wardId}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectWard(w.wardId)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                        <span>{w.wardName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.2 rounded">
                        {w.wardCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{w.departmentName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{w.managerName}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-300">
                      {w.installedCapacity}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-white">
                      {w.operationalCapacity}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-400">
                      {w.occupiedBeds}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-400">
                      {w.availableBeds}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {w.outOfServiceBeds > 0 ? (
                        <span className="text-rose-400 font-semibold">{w.outOfServiceBeds} OOS</span>
                      ) : (
                        '0'
                      )}
                      {w.blockedBeds > 0 && <span className="text-purple-400 ml-1">/ {w.blockedBeds} blk</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono font-bold text-white text-sm">
                        {w.occupancyPercentage}%
                      </div>
                      <div className="w-16 mx-auto bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${w.occupancyPercentage >= 90 ? 'bg-rose-500' : w.occupancyPercentage >= 80 ? 'bg-amber-400' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(100, w.occupancyPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          w.status === 'NORMAL'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : w.status === 'APPROACHING_CAPACITY'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : w.status === 'HIGH_OCCUPANCY'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {w.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                      <span className="text-amber-400" title="Pending admissions">{w.pendingAdmissions} adm</span> ·{' '}
                      <span className="text-cyan-400" title="Pending transfers">{w.pendingTransfers} trf</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWard(w.wardId);
                        }}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-cyan-900/40 hover:text-cyan-300 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        <span>Workspace</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
