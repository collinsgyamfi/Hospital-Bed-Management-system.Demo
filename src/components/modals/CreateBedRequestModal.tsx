import React, { useState, useEffect } from 'react';
import { X, GitPullRequest } from 'lucide-react';
import { Ward } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface CreateBedRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBedRequestModal: React.FC<CreateBedRequestModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useHospital();

  const [wards, setWards] = useState<Ward[]>([]);
  const [requestingDepartment, setRequestingDepartment] = useState('Emergency and Casualty');
  const [requestedWardId, setRequestedWardId] = useState('');
  const [numberOfBeds, setNumberOfBeds] = useState(1);
  const [bedCategory, setBedCategory] = useState('Standard Inpatient');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWards().then((data) => {
      setWards(data.wards);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('error', 'Validation Error', 'Clinical or operational reason is required.');
      return;
    }

    try {
      setLoading(true);
      await api.createBedRequest(
        {
          requestingDepartment,
          requestedWardId: requestedWardId || undefined,
          numberOfBeds: Number(numberOfBeds),
          bedCategory,
          priority,
          reason: reason.trim(),
        },
        currentUser
      );
      addToast('success', 'Request Submitted', `Bed request for ${numberOfBeds} bed(s) submitted to hospital queue.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Request Failed', err.message);
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
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit Bed Placement Request</h2>
              <p className="text-xs text-slate-400">Inter-ward and surge capacity demand ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Requesting Department / Unit *</label>
            <input
              type="text"
              required
              value={requestingDepartment}
              onChange={(e) => setRequestingDepartment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Target Ward (if known)</label>
              <select
                value={requestedWardId}
                onChange={(e) => setRequestedWardId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="">Any Eligible Ward / Triage Decision</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Quantity Requested *</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={numberOfBeds}
                onChange={(e) => setNumberOfBeds(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Bed Category</label>
              <select
                value={bedCategory}
                onChange={(e) => setBedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="Standard Inpatient">Standard Inpatient</option>
                <option value="ICU / Critical Care">ICU / Critical Care</option>
                <option value="Maternity Delivery">Maternity Delivery</option>
                <option value="Paediatric Cot">Paediatric Cot</option>
                <option value="Isolation">Isolation</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Priority Level *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full border rounded-lg p-2 font-semibold ${
                  priority === 'EMERGENCY'
                    ? 'bg-rose-950 border-rose-600 text-rose-300'
                    : priority === 'URGENT'
                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="ROUTINE">Routine Admission</option>
                <option value="URGENT">Urgent (Surge / Triage)</option>
                <option value="EMERGENCY">Emergency (Life-Threatening)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Reason / Clinical Context *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mass casualty influx from Sefwi highway; resuscitation overflow requires step-down beds..."
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
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            >
              {loading ? 'Submitting...' : 'Submit Bed Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
