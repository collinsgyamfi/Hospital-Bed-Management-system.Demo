import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  CheckCircle,
  Key,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { UserProfile, UserRole } from '../types/hospital.ts';
import { useHospital } from '../context/HospitalContext.tsx';

export const UserManagementPage: React.FC = () => {
  const { allUsers, currentUser, switchUser } = useAuth();
  const { addToast } = useHospital();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('NURSE');
  const [department, setDepartment] = useState('Internal Medicine');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = () => {
    api.getUsers().then(setUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!searchTerm) return true;
    const match =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      addToast('error', 'Error', 'Full name and username are required.');
      return;
    }

    try {
      setLoading(true);
      await api.createUser(
        {
          fullName: fullName.trim(),
          username: username.trim(),
          role,
          department,
          email: email.trim() || `${username.trim()}@jgh.gov.gh`,
          phone: phone.trim() || '+233 24 000 0000',
        },
        currentUser
      );

      addToast('success', 'User Created', `Staff account created for ${fullName}`);
      setShowAddModal(false);
      setFullName('');
      setUsername('');
      fetchUsers();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const rolesMatrix: { role: UserRole; title: string; desc: string; access: string }[] = [
    { role: 'SYSTEM_ADMIN', title: 'System Administrator', desc: 'Full system configuration, ward capacity edits, user creation', access: 'All Operations + Config' },
    { role: 'HOSPITAL_MANAGEMENT', title: 'Hospital Management', desc: 'Hospital-wide monitoring, capacity approval, operational reports', access: 'Executive Access' },
    { role: 'WARD_MANAGER', title: 'Ward Manager', desc: 'Ward bed inventory, local allocations, operational issue reporting', access: 'Assigned Ward Operations' },
    { role: 'DOCTOR', title: 'Doctor / Clinical Officer', desc: 'Clinical admission orders, transfer requests, discharge sign-off', access: 'Clinical Placement' },
    { role: 'ADMISSION_OFFICER', title: 'Admission Officer', desc: 'Triage coordination, bed reservation, patient placement', access: 'Admissions & Beds' },
    { role: 'NURSE', title: 'Staff Nurse', desc: 'Patient status recording, bed readiness updates, transfer prep', access: 'Ward Bed Care' },
    { role: 'CLEANING_MAINTENANCE', title: 'Cleaning & Bio-Eng Staff', desc: 'Sanitization execution, repair sign-off (no patient clinical access)', access: 'Sanitation & Repair Only' },
    { role: 'READ_ONLY_AUDITOR', title: 'Read-Only Auditor', desc: 'GHS quality audit, historical reporting, CSV export (no write permissions)', access: 'Read-Only Governance' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Staff User Accounts & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforcing least-privilege healthcare data access according to Ghana Health Service guidelines
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Role Matrix Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Configured Healthcare Role Permissions Matrix (Section 13)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {rolesMatrix.map((rm) => (
            <div key={rm.role} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white block">{rm.title}</span>
              <p className="text-[11px] text-slate-400 leading-tight">{rm.desc}</p>
              <span className="text-[10px] font-mono text-cyan-300 font-semibold block pt-1">
                Scope: {rm.access}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff full name, username, department, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member & ID</th>
                <th className="py-3 px-4">Operational Role</th>
                <th className="py-3 px-4">Clinical Department</th>
                <th className="py-3 px-4">Email / Ghana Contact</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Switch Active Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{u.fullName}</div>
                      <div className="font-mono text-[10px] text-cyan-400">{u.username} · {u.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {u.department}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-500">{u.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          Active User
                        </span>
                      ) : (
                        <button
                          onClick={() => switchUser(u.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition-colors"
                        >
                          Switch to User
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 text-slate-100">
            <h3 className="text-sm font-bold text-white">Create Healthcare Staff Account</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add authorized personnel with role-based clinical or operational privileges.
            </p>

            <form onSubmit={handleAddUser} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Cynthia Baffour"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cbaffour"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="WARD_MANAGER">Ward Manager</option>
                    <option value="DOCTOR">Doctor / Clinical Officer</option>
                    <option value="ADMISSION_OFFICER">Admission Officer</option>
                    <option value="NURSE">Staff Nurse</option>
                    <option value="CLEANING_MAINTENANCE">Cleaning & Maintenance Staff</option>
                    <option value="HOSPITAL_MANAGEMENT">Hospital Management</option>
                    <option value="SYSTEM_ADMIN">System Administrator</option>
                    <option value="READ_ONLY_AUDITOR">Read-Only Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@jgh.gov.gh"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone (Ghana)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
