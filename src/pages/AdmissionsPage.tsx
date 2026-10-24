import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bed as BedIcon,
  ShieldAlert,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { AdmissionRequest, Bed } from '../types/hospital.ts';

interface AdmissionsPageProps {
  onNewAdmissionClick: () => void;
}

export const AdmissionsPage: React.FC<AdmissionsPageProps> = ({ onNewAdmissionClick }) => {
  const { wardSummaries, globalSearch, refreshData } = useHospital();
  const [admissions, setAdmissions] = useState<AdmissionRequest[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRequest | null>(null);

  const fetchAdmissions = () => {
    api.getAdmissions().then(setAdmissions);
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = admissions.filter((a) => {
    if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (wardFilter !== 'ALL' && a.requestedWardId !== wardFilter) return false;
    if (effectiveSearch) {
      const match =
        a.patientName.toLowerCase().includes(effectiveSearch) ||
        a.hospitalNumber.toLowerCase().includes(effectiveSearch) ||
        a.id.toLowerCase().includes(effectiveSearch) ||
        a.referringDepartment.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const getPriorityBadge = (p: AdmissionRequest['priority']) => {
    switch (p) {
      case 'EMERGENCY':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">EMERGENCY</span>;
      case 'URGENT':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">URGENT</span>;
      case 'ROUTINE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 uppercase">ROUTINE</span>;
    }
  };

  const calculateWaitMinutes = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (diff < 60) return `${Math.floor(diff)} min`;
    const hours = Math.floor(diff / 60);
    const mins = Math.floor(diff % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span>Patient Admissions & Bed Placement Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Clinical admission coordination connecting Emergency, Outpatient, and Inpatient Wards
          </p>
        </div>

        <button
          onClick={onNewAdmissionClick}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Admission Request</span>
        </button>
      </div>

      {/* Clinical Disclaimer Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 text-slate-400">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          Clinical triage and admission decisions remain with authorized healthcare professionals. The system coordinates capacity and bed placement without replacing clinical judgment.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, hospital number, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Priorities</option>
          <option value="EMERGENCY">Emergency (Fast-track)</option>
          <option value="URGENT">Urgent</option>
          <option value="ROUTINE">Routine</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ADMITTED">ADMITTED</option>
        </select>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
        >
          <option value="ALL">All Destination Wards</option>
          {wardSummaries.map((w) => (
            <option key={w.wardId} value={w.wardId}>
              {w.wardName} ({w.wardCode})
            </option>
          ))}
        </select>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request ID & Patient</th>
                <th className="py-3 px-4">Referring Unit</th>
                <th className="py-3 px-4">Target Ward & Bed Type</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Waiting Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Clinical Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{adm.patientName}</div>
                    <div className="font-mono text-[10px] text-cyan-400">
                      {adm.hospitalNumber} · {adm.patientGender}, {adm.patientAge}y
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {adm.referringDepartment}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{adm.requestedWardName}</div>
                    <div className="text-[11px] text-slate-400">{adm.bedCategory}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getPriorityBadge(adm.priority)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300 font-medium">
                    {calculateWaitMinutes(adm.requestTime)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        adm.status === 'ADMITTED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : adm.status === 'APPROVED'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {adm.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-300 line-clamp-2 leading-relaxed text-[11px]">
                      {adm.clinicalNotes}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {adm.status !== 'ADMITTED' ? (
                      <button
                        onClick={onNewAdmissionClick}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Allocate Bed
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        {adm.allocatedBedNumber || 'Assigned'}
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
