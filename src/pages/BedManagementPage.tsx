import React, { useState, useEffect } from 'react';
import {
  Bed as BedIcon,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Wrench,
  Sparkles,
  Lock,
  Building,
  User,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { Bed, BedStatus } from '../types/hospital.ts';
import { BedDetailDrawer } from '../components/modals/BedDetailDrawer.tsx';

interface BedManagementPageProps {
  onAdmitClick: () => void;
}

export const BedManagementPage: React.FC<BedManagementPageProps> = ({ onAdmitClick }) => {
  const { wardSummaries, globalSearch, refreshData } = useHospital();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const fetchBeds = () => {
    api.getBeds().then(setBeds);
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filteredBeds = beds.filter((b) => {
    if (wardFilter !== 'ALL' && b.wardId !== wardFilter) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (effectiveSearch) {
      const match =
        b.id.toLowerCase().includes(effectiveSearch) ||
        b.bedNumber.toLowerCase().includes(effectiveSearch) ||
        (b.activePatientName && b.activePatientName.toLowerCase().includes(effectiveSearch)) ||
        b.locationDescription.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: BedStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">AVAILABLE</span>;
      case 'OCCUPIED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">OCCUPIED</span>;
      case 'RESERVED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">RESERVED</span>;
      case 'AWAITING_CLEANING':
      case 'CLEANING_IN_PROGRESS':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">CLEANING</span>;
      case 'BLOCKED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">BLOCKED</span>;
      case 'OUT_OF_SERVICE':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">OUT OF SERVICE</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-cyan-400" />
            <span>Universal Bed Inventory & Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete inventory of all commissioned inpatient beds with strict validated status transitions
          </p>
        </div>

        <button
          onClick={onAdmitClick}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
        >
          <User className="w-4 h-4" />
          <span>Admit Patient</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed ID (e.g. JGH-MMW-001), patient, bay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Registered Wards</option>
          {wardSummaries.map((w) => (
            <option key={w.wardId} value={w.wardId}>
              {w.wardName} ({w.wardCode})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Bed Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="OCCUPIED">OCCUPIED</option>
          <option value="RESERVED">RESERVED</option>
          <option value="AWAITING_CLEANING">AWAITING CLEANING</option>
          <option value="CLEANING_IN_PROGRESS">CLEANING IN PROGRESS</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Bed Categories</option>
          <option value="Standard Inpatient">Standard Inpatient</option>
          <option value="ICU / Critical Care">ICU / Critical Care</option>
          <option value="Maternity Delivery">Maternity Delivery</option>
          <option value="Paediatric Cot">Paediatric Cot</option>
          <option value="Isolation">Isolation</option>
        </select>
      </div>

      {/* Bed Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bed ID & Number</th>
                <th className="py-3 px-4">Ward / Unit</th>
                <th className="py-3 px-4">Category & Location</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Active Patient / Hold Note</th>
                <th className="py-3 px-4">Sanitation & Bio-Eng</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredBeds.map((bed) => {
                const ward = wardSummaries.find((w) => w.wardId === bed.wardId);
                return (
                  <tr
                    key={bed.id}
                    onClick={() => setSelectedBed(bed)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{bed.bedNumber}</div>
                      <span className="font-mono text-[10px] text-slate-400">{bed.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200 font-medium">{ward?.wardName || bed.wardId}</span>
                      <div className="text-[10px] text-cyan-400 font-mono">({ward?.wardCode})</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300 font-medium">{bed.category}</div>
                      <div className="text-[11px] text-slate-400">{bed.locationDescription}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(bed.status)}
                    </td>
                    <td className="py-3 px-4">
                      {bed.status === 'OCCUPIED' ? (
                        <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{bed.activePatientName || 'Active Patient'}</span>
                        </div>
                      ) : bed.blockReason ? (
                        <span className="text-amber-300 text-[11px] leading-tight block line-clamp-2">
                          {bed.blockReason}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>Cleaning: <span className="text-emerald-400 font-medium">{bed.cleaningStatus || 'CLEAN'}</span></div>
                      <div>Maintenance: <span className="text-slate-300 font-medium">{bed.maintenanceStatus || 'OPERATIONAL'}</span></div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBed(bed);
                        }}
                        className="bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bed Drawer */}
      {selectedBed && (
        <BedDetailDrawer
          bed={selectedBed}
          onClose={() => setSelectedBed(null)}
          onAdmitToBed={() => {
            setSelectedBed(null);
            onAdmitClick();
          }}
          onRefresh={() => {
            fetchBeds();
            refreshData();
          }}
        />
      )}
    </div>
  );
};
