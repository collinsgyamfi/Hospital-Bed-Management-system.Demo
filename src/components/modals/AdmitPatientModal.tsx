import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle, CheckCircle, Bed as BedIcon } from 'lucide-react';
import { Bed, Ward, AdmissionRequest } from '../../types/hospital.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { useHospital } from '../../context/HospitalContext.tsx';

interface AdmitPatientModalProps {
  initialBed?: Bed | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  initialBed,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useHospital();

  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>(initialBed ? initialBed.wardId : '');
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>(initialBed ? initialBed.id : '');

  // Patient inputs
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | string>(35);
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [hospitalNumber, setHospitalNumber] = useState(`JGH-PT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [referringDepartment, setReferringDepartment] = useState('Emergency and Casualty');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isEmergencyOverride, setIsEmergencyOverride] = useState(false);

  const [existingPending, setExistingPending] = useState<AdmissionRequest[]>([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getWards().then((wData) => {
      setWards(wData.wards);
      if (!selectedWardId && wData.wards.length > 0) {
        setSelectedWardId(wData.wards[0].id);
      }
    });

    api.getAdmissions().then((adms) => {
      setExistingPending(adms.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED'));
    });
  }, [selectedWardId]);

  // Load available beds for chosen ward
  useEffect(() => {
    if (selectedWardId) {
      api.getBeds({ wardId: selectedWardId, status: 'AVAILABLE' }).then((beds) => {
        setAvailableBeds(beds);
        if (!selectedBedId && beds.length > 0) {
          setSelectedBedId(beds[0].id);
        }
      });
    }
  }, [selectedWardId, selectedBedId]);

  const handleSelectPending = (admissionId: string) => {
    setSelectedAdmissionId(admissionId);
    const found = existingPending.find((a) => a.id === admissionId);
    if (found) {
      setPatientName(found.patientName);
      setPatientAge(found.patientAge);
      setPatientGender(found.patientGender);
      setHospitalNumber(found.hospitalNumber);
      setReferringDepartment(found.referringDepartment);
      setPriority(found.priority);
      setClinicalNotes(found.clinicalNotes);
      setSelectedWardId(found.requestedWardId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      addToast('error', 'Validation Error', 'Patient name is required.');
      return;
    }
    if (!selectedBedId) {
      addToast('error', 'Validation Error', 'An available bed must be selected.');
      return;
    }

    try {
      setLoading(true);
      let admissionId = selectedAdmissionId;

      // If not from existing admission request, create one first
      if (!admissionId) {
        const created = await api.createAdmission(
          {
            patientName: patientName.trim(),
            patientAge: Number(patientAge),
            patientGender,
            hospitalNumber: hospitalNumber.trim(),
            referringDepartment,
            requestedWardId: selectedWardId,
            priority,
            clinicalNotes: clinicalNotes.trim(),
            isEmergencyOverride,
          },
          currentUser
        );
        admissionId = created.id;
      }

      // Complete bed allocation (Test 2 & Test 3)
      await api.assignBedToAdmission(admissionId, selectedBedId, clinicalNotes, currentUser);

      addToast('success', 'Patient Admitted', `${patientName} successfully admitted into selected bed.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Admission Blocked', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Admit Patient to Inpatient Bed</h2>
              <p className="text-xs text-slate-400">Juaboso Government Hospital Admission & Bed Allocation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Pending Queue Picker */}
        {existingPending.length > 0 && (
          <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
            <label className="block text-slate-300 font-medium mb-1">
              Select Existing Approved Admission Request (Optional):
            </label>
            <select
              value={selectedAdmissionId}
              onChange={(e) => handleSelectPending(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Create Direct / Fast-Track Admission --</option>
              {existingPending.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.id} · {adm.patientName} ({adm.priority}) → {adm.requestedWardName}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Hospital Number *</label>
              <input
                type="text"
                required
                value={hospitalNumber}
                onChange={(e) => setHospitalNumber(e.target.value)}
                placeholder="e.g. JGH-PT-8840"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Clinical Priority</label>
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
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency (Fast-track)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Target Ward *</label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  setSelectedBedId('');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Available Bed *</label>
              <select
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                required
              >
                {availableBeds.length === 0 ? (
                  <option value="">No Available Beds in this Ward</option>
                ) : (
                  availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.category} - {b.locationDescription})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Referring Department / Unit</label>
            <input
              type="text"
              value={referringDepartment}
              onChange={(e) => setReferringDepartment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Clinical Notes & Admission Indications</label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Clinical reason, vitals, allergies, or infectious precautions..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              * Bed state will automatically transition to OCCUPIED. Duplicate checks enforced.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || availableBeds.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Admitting...' : 'Confirm Admission'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
