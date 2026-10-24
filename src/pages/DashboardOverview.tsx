import React, { useState } from 'react';
import {
  Bed,
  CheckCircle,
  Users,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Wrench,
  ShieldAlert,
  GitPullRequest,
  Activity,
  Filter,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useHospital } from '../context/HospitalContext.tsx';
import { WardOccupancySummary, OperationalEvent } from '../types/hospital.ts';

interface DashboardOverviewProps {
  onNavigate: (page: string, params?: any) => void;
  onAdmitClick: () => void;
  onRequestBedClick: () => void;
  onReportWardClick: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onAdmitClick,
  onRequestBedClick,
  onReportWardClick,
}) => {
  const { kpis, wardSummaries, feedEvents, selectedPeriod, setSelectedPeriod } = useHospital();

  const [feedFilterType, setFeedFilterType] = useState<string>('ALL');
  const [feedFilterPriority, setFeedFilterPriority] = useState<string>('ALL');

  if (!kpis) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-2" />
        <span>Loading Juaboso Government Hospital Dashboard...</span>
      </div>
    );
  }

  // Pie chart data for mutually exclusive bed states
  const doughnutData = [
    { name: 'Occupied Beds', value: kpis.occupiedBeds, color: '#3b82f6' }, // Blue
    { name: 'Available Beds', value: kpis.availableBeds, color: '#10b981' }, // Green
    { name: 'Reserved Beds', value: kpis.reservedBeds, color: '#f59e0b' }, // Amber
    { name: 'Blocked / Cleaning', value: kpis.blockedBeds, color: '#8b5cf6' }, // Purple
    { name: 'Out of Service', value: kpis.outOfServiceBeds, color: '#64748b' }, // Slate
  ];

  // Filter feed items
  const filteredEvents = feedEvents.filter((evt) => {
    if (feedFilterType !== 'ALL' && evt.eventType !== feedFilterType) return false;
    if (feedFilterPriority !== 'ALL' && evt.priority !== feedFilterPriority) return false;
    return true;
  });

  const getWardStatusBadge = (status: WardOccupancySummary['status']) => {
    switch (status) {
      case 'NORMAL':
        return <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">NORMAL</span>;
      case 'APPROACHING_CAPACITY':
        return <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">APPROACHING CAPACITY</span>;
      case 'HIGH_OCCUPANCY':
        return <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded">HIGH OCCUPANCY</span>;
      case 'FULL':
        return <span className="text-[11px] font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded">FULL</span>;
      case 'OVER_CAPACITY':
        return <span className="text-[11px] font-semibold text-rose-200 bg-rose-600/30 border border-rose-500 px-2 py-0.5 rounded animate-pulse">OVER CAPACITY</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header & Quick Operational Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Executive Hospital Command Overview
            </h1>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
              GHS Tier-2 Facility
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bed availability, ward pressure indicators, and coordinated patient flow
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAdmitClick}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Admit Patient</span>
          </button>
          <button
            onClick={onRequestBedClick}
            className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Request Beds</span>
          </button>
          <button
            onClick={onReportWardClick}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Report Ward Issue</span>
          </button>
        </div>
      </div>

      {/* 10 Key Performance Indicator Cards (Section 3.A) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Installed Beds */}
        <div
          onClick={() => onNavigate('wards')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">1. Total Installed</span>
            <Bed className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{kpis.totalInstalledBeds}</span>
            <span className="text-[10px] text-slate-400">beds</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">All commissioned wards</p>
        </div>

        {/* Card 2: Operational Beds */}
        <div
          onClick={() => onNavigate('beds')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">2. Operational Beds</span>
            <CheckCircle className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-400">{kpis.operationalBeds}</span>
            <span className="text-[10px] text-slate-400">active</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">In clinical service</p>
        </div>

        {/* Card 3: Occupied Beds */}
        <div
          onClick={() => onNavigate('beds', { status: 'OCCUPIED' })}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">3. Occupied Beds</span>
            <Users className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-400">{kpis.occupiedBeds}</span>
            <span className="text-[10px] text-slate-400">patients</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Active inpatients</p>
        </div>

        {/* Card 4: Available Beds */}
        <div
          onClick={() => onNavigate('beds', { status: 'AVAILABLE' })}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">4. Available Beds</span>
            <Bed className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-300">{kpis.availableBeds}</span>
            <span className="text-[10px] text-slate-400">ready</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Unoccupied & unreserved</p>
        </div>

        {/* Card 5: Hospital Occupancy Rate */}
        <div
          onClick={() => onNavigate('reports')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">5. Occupancy Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${kpis.occupancyRate >= 90 ? 'text-rose-400' : kpis.occupancyRate >= 80 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {kpis.occupancyRate}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">
            {kpis.occupiedBeds} ÷ {kpis.operationalBeds} beds
          </p>
        </div>

        {/* Card 6: Patients Awaiting Admission */}
        <div
          onClick={() => onNavigate('admissions')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">6. Awaiting Placement</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-300">{kpis.awaitingAdmissionCount}</span>
            <span className="text-[10px] text-slate-400">in queue</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Approved pending bed</p>
        </div>

        {/* Card 7: Pending Bed Requests */}
        <div
          onClick={() => onNavigate('bed-requests')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">7. Bed Requests</span>
            <GitPullRequest className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-purple-300">{kpis.pendingBedRequestsCount}</span>
            {kpis.urgentBedRequestsCount > 0 && (
              <span className="text-[10px] font-semibold text-rose-400 ml-1">
                ({kpis.urgentBedRequestsCount} urgent)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Unresolved requests</p>
        </div>

        {/* Card 8: Pending Transfers */}
        <div
          onClick={() => onNavigate('transfers')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">8. Pending Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-cyan-300">{kpis.pendingTransfersCount}</span>
            <span className="text-[10px] text-slate-400">transits</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Inter-ward movements</p>
        </div>

        {/* Card 9: Beds Out of Service */}
        <div
          onClick={() => onNavigate('maintenance')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">9. Out of Service</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-300">{kpis.bedsOutOfServiceCount}</span>
            <span className="text-[10px] text-slate-400">beds</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Repairs / Defective</p>
        </div>

        {/* Card 10: Wards Requiring Attention */}
        <div
          onClick={() => onNavigate('wards')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium tracking-tight">10. At Threshold</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${kpis.wardsRequiringAttentionCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {kpis.wardsRequiringAttentionCount}
            </span>
            <span className="text-[10px] text-slate-400">wards</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">&ge; warning threshold</p>
        </div>
      </div>

      {/* Middle Section: Doughnut Capacity Breakdown + Occupancy by Ward Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 3.B: Hospital Occupancy Doughnut Visualization */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">Hospital Capacity Reconciliation</h2>
              <span className="text-[11px] font-mono text-slate-400">
                {kpis.totalInstalledBeds} Total Beds
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mutually exclusive distribution. Beds outside operational service ({kpis.outOfServiceBeds}) are excluded from the operational denominator ({kpis.operationalBeds}).
            </p>
          </div>

          <div className="h-52 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={doughnutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {doughnutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800">
            {doughnutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <div className="font-mono font-medium">
                  {item.value} <span className="text-slate-400 text-[11px]">({((item.value / kpis.totalInstalledBeds) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3.C: Occupancy by Ward (Horizontal Progress Bars with thresholds) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Occupancy by Ward & Operational Unit</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target warning threshold: 80% · Critical threshold: 90%
              </p>
            </div>
            <button
              onClick={() => onNavigate('wards')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Ward Directory</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {wardSummaries.map((w) => {
              const isOver = w.occupancyPercentage > 100;
              const isCritical = w.occupancyPercentage >= w.criticalThreshold;
              const isWarning = w.occupancyPercentage >= w.warningThreshold;

              const barColor = isOver
                ? 'bg-rose-500'
                : isCritical
                ? 'bg-orange-500'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-cyan-500';

              return (
                <div
                  key={w.wardId}
                  onClick={() => onNavigate('ward-workspace', { wardId: w.wardId })}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{w.wardName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({w.wardCode})</span>
                      {getWardStatusBadge(w.status)}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-300">
                        {w.occupiedBeds} / {w.operationalCapacity} beds
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {w.availableBeds} Avail
                      </span>
                      <span className="font-bold text-white w-12 text-right">
                        {w.occupancyPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar with 80% and 90% markers */}
                  <div className="relative w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, w.occupancyPercentage)}%` }}
                    />
                    {/* 80% Warning Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                      style={{ left: '80%' }}
                      title="Warning threshold (80%)"
                    />
                    {/* 90% Critical Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10"
                      style={{ left: '90%' }}
                      title="Critical threshold (90%)"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3.E: Live Hospital Activity Feed ("What's Happening Across the Hospital") */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white">
                What's Happening Across the Hospital (Live Feed)
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative event trail connecting wards, admission queues, transfers, and sanitization
              </p>
            </div>
          </div>

          {/* Event Filters */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={feedFilterType}
              onChange={(e) => setFeedFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="ALL">All Event Types</option>
              <option value="ADMISSION">Admissions</option>
              <option value="DISCHARGE">Discharges</option>
              <option value="TRANSFER">Transfers</option>
              <option value="BED_STATUS">Bed Changes</option>
              <option value="BED_REQUEST">Bed Requests</option>
              <option value="CLEANING">Cleaning & Ready</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="CAPACITY_WARNING">Capacity Warnings</option>
              <option value="WARD_UPDATE">Ward Reports</option>
            </select>

            <select
              value={feedFilterPriority}
              onChange={(e) => setFeedFilterPriority(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Live Event Stream List */}
        <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent operational events match the selected filters.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const priorityColors = {
                CRITICAL: 'border-l-4 border-l-rose-500 bg-rose-950/20',
                URGENT: 'border-l-4 border-l-amber-500 bg-amber-950/20',
                WARNING: 'border-l-4 border-l-orange-500 bg-orange-950/20',
                INFO: 'border-l-4 border-l-cyan-500 bg-slate-800/40',
              }[evt.priority];

              return (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border border-slate-800 ${priorityColors} flex items-start justify-between gap-3 text-xs`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{evt.title}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                        {evt.wardName}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {evt.eventType}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{evt.description}</p>
                    {evt.actionRequired && (
                      <p className="text-[11px] text-amber-300 font-medium">
                        Action Required: {evt.actionRequired}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                      <span>Staff: {evt.staffName}</span>
                      <span>·</span>
                      <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{evt.status}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        evt.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : evt.priority === 'URGENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {evt.priority}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
