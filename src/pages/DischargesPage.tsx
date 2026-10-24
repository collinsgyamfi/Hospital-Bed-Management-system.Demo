import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { DischargeRecord } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DischargesPageProps {
  onPlanDischargeClick: () => void;
}

export const DischargesPage: React.FC<DischargesPageProps> = ({ onPlanDischargeClick }) => {
  const { globalSearch, addToast, refreshData } = useHospital();
  const { currentUser } = useAuth();
  const [discharges, setDischarges] = useState<DischargeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDischarges = () => {
    api.getDischarges().then(setDischarges);
  };

  useEffect(() => {
    fetchDischarges();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = discharges.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (effectiveSearch) {
      const match =
        d.patientName.toLowerCase().includes(effectiveSearch) ||
        d.hospitalNumber.toLowerCase().includes(effectiveSearch) ||
        d.wardName.toLowerCase().includes(effectiveSearch) ||
        d.bedNumber.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  // Test 5: Confirm Discharge
  const handleConfirmDischarge = async (dischargeId: string) => {
    try {
      await api.confirmDischarge(dischargeId, currentUser);
      addToast(
        'success',
        'Discharge Confirmed',
        'Patient discharged. Bed has moved to AWAITING_CLEANING and terminal cleaning task dispatched.'
      );
      fetchDischarges();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LogOut className="w-5 h-5 text-emerald-400" />
            <span>Discharge Coordination & Bed Readiness Handoff</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Expected vs confirmed discharges. Confirmed departures automatically dispatch sanitization.
          </p>
        </div>

        <button
          onClick={onPlanDischargeClick}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Plan Patient Discharge</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, hospital number, ward, bed..."
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
          <option value="ALL">All Discharge Statuses</option>
          <option value="READY">READY (Planned / Awaiting Sign-off)</option>
          <option value="CONFIRMED">CONFIRMED (Discharged to Cleaning)</option>
        </select>
      </div>

      {/* Discharges Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient & Number</th>
                <th className="py-3 px-4">Ward & Bed Number</th>
                <th className="py-3 px-4">Expected Departure</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Discharging Clinician</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4 text-right">Confirmation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{d.patientName}</div>
                    <div className="font-mono text-[10px] text-cyan-400">{d.hospitalNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{d.wardName}</div>
                    <div className="font-mono text-[11px] text-blue-300">{d.bedNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {new Date(d.expectedDischargeDate).toLocaleString([], {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        d.status === 'CONFIRMED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {d.dischargingDoctor}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-2">
                      {d.summary}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {d.status !== 'CONFIRMED' ? (
                      <button
                        onClick={() => handleConfirmDischarge(d.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Confirm Departure
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Sanitization Dispatched</span>
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
