import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Plus,
  Bed as BedIcon,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { PatientTransfer, Bed } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface TransfersPageProps {
  onNewTransferClick: () => void;
}

export const TransfersPage: React.FC<TransfersPageProps> = ({ onNewTransferClick }) => {
  const { globalSearch, addToast, refreshData } = useHospital();
  const { currentUser } = useAuth();
  const [transfers, setTransfers] = useState<PatientTransfer[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [acceptingTransfer, setAcceptingTransfer] = useState<PatientTransfer | null>(null);
  const [availableReceivingBeds, setAvailableReceivingBeds] = useState<Bed[]>([]);
  const [chosenReceivingBedId, setChosenReceivingBedId] = useState('');

  const fetchTransfers = () => {
    api.getTransfers().then(setTransfers);
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const effectiveSearch = (searchTerm || globalSearch).toLowerCase();

  const filtered = transfers.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (effectiveSearch) {
      const match =
        t.patientName.toLowerCase().includes(effectiveSearch) ||
        t.hospitalNumber.toLowerCase().includes(effectiveSearch) ||
        t.sendingWardName.toLowerCase().includes(effectiveSearch) ||
        t.receivingWardName.toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAcceptModal = async (transfer: PatientTransfer) => {
    setAcceptingTransfer(transfer);
    const beds = await api.getBeds({ wardId: transfer.receivingWardId, status: 'AVAILABLE' });
    setAvailableReceivingBeds(beds);
    if (beds.length > 0) setChosenReceivingBedId(beds[0].id);
  };

  const handleConfirmAccept = async () => {
    if (!acceptingTransfer || !chosenReceivingBedId) {
      addToast('error', 'Error', 'Please select an available bed in the receiving ward.');
      return;
    }
    try {
      await api.acceptTransfer(acceptingTransfer.id, chosenReceivingBedId, currentUser);
      addToast('success', 'Transfer Accepted', 'Bed reserved in receiving ward.');
      setAcceptingTransfer(null);
      fetchTransfers();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const handleMarkDeparted = async (transferId: string) => {
    try {
      await api.departTransfer(transferId, currentUser);
      addToast('info', 'Patient In Transit', 'Patient departed sending ward.');
      fetchTransfers();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  // Test 4: Confirm Arrival
  const handleConfirmArrival = async (transferId: string) => {
    try {
      await api.confirmTransferArrival(transferId, currentUser);
      addToast(
        'success',
        'Transfer Completed',
        'Patient arrival confirmed. Sending bed dispatched to sanitization.'
      );
      fetchTransfers();
      refreshData();
    } catch (err: any) {
      addToast('error', 'Arrival Confirmation Failed', err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
            <span>Inter-Ward Patient Transfer Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Two-way acceptance and arrival confirmation preventing duplicate bed assignments
          </p>
        </div>

        <button
          onClick={onNewTransferClick}
          className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Patient Transfer</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, sending or receiving ward..."
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
          <option value="ALL">All Transfer Statuses</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED (Bed Reserved)</option>
          <option value="IN_PROGRESS">IN PROGRESS (En Route)</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Transfers List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Transfer ID & Patient</th>
                <th className="py-3 px-4">Sending Ward</th>
                <th className="py-3 px-4">Receiving Ward</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Current Status</th>
                <th className="py-3 px-4">Clinical Indication</th>
                <th className="py-3 px-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{t.patientName}</div>
                    <div className="font-mono text-[10px] text-cyan-400">{t.id} · {t.hospitalNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-200">{t.sendingWardName}</span>
                    <div className="font-mono text-[10px] text-slate-400">{t.sendingBedId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{t.receivingWardName}</span>
                    <div className="font-mono text-[10px] text-emerald-400">
                      {t.receivingBedId ? `Reserved: ${t.receivingBedId}` : 'Awaiting Bed Selection'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        t.priority === 'EMERGENCY'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : t.priority === 'URGENT'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse'
                          : t.status === 'ACCEPTED'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-2">
                      {t.clinicalReason}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {t.status === 'REQUESTED' || t.status === 'AWAITING_ACCEPTANCE' ? (
                      <button
                        onClick={() => handleOpenAcceptModal(t)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Accept & Reserve Bed
                      </button>
                    ) : t.status === 'ACCEPTED' ? (
                      <button
                        onClick={() => handleMarkDeparted(t.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Mark in Transit
                      </button>
                    ) : t.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => handleConfirmArrival(t.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors"
                      >
                        Confirm Arrival & Place
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept & Reserve Bed Modal */}
      {acceptingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-white">Accept Incoming Transfer</h3>
            <p className="text-xs text-slate-400">
              Receiving Ward: <span className="text-white font-semibold">{acceptingTransfer.receivingWardName}</span>
            </p>
            <p className="text-xs text-slate-300">
              Patient: <span className="text-cyan-300 font-bold">{acceptingTransfer.patientName}</span>
            </p>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Select Available Receiving Bed</label>
              <select
                value={chosenReceivingBedId}
                onChange={(e) => setChosenReceivingBedId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
              >
                {availableReceivingBeds.length === 0 ? (
                  <option value="">No Available Beds in {acceptingTransfer.receivingWardName}</option>
                ) : (
                  availableReceivingBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.category} - {b.locationDescription})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setAcceptingTransfer(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={availableReceivingBeds.length === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
              >
                Accept & Reserve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
