import React from 'react';
import {
  LayoutDashboard,
  Building,
  Bed,
  MapPin,
  UserPlus,
  GitPullRequest,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  Wrench,
  Activity,
  Bell,
  BarChart3,
  Users,
  FileText,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogIn,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const { kpis, unreadNotificationCount } = useHospital();

  const navGroups = [
    {
      title: 'EXECUTIVE OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'wards', label: 'Wards & Departments', icon: Building },
        { id: 'ward-workspace', label: 'Ward Workspace', icon: ClipboardList },
      ],
    },
    {
      title: 'BED OPERATIONS',
      items: [
        { id: 'beds', label: 'Bed Inventory', icon: Bed, badge: kpis ? `${kpis.availableBeds} Avail` : undefined },
        { id: 'bed-map', label: 'Interactive Bed Map', icon: MapPin },
      ],
    },
    {
      title: 'PATIENT FLOW',
      items: [
        { id: 'admissions', label: 'Admissions Queue', icon: UserPlus, badge: kpis?.awaitingAdmissionCount ? `${kpis.awaitingAdmissionCount}` : undefined },
        { id: 'bed-requests', label: 'Bed Requests & Surge', icon: GitPullRequest, badge: kpis?.pendingBedRequestsCount ? `${kpis.pendingBedRequestsCount}` : undefined },
        { id: 'transfers', label: 'Patient Transfers', icon: ArrowRightLeft, badge: kpis?.pendingTransfersCount ? `${kpis.pendingTransfersCount}` : undefined },
        { id: 'discharges', label: 'Discharge Management', icon: LogOut },
      ],
    },
    {
      title: 'SUPPORT & LOGISTICS',
      items: [
        { id: 'cleaning', label: 'Cleaning & Readiness', icon: Sparkles },
        { id: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench, badge: kpis?.bedsOutOfServiceCount ? `${kpis.bedsOutOfServiceCount} OOS` : undefined },
        { id: 'feed', label: 'Hospital Operations Feed', icon: Activity },
        { id: 'notifications', label: 'Notifications Center', icon: Bell, badge: unreadNotificationCount ? `${unreadNotificationCount}` : undefined },
      ],
    },
    {
      title: 'MANAGEMENT & ADMIN',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'users', label: 'User & Role Access', icon: Users },
        { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
        { id: 'settings', label: 'System Settings', icon: Settings },
        { id: 'profile', label: 'User Profile & Security', icon: UserCheck },
        { id: 'auth-portal', label: 'Staff Sign In / Register', icon: LogIn },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2 custom-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {!collapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        item.badge.includes('Avail')
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.badge.includes('OOS')
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
