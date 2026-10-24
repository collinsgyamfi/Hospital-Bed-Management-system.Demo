import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  RotateCcw,
  Clock,
  Mail,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SystemSettings } from '../types/hospital.ts';

export const SettingsPage: React.FC = () => {
  const { settings, addToast, refreshData, resetDemo } = useHospital();
  const { currentUser, canManageSettings } = useAuth();

  const [form, setForm] = useState<SystemSettings>({
    hospitalName: 'Juaboso Government Hospital',
    hospitalCode: 'JGH-WN',
    region: 'Western North Region, Ghana',
    timezone: 'Africa/Accra',
    defaultWarningThreshold: 80,
    defaultCriticalThreshold: 90,
    bedTurnaroundTargetMinutes: 45,
    escalationEmail: 'director.operations@jgh.gov.gh',
    dataStaleThresholdMinutes: 30,
    isDemoData: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(form, currentUser);
      addToast('success', 'Settings Saved', 'Hospital system settings updated.');
      refreshData();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset hospital database to standard Juaboso Government Hospital demonstration state?')) {
      await resetDemo();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Hospital Operational Configuration & Thresholds</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Institutional parameters, capacity warning triggers, Ghana timezone, and escalation targets
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demonstration State</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Hospital Identity */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Healthcare Facility Identification</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Facility Name *</label>
              <input
                type="text"
                required
                disabled={!canManageSettings}
                value={form.hospitalName}
                onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Facility Code *</label>
              <input
                type="text"
                required
                disabled={!canManageSettings}
                value={form.hospitalCode}
                onChange={(e) => setForm({ ...form, hospitalCode: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Health Administrative Region *</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Operational Timezone</label>
              <input
                type="text"
                disabled
                value={form.timezone}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Capacity Thresholds */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Occupancy Alert Thresholds & Escalation</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">
                Warning Threshold (% Occupancy) — Section 3.D
              </label>
              <input
                type="number"
                min={50}
                max={95}
                disabled={!canManageSettings}
                value={form.defaultWarningThreshold}
                onChange={(e) => setForm({ ...form, defaultWarningThreshold: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-1">Default 80%: flags ward as APPROACHING CAPACITY</p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Critical Threshold (% Occupancy) — Section 3.D
              </label>
              <input
                type="number"
                min={70}
                max={100}
                disabled={!canManageSettings}
                value={form.defaultCriticalThreshold}
                onChange={(e) => setForm({ ...form, defaultCriticalThreshold: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-1">Default 90%: flags ward as HIGH OCCUPANCY</p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Bed Turnaround Target (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                disabled={!canManageSettings}
                value={form.bedTurnaroundTargetMinutes}
                onChange={(e) => setForm({ ...form, bedTurnaroundTargetMinutes: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Data Stale Threshold (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                disabled={!canManageSettings}
                value={form.dataStaleThresholdMinutes}
                onChange={(e) => setForm({ ...form, dataStaleThresholdMinutes: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">
                Operations Escalation Email
              </label>
              <input
                type="email"
                disabled={!canManageSettings}
                value={form.escalationEmail}
                onChange={(e) => setForm({ ...form, escalationEmail: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {canManageSettings ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-800/60 rounded-xl text-slate-400 text-center">
            You are logged in as {currentUser.role}. System Administrator role required to modify hospital-wide settings.
          </div>
        )}
      </form>
    </div>
  );
};
