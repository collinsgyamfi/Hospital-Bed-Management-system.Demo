import React, { useState, useEffect } from 'react';
import {
  Building,
  Bed as BedIcon,
  Users,
  Clock,
  GitPullRequest,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  AlertTriangle,
  History,
  FileBarChart,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  Wrench,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import {
  Bed,
  Ward,
  AdmissionRequest,
  BedRequest,
  PatientTransfer,
  DischargeRecord,
  CleaningTask,
  OperationalIssue,
  OperationalEvent,
  WardUpdate,
} from '../types/hospital.ts';
import { BedDetailDrawer } from '../components/modals/BedDetailDrawer.tsx';

interface WardWorkspaceProps {
  wardId: string;
  onBack: () => void;
  onAdmitClick: () => void;
  onReportUpdateClick: (wardId: string) => void;
}

export const WardWorkspace: React.FC<WardWorkspaceProps> = ({
  wardId,
  onBack,
  onAdmitClick,
  onReportUpdateClick,
}) => {
  const { wardSummaries, feedEvents, refreshData } = useHospital();
  const [activeTab, setActiveTab] = useState<number>(1);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRequest[]>([]);
  const [bedRequests, setBedRequests] = useState<BedRequest[]>([]);
  const [transfers, setTransfers] = useState<PatientTransfer[]>([]);
  const [discharges, setDischarges] = useState<DischargeRecord[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [wardUpdates, setWardUpdates] = useState<WardUpdate[]>([]);
  const [selectedBedForDrawer, setSelectedBedForDrawer] = useState<Bed | null>(null);

  const wardSummary = wardSummaries.find((w) => w.wardId === wardId) || wardSummaries[0];

  useEffect(() => {
    if (!wardSummary) return;

    api.getBeds({ wardId: wardSummary.wardId }).then(setBeds);
    api.getAdmissions().then((adms) => setAdmissions(adms.filter((a) => a.requestedWardId === wardSummary.wardId)));
    api.getBedRequests().then((reqs) => setBedRequests(reqs.filter((r) => r.requestedWardId === wardSummary.wardId)));
    api.getTransfers().then((trfs) => setTransfers(trfs.filter((t) => t.sendingWardId === wardSummary.wardId || t.receivingWardId === wardSummary.wardId)));
    api.getDischarges().then((dscs) => setDischarges(dscs.filter((d) => d.wardId === wardSummary.wardId)));
    api.getCleaningTasks().then((clns) => setCleaningTasks(clns.filter((c) => c.wardId === wardSummary.wardId)));
    api.getWardUpdates().then((upds) => setWardUpdates(upds.filter((u) => u.wardId === wardSummary.wardId)));
  }, [wardSummary]);

  if (!wardSummary) {
    return <div className="p-8 text-slate-400">Loading Ward Workspace...</div>;
  }

  const tabs = [
    { id: 1, label: 'Overview', icon: Building },
    { id: 2, label: 'Bed Map', icon: BedIcon, count: beds.length },
    { id: 3, label: 'Current Inpatients', icon: Users, count: beds.filter((b) => b.status === 'OCCUPIED').length },
    { id: 4, label: 'Pending Admissions', icon: Clock, count: admissions.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED').length },
    { id: 5, label: 'Bed Requests', icon: GitPullRequest, count: bedRequests.filter((r) => r.status === 'SUBMITTED' || r.status === 'PARTIALLY_FULFILLED').length },
    { id: 6, label: 'Transfers', icon: ArrowRightLeft, count: transfers.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length },
    { id: 7, label: 'Discharges', icon: LogOut, count: discharges.length },
    { id: 8, label: 'Cleaning & Readiness', icon: Sparkles, count: cleaningTasks.filter((c) => c.status !== 'INSPECTED').length },
    { id: 9, label: 'Operational Updates', icon: AlertTriangle, count: wardUpdates.length },
    { id: 10, label: 'Activity History', icon: History },
    { id: 11, label: 'Ward Reports', icon: FileBarChart },
  ];

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Ward Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Back to Ward Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {wardSummary.wardName}
              </h1>
              <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                Code: {wardSummary.wardCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {wardSummary.departmentName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ward Lead: <span className="text-slate-200 font-medium">{wardSummary.managerName}</span> · Warning: {wardSummary.warningThreshold}% · Critical: {wardSummary.criticalThreshold}%
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAdmitClick}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Admit to {wardSummary.wardCode}</span>
          </button>
          <button
            onClick={() => onReportUpdateClick(wardSummary.wardId)}
            className="flex items-center gap-1.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Ward Update</span>
          </button>
        </div>
      </div>

      {/* Ward Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Occupancy Rate</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">{wardSummary.occupancyPercentage}%</p>
          <p className="text-[10px] text-slate-400">{wardSummary.occupiedBeds} / {wardSummary.operationalCapacity} beds</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-emerald-400 uppercase font-semibold">Available Beds</p>
          <p className="text-xl font-bold text-emerald-300 mt-1 font-mono">{wardSummary.availableBeds}</p>
          <p className="text-[10px] text-slate-400">Ready for placement</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-amber-400 uppercase font-semibold">Reserved Beds</p>
          <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{wardSummary.reservedBeds}</p>
          <p className="text-[10px] text-slate-400">Triage holds</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-purple-400 uppercase font-semibold">Blocked / Cleaning</p>
          <p className="text-xl font-bold text-purple-300 mt-1 font-mono">{wardSummary.blockedBeds}</p>
          <p className="text-[10px] text-slate-400">Sanitizing / Isolation</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-rose-400 uppercase font-semibold">Out of Service</p>
          <p className="text-xl font-bold text-rose-300 mt-1 font-mono">{wardSummary.outOfServiceBeds}</p>
          <p className="text-[10px] text-slate-400">Defective mechanical</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-cyan-400 uppercase font-semibold">Current State</p>
          <p className="text-sm font-bold text-cyan-300 mt-2 truncate">{wardSummary.status.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* 11 Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-px text-xs custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 rounded-full ${isActive ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-h-[360px]">
        {/* Tab 1: Ward Overview */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Ward Snapshot & Operational Pressure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2.5">
                <p className="font-semibold text-slate-200">Capacity & Safety Status</p>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Installed Commissioned Capacity:</span>
                    <span className="font-mono text-white">{wardSummary.installedCapacity} beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized Operational Capacity:</span>
                    <span className="font-mono text-white">{wardSummary.operationalCapacity} beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Occupied by Inpatients:</span>
                    <span className="font-mono text-blue-400 font-bold">{wardSummary.occupiedBeds} beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Available for Admission:</span>
                    <span className="font-mono text-emerald-400 font-bold">{wardSummary.availableBeds} beds</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2.5">
                <p className="font-semibold text-slate-200">Pending Actions & Movements</p>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Approved Patients Awaiting Bed:</span>
                    <span className="font-mono text-amber-400 font-bold">{wardSummary.pendingAdmissions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Transfers in Transit:</span>
                    <span className="font-mono text-cyan-400 font-bold">{wardSummary.pendingTransfers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beds Undergoing Sanitization:</span>
                    <span className="font-mono text-purple-400 font-bold">{wardSummary.blockedBeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mechanical Repairs Required:</span>
                    <span className="font-mono text-rose-400 font-bold">{wardSummary.outOfServiceBeds}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Ward Updates */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recent Reports from Ward Staff
              </h4>
              {wardUpdates.length === 0 ? (
                <p className="text-xs text-slate-500">No operational alerts reported for this ward.</p>
              ) : (
                <div className="space-y-2">
                  {wardUpdates.map((u) => (
                    <div key={u.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">{u.category}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1">{u.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Reported by: {u.reportedBy}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Visual Bed Map */}
        {activeTab === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-400">Click any bed tile to view details and execute operational actions.</p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded bg-emerald-500" /> Available</span>
                <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded bg-blue-500" /> Occupied</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded bg-amber-500" /> Reserved</span>
                <span className="flex items-center gap-1 text-purple-400"><span className="w-2 h-2 rounded bg-purple-500" /> Cleaning</span>
                <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded bg-slate-600" /> Out of Service</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
              {beds.map((b) => {
                const statusStyles = {
                  AVAILABLE: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:border-emerald-400',
                  OCCUPIED: 'bg-blue-950/40 border-blue-500/40 text-blue-200 hover:border-blue-400',
                  RESERVED: 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-400',
                  AWAITING_CLEANING: 'bg-purple-950/40 border-purple-500/40 text-purple-200 hover:border-purple-400',
                  CLEANING_IN_PROGRESS: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 hover:border-indigo-400',
                  BLOCKED: 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:border-rose-400',
                  OUT_OF_SERVICE: 'bg-slate-800/80 border-slate-600 text-slate-400 opacity-70 hover:opacity-100',
                }[b.status];

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBedForDrawer(b)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${statusStyles} flex flex-col justify-between h-28`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{b.bedNumber}</span>
                        <span className="text-[9px] uppercase font-mono font-semibold px-1 rounded bg-black/40">
                          {b.status === 'CLEANING_IN_PROGRESS' ? 'CLEANING' : b.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{b.locationDescription}</p>
                    </div>

                    <div className="pt-1 border-t border-white/10 text-[10px] truncate">
                      {b.status === 'OCCUPIED' ? (
                        <span className="font-semibold text-blue-300 truncate block">
                          {b.activePatientName || 'Patient'}
                        </span>
                      ) : b.status === 'AVAILABLE' ? (
                        <span className="text-emerald-300 font-medium">Ready for Bed Allocation</span>
                      ) : b.status === 'OUT_OF_SERVICE' ? (
                        <span className="text-rose-400">Mechanical Repair</span>
                      ) : (
                        <span className="opacity-80">{b.blockReason || b.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Current Inpatients */}
        {activeTab === 3 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Current Admitted Inpatients</h3>
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Bed Number</th>
                  <th className="p-2.5">Patient Name</th>
                  <th className="p-2.5">Assignment ID</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {beds.filter((b) => b.status === 'OCCUPIED').map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-white">{b.bedNumber}</td>
                    <td className="p-2.5 font-medium text-blue-300">{b.activePatientName}</td>
                    <td className="p-2.5 font-mono text-slate-400">{b.activeAssignmentId || 'ASN-AUTO'}</td>
                    <td className="p-2.5">{b.locationDescription}</td>
                    <td className="p-2.5">
                      <button
                        onClick={() => setSelectedBedForDrawer(b)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
                      >
                        Manage Bed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Pending Admissions */}
        {activeTab === 4 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Pending Admission Requests</h3>
            {admissions.length === 0 ? (
              <p className="text-slate-400">No pending admissions for this ward.</p>
            ) : (
              <div className="space-y-2">
                {admissions.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{a.patientName}</span>
                        <span className="text-amber-400 font-semibold uppercase text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          {a.priority}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{a.hospitalNumber}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{a.clinicalNotes}</p>
                    </div>
                    <button
                      onClick={onAdmitClick}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg"
                    >
                      Allocate Bed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Bed Requests */}
        {activeTab === 5 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Inter-Ward Bed Demands</h3>
            {bedRequests.length === 0 ? (
              <p className="text-slate-400">No active bed requests for this ward.</p>
            ) : (
              <div className="space-y-2">
                {bedRequests.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{r.requestingDepartment}</span>
                      <span className="text-amber-300 font-semibold">{r.status}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{r.reason}</p>
                    <p className="text-slate-400 text-[10px] mt-1">Requested: {r.numberOfBeds} beds · Allocated: {r.allocatedQuantity || 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Transfers */}
        {activeTab === 6 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Patient Movements (Incoming / Outgoing)</h3>
            {transfers.length === 0 ? (
              <p className="text-slate-400">No active transfers involving this ward.</p>
            ) : (
              <div className="space-y-2">
                {transfers.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{t.patientName}</p>
                      <p className="text-slate-400 text-[11px]">{t.sendingWardName} → {t.receivingWardName}</p>
                      <p className="text-slate-300 mt-1">{t.clinicalReason}</p>
                    </div>
                    <span className="text-cyan-400 font-bold font-mono">{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Discharges */}
        {activeTab === 7 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Discharge Coordination</h3>
            {discharges.length === 0 ? (
              <p className="text-slate-400">No scheduled discharges recorded for this ward.</p>
            ) : (
              <div className="space-y-2">
                {discharges.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{d.patientName} ({d.bedNumber})</p>
                      <p className="text-slate-300">{d.summary}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Doctor: {d.dischargingDoctor}</p>
                    </div>
                    <span className="text-emerald-400 font-semibold">{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Cleaning & Bed Readiness */}
        {activeTab === 8 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Bed Turnaround & Sanitation Checklist</h3>
            {cleaningTasks.length === 0 ? (
              <p className="text-slate-400">All beds in this ward are sanitized and certified clean.</p>
            ) : (
              <div className="space-y-2">
                {cleaningTasks.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{c.bedNumber} ({c.id})</p>
                      <p className="text-slate-300">{c.notes}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Assigned: {c.assignedTo || 'Sanitation Team'}</p>
                    </div>
                    <span className="text-purple-400 font-bold">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Operational Updates */}
        {activeTab === 9 && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Operational Issue Reports</h3>
              <button
                onClick={() => onReportUpdateClick(wardSummary.wardId)}
                className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded text-xs font-semibold"
              >
                + New Report
              </button>
            </div>
            <div className="space-y-2">
              {wardUpdates.map((u) => (
                <div key={u.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="font-bold text-amber-300">{u.category}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(u.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 mt-1">{u.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Reported by: {u.reportedBy}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 10: Activity History */}
        {activeTab === 10 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Historical Ward Events</h3>
            <div className="space-y-2">
              {feedEvents.filter((e) => e.wardId === wardSummary.wardId).map((e) => (
                <div key={e.id} className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/40 flex justify-between">
                  <div>
                    <p className="font-semibold text-white">{e.title}</p>
                    <p className="text-slate-300">{e.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{e.staffName} · {new Date(e.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 11: Ward Reports */}
        {activeTab === 11 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Ward Efficiency & Bed Turnaround Indicators</h3>
            <div className="p-4 bg-slate-800/60 rounded-xl space-y-2">
              <p className="text-slate-300">
                Average Bed Turnaround Time:{' '}
                <span className="text-emerald-400 font-bold font-mono">36 minutes</span> (Hospital target: 45 min)
              </p>
              <p className="text-slate-300">
                Peak Occupancy Interval:{' '}
                <span className="text-white font-mono">14:00 - 18:00 GMT</span>
              </p>
              <p className="text-slate-300">
                Average Daily Admissions:{' '}
                <span className="text-white font-mono">6.2 patients/day</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Bed Drawer */}
      {selectedBedForDrawer && (
        <BedDetailDrawer
          bed={selectedBedForDrawer}
          onClose={() => setSelectedBedForDrawer(null)}
          onAdmitToBed={() => {
            setSelectedBedForDrawer(null);
            onAdmitClick();
          }}
          onRefresh={() => {
            api.getBeds({ wardId: wardSummary.wardId }).then(setBeds);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
