import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building,
  Filter,
  RefreshCw,
  UserPlus,
  Bed as BedIcon,
  Sparkles,
  Wrench,
  AlertOctagon,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { Bed, BedStatus } from '../types/hospital.ts';
import { BedDetailDrawer } from '../components/modals/BedDetailDrawer.tsx';

interface BedMapPageProps {
  onAdmitClick: () => void;
}

export const BedMapPage: React.FC<BedMapPageProps> = ({ onAdmitClick }) => {
  const { wardSummaries, refreshData } = useHospital();
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const fetchBeds = () => {
    api.getBeds().then(setBeds);
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const filteredBeds = beds.filter((b) => {
    if (selectedWardId !== 'ALL' && b.wardId !== selectedWardId) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  // Group beds by ward
  const wardsToDisplay = selectedWardId === 'ALL'
    ? wardSummaries
    : wardSummaries.filter((w) => w.wardId === selectedWardId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>Interactive Visual Ward Bed Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time floor grid status across all inpatient hospital care areas
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Reserved
          </span>
          <span className="flex items-center gap-1.5 text-purple-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Cleaning
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Blocked
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-slate-600" /> Out of Service
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Hospital Wards (Master Grid)</option>
            {wardSummaries.map((w) => (
              <option key={w.wardId} value={w.wardId}>
                {w.wardName} ({w.wardCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
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
        </div>

        <button
          onClick={fetchBeds}
          className="ml-auto flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Grid</span>
        </button>
      </div>

      {/* Ward Cards & Bed Grids */}
      <div className="space-y-6">
        {wardsToDisplay.map((ward) => {
          const wardBeds = filteredBeds.filter((b) => b.wardId === ward.wardId);
          if (wardBeds.length === 0 && statusFilter !== 'ALL') return null;

          return (
            <div key={ward.wardId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white text-base">{ward.wardName}</span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                    {ward.wardCode}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">({ward.departmentName})</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-blue-400 font-semibold">{ward.occupiedBeds} Occupied</span>
                  <span className="text-emerald-400 font-semibold">{ward.availableBeds} Available</span>
                  <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded">
                    {ward.occupancyPercentage}% Occupancy
                  </span>
                </div>
              </div>

              {/* Grid of Bed Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                {wardBeds.map((bed) => {
                  const statusStyles = {
                    AVAILABLE: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:border-emerald-300',
                    OCCUPIED: 'bg-blue-950/40 border-blue-500/40 text-blue-200 hover:border-blue-300',
                    RESERVED: 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-300',
                    AWAITING_CLEANING: 'bg-purple-950/40 border-purple-500/40 text-purple-200 hover:border-purple-300',
                    CLEANING_IN_PROGRESS: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 hover:border-indigo-300',
                    BLOCKED: 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:border-rose-300',
                    OUT_OF_SERVICE: 'bg-slate-800/80 border-slate-600 text-slate-400 opacity-60 hover:opacity-100',
                  }[bed.status];

                  return (
                    <div
                      key={bed.id}
                      onClick={() => setSelectedBed(bed)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${statusStyles} flex flex-col justify-between h-24 hover:scale-[1.02] shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{bed.bedNumber}</span>
                          <span className="text-[8px] font-mono font-bold uppercase px-1 rounded bg-black/40">
                            {bed.status === 'CLEANING_IN_PROGRESS' ? 'CLEANING' : bed.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{bed.locationDescription}</p>
                      </div>

                      <div className="pt-1 border-t border-white/10 text-[9px] truncate font-medium">
                        {bed.status === 'OCCUPIED' ? (
                          <span className="text-blue-300 truncate block font-semibold">{bed.activePatientName || 'Patient'}</span>
                        ) : bed.status === 'AVAILABLE' ? (
                          <span className="text-emerald-300 font-semibold">Ready</span>
                        ) : bed.status === 'OUT_OF_SERVICE' ? (
                          <span className="text-rose-400">Repairs</span>
                        ) : (
                          <span className="opacity-80 truncate block">{bed.blockReason || bed.status}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Detail Drawer */}
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
