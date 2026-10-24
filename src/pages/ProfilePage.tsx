import React from 'react';
import { User, Shield, Clock, Phone, Mail, Building, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto text-xs">
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          <span>Staff User Profile & Active Session</span>
        </h1>
        <p className="text-slate-400 mt-1">
          Juaboso Government Hospital Credentials, Assigned Ward Permissions, and Security Status
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 shadow-xl">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-cyan-600/30 text-cyan-300 font-bold text-2xl flex items-center justify-center border border-cyan-500/40">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{currentUser.fullName}</h2>
            <p className="text-cyan-400 font-mono mt-0.5">{currentUser.role.replace(/_/g, ' ')}</p>
            <p className="text-slate-400">{currentUser.department}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400">Username Identifier:</span>
            <p className="font-mono text-white text-sm bg-slate-800/80 p-2 rounded-lg border border-slate-700 font-semibold">
              {currentUser.username}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400">Staff Account ID:</span>
            <p className="font-mono text-white text-sm bg-slate-800/80 p-2 rounded-lg border border-slate-700 font-semibold">
              {currentUser.id}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400">Email Address:</span>
            <p className="font-mono text-slate-200 bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentUser.email}</span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400">Ghana Phone Contact:</span>
            <p className="font-mono text-slate-200 bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser.phone}</span>
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Active Session & Security Compliance</span>
          </h3>
          <div className="p-3 bg-slate-800/40 rounded-xl space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Authentication Protocol:</span>
              <span className="text-white font-mono font-semibold">GHS Healthcare IAM / Role-Based Session</span>
            </div>
            <div className="flex justify-between">
              <span>Session Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Verified Active</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span>Data Protection Compliance:</span>
              <span className="text-cyan-300">Ghana Data Protection Act, 2012 (Act 843)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
