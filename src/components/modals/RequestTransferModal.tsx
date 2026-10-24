import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { Ward, Bed } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface RequestTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestTransferModal: React.FC<RequestTransferModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useHospital();

  const [wards, setWards] = useState<Ward[]>([]);
  const [occupiedBeds, setOccupiedBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [receivingWardId, setReceivingWardId] = useState('');
  const [clinicalReason, setClinicalReason] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWards().then((wData) => {
      setWards(wData.wards);
      if (wData.wards.length > 1) {
        setReceivingWardId(wData.wards[1].id);
      }
    });

    api.getBeds({ status: 'OCCUPIED' }).then((beds) => {
      setOccupiedBeds(beds);
      if (beds.length > 0) {
        setSelectedBedId(beds[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bed = occupiedBeds.find((b) => b.id === selectedBedId);
    if (!bed) {
      addToast('error', 'Error', 'Please select a patient bed to transfer.');
      return;
    }
    if (bed.wardId === receivingWardId) {
      addToast('error', 'Validation Error', 'Receiving ward must be different from sending ward.');
      return;
    }

    try {
      setLoading(true);
      await api.createTransfer(
        {
          patientId: bed.activePatientId || 'PT-UNKNOWN',
          patientName: bed.activePatientName || 'Patient',
          sendingWardId: bed.wardId,
          sendingBedId: bed.id,
          receivingWardId,
          clinicalReason: clinicalReason.trim() || 'Clinical progression transfer',
          priority,
        },
        currentUser
      );
      addToast('success', 'Transfer Initiated', `Transfer requested for ${bed.activePatientName} to receiving ward.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Transfer Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedBed = occupiedBeds.find((b) => b.id === selectedBedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Initiate Inter-Ward Transfer</h2>
              <p className="text-xs text-slate-400">Secure patient location & bed handover workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Select Patient / Occupied Bed *</label>
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              required
            >
              {occupiedBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bedNumber} ({b.id}) — {b.activePatientName || 'Patient'}
                </option>
              ))}
            </select>
          </div>

          {selectedBed && (
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <p className="text-slate-400">Current Location:</p>
              <p className="font-semibold text-white">
                {wards.find((w) => w.id === selectedBed.wardId)?.name || 'Ward'} ({selectedBed.bedNumber})
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Receiving Ward *</label>
              <select
                value={receivingWardId}
                onChange={(e) => setReceivingWardId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                required
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id} disabled={selectedBed && w.id === selectedBed.wardId}>
                    {w.name} {selectedBed && w.id === selectedBed.wardId ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Transfer Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="ROUTINE">Routine Transfer</option>
                <option value="URGENT">Urgent (Clinical Escalation)</option>
                <option value="EMERGENCY">Emergency Critical Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Clinical Indication & Notes *</label>
            <textarea
              required
              rows={3}
              value={clinicalReason}
              onChange={(e) => setClinicalReason(e.target.value)}
              placeholder="e.g. Postoperative recovery score achieved; transfer to general surgical ward..."
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
              {loading ? 'Submitting...' : 'Submit Transfer Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
