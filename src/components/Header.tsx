import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  Clock,
  Shield,
  User,
  AlertTriangle,
  ChevronDown,
  Building2,
  CheckCircle2,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/hospital.ts';

interface HeaderProps {
  onOpenNotifications: () => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onNavigate }) => {
  const {
    connectionStatus,
    lastSyncTime,
    isDataStale,
    unreadNotificationCount,
    globalSearch,
    setGlobalSearch,
    refreshData,
  } = useHospital();

  const {
    currentUser,
    allUsers,
    switchUser,
    switchRole,
    isAuthenticated,
    openLogin,
    openRegister,
    logout,
  } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Africa/Accra (Ghana GMT) real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Accra',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const rolesList: { role: UserRole; label: string }[] = [
    { role: 'HOSPITAL_MANAGEMENT', label: 'Hospital Management (Dir)' },
    { role: 'SYSTEM_ADMIN', label: 'System Administrator' },
    { role: 'WARD_MANAGER', label: 'Ward Manager (MMW)' },
    { role: 'DOCTOR', label: 'Doctor / Clinical Officer' },
    { role: 'ADMISSION_OFFICER', label: 'Admission Officer' },
    { role: 'NURSE', label: 'Staff Nurse' },
    { role: 'CLEANING_MAINTENANCE', label: 'Cleaning & Maintenance' },
    { role: 'READ_ONLY_AUDITOR', label: 'Read-Only Auditor' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
      {/* Brand & Crest */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
          <Building2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-white text-base">
              Juaboso Government Hospital
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Western North
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            JGH Smart Bed Management System
          </p>
        </div>
      </div>

      {/* Middle: Ghana Time & Global Search */}
      <div className="flex-1 max-w-xl hidden md:flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed, patient (e.g. Kwame), ward, or ticket..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Africa/Accra Timezone */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-800/60 px-2.5 py-1.5 rounded-md border border-slate-700/60 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Accra (GMT): {currentTime || 'Loading...'}</span>
        </div>
      </div>

      {/* Right Controls: Sync status, Notifications, User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
          {connectionStatus === 'connected' && !isDataStale ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 hidden sm:inline">Live Sync</span>
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-400">Reconnecting...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 font-medium">Data Stale</span>
            </>
          )}

          <button
            onClick={handleManualRefresh}
            title="Refresh Hospital Data"
            className="ml-1 text-slate-400 hover:text-white transition-colors p-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Notifications Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* User Account / Auth Menu */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={openLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Staff Sign In</span>
            </button>
            <button
              onClick={openRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-semibold text-xs border border-cyan-500/40">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-xs leading-none">
                <p className="font-medium text-slate-100">{currentUser.fullName}</p>
                <p className="text-[10px] text-cyan-400 mt-0.5">{currentUser.role.replace(/_/g, ' ')}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Active Staff Member</p>
                <p className="font-semibold text-slate-100 text-sm">{currentUser.fullName}</p>
                <p className="text-slate-400">{currentUser.department}</p>
                <div className="mt-1 flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
                  <Shield className="w-3 h-3" />
                  <span>Role: {currentUser.role}</span>
                </div>
              </div>

              {/* Quick Role Switcher for Test & Demo */}
              <div className="px-3.5 pt-2 pb-1">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">
                  Switch Operational Role (RBAC Demo)
                </p>
                <div className="mt-1.5 space-y-1 max-h-48 overflow-y-auto">
                  {rolesList.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                        currentUser.role === r.role
                          ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{r.label}</span>
                      {currentUser.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 mt-2 pt-2 px-3 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('profile');
                  }}
                  className="w-full text-left py-1.5 text-slate-300 hover:text-white flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Profile & Security</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    openRegister();
                  }}
                  className="w-full text-left py-1.5 text-cyan-300 hover:text-cyan-200 flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Register New Staff Account</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left py-1.5 text-rose-400 hover:text-rose-300 flex items-center gap-2 border-t border-slate-800/80 mt-1 pt-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out / Lock Workstation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
};
