import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { NotificationItem } from '../types/hospital.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const NotificationsCenterPage: React.FC = () => {
  const { notifications, acknowledgeNotification, addToast } = useHospital();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'UNACKNOWLEDGED' | 'ALL'>('UNACKNOWLEDGED');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filtered = notifications.filter((n) => {
    if (tab === 'UNACKNOWLEDGED' && n.acknowledged) return false;
    if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.acknowledged).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Operational Notifications & Escalation Center</span>
            </h1>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                {unreadCount} pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Threshold breaches, urgent bed requests, transfer delays, and clinical escalation warnings
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTab('UNACKNOWLEDGED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'UNACKNOWLEDGED'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Action ({unreadCount})
          </button>
          <button
            onClick={() => setTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'ALL'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Historical ({notifications.length})
          </button>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Filter Priority:</span>
        {['ALL', 'CRITICAL', 'URGENT', 'WARNING', 'INFO'].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              priorityFilter === p
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-white">All operational notifications resolved.</p>
            <p className="mt-1 text-slate-500">No pending capacity alerts or bed escalations requiring action.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const priorityStyles = {
              CRITICAL: 'bg-rose-950/20 border-rose-600/50 text-rose-200',
              URGENT: 'bg-amber-950/20 border-amber-600/50 text-amber-200',
              WARNING: 'bg-orange-950/20 border-orange-600/50 text-orange-200',
              INFO: 'bg-slate-900 border-slate-800 text-slate-200',
            }[n.priority];

            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border ${priorityStyles} flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-md`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{n.title}</span>
                    {n.wardName && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        {n.wardName}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40">
                      {n.priority}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Created: {new Date(n.createdAt).toLocaleString()}
                    {n.acknowledged && n.acknowledgedBy && (
                      <span className="text-emerald-400 ml-2">
                        · Acknowledged by {n.acknowledgedBy} at {new Date(n.acknowledgedAt!).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0">
                  {!n.acknowledged ? (
                    <button
                      onClick={() => acknowledgeNotification(n.id)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Acknowledge Alert</span>
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
