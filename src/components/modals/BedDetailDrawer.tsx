import React, { useState } from 'react';
import {
  X,
  Bed as BedIcon,
  User,
  Clock,
  Sparkles,
  Wrench,
  ShieldAlert,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Bed, BedStatus } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface BedDetailDrawerProps {
  bed: Bed | null;
  onClose: () => void;
  onAdmitToBed?: (bed: Bed) => void;
  onRefresh?: () => void;
}

export const BedDetailDrawer: React.FC<BedDetailDrawerProps> = ({
  bed,
  onClose,
  onAdmitToBed,
  onRefresh,
}) => {
  const { currentUser, canAssignBeds, canConfirmDischarge, canUpdateCleaning, canUpdateMaintenance } = useAuth();
  const { addToast } = useHospital();
  const [loading, setLoading] = useState(false);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);

  if (!bed) return null;

  const handleStatusChange = async (targetStatus: BedStatus, reason?: string) => {
    try {
      setLoading(true);
      await api.changeBedStatus(bed.id, targetStatus, reason, currentUser);
      addToast('success', 'Status Changed', `Bed ${bed.bedNumber} changed to ${targetStatus}`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      addToast('error', 'Action Prohibited', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: BedStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">AVAILABLE</span>;
      case 'OCCUPIED':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">OCCUPIED</span>;
      case 'RESERVED':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">RESERVED</span>;
      case 'AWAITING_CLEANING':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">AWAITING CLEANING</span>;
      case 'CLEANING_IN_PROGRESS':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">CLEANING IN PROGRESS</span>;
      case 'BLOCKED':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">BLOCKED</span>;
      case 'OUT_OF_SERVICE':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/40">OUT OF SERVICE</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-6 text-slate-100 overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
              <BedIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{bed.bedNumber}</h2>
              <p className="text-xs text-slate-400 font-mono">{bed.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Category */}
        <div className="my-5 p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Current Status:</span>
            {getStatusBadge(bed.status)}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Category:</span>
            <span className="font-medium text-slate-200">{bed.category}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Location:</span>
            <span className="font-medium text-slate-200">{bed.locationDescription}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Last Changed:</span>
            <span className="text-slate-300 font-mono">
              {new Date(bed.lastStatusChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Modified By:</span>
            <span className="text-slate-300">{bed.lastModifiedBy || 'Staff'}</span>
          </div>
        </div>

        {/* Active Patient Assignment if Occupied */}
        {bed.status === 'OCCUPIED' && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <User className="w-4 h-4 text-blue-400" />
              <span>Assigned Patient</span>
            </div>
            <p className="text-base font-bold text-white">{bed.activePatientName || 'Patient'}</p>
            <p className="text-xs text-blue-200 font-mono">ID: {bed.activePatientId}</p>
          </div>
        )}

        {/* Blocking or Out of service reason */}
        {bed.blockReason && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs mb-5">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Block / Operational Hold Notice</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">{bed.blockReason}</p>
          </div>
        )}

        {/* Permitted Operations & State Transitions */}
        <div className="space-y-3 mt-auto pt-4 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available Operations
          </p>

          {/* Action 1: Assign patient if Available */}
          {bed.status === 'AVAILABLE' && canAssignBeds && (
            <button
              onClick={() => {
                if (onAdmitToBed) onAdmitToBed(bed);
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-xs transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Admit Patient to {bed.bedNumber}</span>
            </button>
          )}

          {/* Action 2: Reserve Bed */}
          {bed.status === 'AVAILABLE' && canAssignBeds && (
            <button
              onClick={() => handleStatusChange('RESERVED', 'Reserved for incoming triage admission')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 font-medium py-2 px-4 rounded-lg text-xs transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Reserve Bed for Incoming Admission</span>
            </button>
          )}

          {/* Release Reserved */}
          {bed.status === 'RESERVED' && canAssignBeds && (
            <button
              onClick={() => handleStatusChange('AVAILABLE', 'Reservation cancelled')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg text-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Cancel Reservation & Return to AVAILABLE</span>
            </button>
          )}

          {/* Cleaning Workflows */}
          {(bed.status === 'AWAITING_CLEANING' || bed.status === 'CLEANING_IN_PROGRESS') && canUpdateCleaning && (
            <div className="space-y-2">
              {bed.status === 'AWAITING_CLEANING' && (
                <button
                  onClick={() => handleStatusChange('CLEANING_IN_PROGRESS', 'Sanitation technician commenced terminal disinfection')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Cleaning (Terminal Disinfection)</span>
                </button>
              )}

              <button
                onClick={() => handleStatusChange('AVAILABLE', 'Cleaning certified and inspected')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Certify Clean & Release to AVAILABLE</span>
              </button>
            </div>
          )}

          {/* Maintenance Actions */}
          {bed.status === 'OUT_OF_SERVICE' && canUpdateMaintenance && (
            <button
              onClick={() => handleStatusChange('AVAILABLE', 'Biomedical repair verified; ready for clinical use')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span>Sign-off Repairs & Return to Service</span>
            </button>
          )}

          {/* Report Maintenance issue on bed */}
          {bed.status !== 'OUT_OF_SERVICE' && canUpdateMaintenance && (
            <button
              onClick={() => {
                const desc = prompt('Describe maintenance or mechanical issue with bed:');
                if (desc) {
                  handleStatusChange('OUT_OF_SERVICE', `Reported fault: ${desc}`);
                }
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800 text-rose-300 py-2 px-4 rounded-lg text-xs transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span>Report Defect & Mark Out of Service</span>
            </button>
          )}

          {/* Block / Unblock with reason */}
          {bed.status === 'AVAILABLE' && (
            <div>
              {showBlockInput ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter reason for blocking (e.g. Infection control barrier)..."
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (blockReasonInput.trim()) {
                          handleStatusChange('BLOCKED', blockReasonInput.trim());
                        }
                      }}
                      className="flex-1 bg-rose-600 text-white text-xs py-1.5 rounded font-medium"
                    >
                      Confirm Block
                    </button>
                    <button
                      onClick={() => setShowBlockInput(false)}
                      className="px-3 bg-slate-800 text-slate-300 text-xs py-1.5 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowBlockInput(true)}
                  className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs py-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Block Bed Temporarily...</span>
                </button>
              )}
            </div>
          )}

          {bed.status === 'BLOCKED' && (
            <button
              onClick={() => handleStatusChange('AVAILABLE', 'Operational block lifted by authorized staff')}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 py-2 rounded-lg text-xs font-medium"
            >
              Lift Block & Return to AVAILABLE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
