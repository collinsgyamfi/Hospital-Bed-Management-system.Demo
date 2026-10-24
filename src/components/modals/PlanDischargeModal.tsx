import React, { useState, useEffect } from 'react';
import { X, LogOut, AlertCircle } from 'lucide-react';
import { Bed } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface PlanDischargeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PlanDischargeModal: React.FC<PlanDischargeModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useHospital();

  const [occupiedBeds, setOccupiedBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [summary, setSummary] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getBeds({ status: 'OCCUPIED' }).then((beds) => {
      setOccupiedBeds(beds);
      if (beds.length > 0) setSelectedBedId(beds[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bed = occupiedBeds.find((b) => b.id === selectedBedId);
    if (!bed) {
      addToast('error', 'Error', 'Select an occupied bed to plan discharge.');
      return;
    }

    try {
      setLoading(true);
      await api.planDischarge(
        {
          bedId: bed.id,
          expectedDischargeDate: new Date(expectedDate).toISOString(),
          summary: summary.trim() || 'Medical criteria for discharge met. Oral prescriptions arranged.',
          dischargingDoctor: currentUser.fullName,
        },
        currentUser
      );

      addToast('success', 'Discharge Scheduled', `Planned discharge for ${bed.activePatientName} recorded.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Plan Patient Discharge</h2>
              <p className="text-xs text-slate-400">Clinical readiness & discharge handover</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs flex items-start gap-2 text-cyan-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
          <p>
            Planning a discharge keeps the bed occupied until clinical departure is confirmed. Confirming discharge will automatically transition the bed into terminal sanitization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Select Occupied Bed / Inpatient *</label>
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              required
            >
              {occupiedBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bedNumber} ({b.id}) — {b.activePatientName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Expected Discharge Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Clinical Discharge Summary *</label>
            <textarea
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Completed course of IV antibiotics, vital signs stable, oral medications and outpatient review booked..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || occupiedBeds.length === 0}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            >
              {loading ? 'Recording...' : 'Schedule Discharge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
