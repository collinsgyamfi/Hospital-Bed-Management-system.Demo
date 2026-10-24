import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useHospital } from '../context/HospitalContext.tsx';
import { api } from '../services/api.ts';

export const ReportsAnalyticsPage: React.FC = () => {
  const { kpis, wardSummaries } = useHospital();
  const [reportData, setReportData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    api.getReports().then(setReportData);
  }, []);

  const handleExportCSV = () => {
    if (!wardSummaries) return;
    const headers = ['Ward Name', 'Installed Beds', 'Operational Beds', 'Occupied Beds', 'Available Beds', 'Occupancy Rate %', 'Status'];
    const rows = wardSummaries.map((w) => [
      `"${w.wardName}"`,
      w.installedCapacity,
      w.operationalCapacity,
      w.occupiedBeds,
      w.availableBeds,
      w.occupancyPercentage,
      `"${w.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `JGH_Executive_Occupancy_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!kpis) return null;

  const dailyTrend = reportData?.dailyTrends || [
    { day: 'Mon', occupied: 158, capacity: 195, rate: 81.0 },
    { day: 'Tue', occupied: 162, capacity: 195, rate: 83.1 },
    { day: 'Wed', occupied: 169, capacity: 195, rate: 86.6 },
    { day: 'Thu', occupied: 174, capacity: 195, rate: 89.2 },
    { day: 'Fri', occupied: 179, capacity: 195, rate: 91.8 },
    { day: 'Sat', occupied: 171, capacity: 195, rate: 87.7 },
    { day: 'Sun', occupied: kpis.occupiedBeds, capacity: kpis.operationalBeds, rate: kpis.occupancyRate },
  ];

  const deptData = reportData?.admissionsByDept || [
    { name: 'Emergency & Acute', count: 28 },
    { name: 'Internal Medicine', count: 18 },
    { name: 'General Surgery', count: 11 },
    { name: 'Obstetrics & Gynae', count: 16 },
    { name: 'Child Health', count: 9 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Management Analytics & Bed Occupancy Reporting</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconciled operational metrics, admission velocity, turnaround benchmarks, and statutory data exports
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metric Formulas Reference (Section 12.F Compliance) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 uppercase text-[10px] font-semibold">Hospital Occupancy Formula</p>
          <p className="font-mono text-cyan-300 font-bold mt-1 text-xs">
            Occupancy Rate = (Occupied Beds ÷ Operational Beds) × 100
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Current: ({kpis.occupiedBeds} ÷ {kpis.operationalBeds}) × 100 = <span className="text-white font-bold">{kpis.occupancyRate}%</span>
          </p>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 uppercase text-[10px] font-semibold">Bed Request Fulfillment Formula</p>
          <p className="font-mono text-emerald-300 font-bold mt-1 text-xs">
            Fulfillment Rate = (Allocated Beds ÷ Requested Beds) × 100
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Tracks satisfied clinical demand across all ward tickets
          </p>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 uppercase text-[10px] font-semibold">Bed Turnaround Benchmark</p>
          <p className="font-mono text-purple-300 font-bold mt-1 text-xs">
            Turnaround = Departure Confirmation → Certified AVAILABLE
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Target: &le; 45 mins · Current Hospital Avg: <span className="text-white font-bold">36 mins</span>
          </p>
        </div>
      </div>

      {/* Chart 1: 7-Day Occupancy Trend */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Hospital Bed Occupancy Trend (%)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Occupancy trajectory over the reporting period</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-semibold">
            7-Day Continuous
          </span>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="rate" name="Occupancy Rate %" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Admissions Velocity by Department */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Inpatient Admission Velocity by Department</h2>
            <p className="text-xs text-slate-400 mt-0.5">Admissions received and placed during the current period</p>
          </div>
        </div>

        <div className="h-60 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Admissions Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reconciled Ward Table for Audit / Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3">Reconciled Ward Capacity Table (Management Audit)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="p-2.5">Ward Name</th>
                <th className="p-2.5 text-center">Installed</th>
                <th className="p-2.5 text-center">Operational</th>
                <th className="p-2.5 text-center">Occupied</th>
                <th className="p-2.5 text-center">Available</th>
                <th className="p-2.5 text-center">Reserved</th>
                <th className="p-2.5 text-center">OOS</th>
                <th className="p-2.5 text-center">Occupancy %</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {wardSummaries.map((w) => (
                <tr key={w.wardId} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-sans font-semibold text-white">{w.wardName}</td>
                  <td className="p-2.5 text-center">{w.installedCapacity}</td>
                  <td className="p-2.5 text-center text-white font-bold">{w.operationalCapacity}</td>
                  <td className="p-2.5 text-center text-blue-400 font-bold">{w.occupiedBeds}</td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">{w.availableBeds}</td>
                  <td className="p-2.5 text-center text-amber-400">{w.reservedBeds}</td>
                  <td className="p-2.5 text-center text-rose-400">{w.outOfServiceBeds}</td>
                  <td className="p-2.5 text-center font-bold text-white">{w.occupancyPercentage}%</td>
                  <td className="p-2.5 text-center font-sans">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
