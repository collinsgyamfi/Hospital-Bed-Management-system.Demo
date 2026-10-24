import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Ward, WardUpdate } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface ReportWardUpdateModalProps {
  initialWardId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportWardUpdateModal: React.FC<ReportWardUpdateModalProps> = ({
  initialWardId,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useHospital();

  const [wards, setWards] = useState<Ward[]>([]);
  const [wardId, setWardId] = useState(initialWardId || '');
  const [category, setCategory] = useState<WardUpdate['category']>('Bed shortage');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'CRITICAL'>('URGENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWards().then((data) => {
      setWards(data.wards);
      if (!wardId && data.wards.length > 0) {
        setWardId(data.wards[0].id);
      }
    });
  }, [wardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast('error', 'Error', 'Description is required.');
      return;
    }

    try {
      setLoading(true);
      await api.reportWardUpdate(
        {
          wardId,
          category,
          priority,
          description: description.trim(),
        },
        currentUser
      );

      addToast('success', 'Update Published', `Operational update broadcast to hospital management.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories: WardUpdate['category'][] = [
    'Bed shortage',
    'High patient demand',
    'Staff shortage',
    'Equipment problem',
    'Maintenance requirement',
    'Cleaning delay',
    'Infection-control restriction',
    'Delayed patient transfer',
    'Delayed discharge',
    'General operational update',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Broadcast Ward Operational Update</h2>
              <p className="text-xs text-slate-400">Direct operational communication to Hospital Directorate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Ward *</label>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                required
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Urgency Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full border rounded-lg p-2 font-semibold ${
                  priority === 'CRITICAL'
                    ? 'bg-rose-950 border-rose-600 text-rose-300'
                    : priority === 'URGENT'
                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="ROUTINE">Routine Status Update</option>
                <option value="URGENT">Urgent Operational Concern</option>
                <option value="CRITICAL">Critical Incident / Capacity Breach</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Issue Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Description & Operational Needs *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific shortage, delayed transfers, staff constraints, or required administrative intervention..."
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
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              {loading ? 'Broadcasting...' : 'Broadcast to Operations Feed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
