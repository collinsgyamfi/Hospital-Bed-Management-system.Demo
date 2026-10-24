import React, { useState } from 'react';
import {
  Building2,
  X,
  Lock,
  User,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useHospital } from '../../context/HospitalContext.tsx';
import { UserRole } from '../../types/hospital.ts';
import { api } from '../../services/api.ts';

export const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    allUsers,
    switchUser,
    isAuthenticated,
  } = useAuth();

  const { addToast } = useHospital();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('NURSE');
  const [regDepartment, setRegDepartment] = useState('Internal Medicine');
  const [regStaffPin, setRegStaffPin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Reset password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showAuthModal) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Please enter both your work username/email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginIdentifier.trim(), loginPassword);
      addToast('success', 'Sign In Successful', 'Welcome to JGH Smart Bed Management System.');
      setShowAuthModal(false);
      setLoginPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regFullName.trim() || !regUsername.trim()) {
      setErrorMsg('Full name and username are required.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must confirm adherence to Ghana Data Protection Act 843 healthcare confidentiality.');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim() || `${regUsername.trim()}@jgh.gov.gh`,
        phone: regPhone.trim() || '+233 24 000 0000',
        role: regRole,
        department: regDepartment,
        staffPin: regStaffPin.trim() || `PIN-${Math.floor(1000 + Math.random() * 9000)}`,
        password: regPassword,
      });

      addToast('success', 'Staff Account Registered', `Welcome, ${regFullName}. You are now signed in.`);
      setShowAuthModal(false);
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resetIdentifier.trim() || !resetNewPassword) {
      setErrorMsg('Please enter your username/email and new password.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await api.resetPassword(resetIdentifier.trim(), resetNewPassword, resetPin.trim());
      addToast('success', 'Password Updated', 'Your password has been reset. Please sign in.');
      setAuthModalTab('login');
      setLoginIdentifier(resetIdentifier.trim());
      setResetNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = (user: any) => {
    switchUser(user.id);
    addToast('success', 'Demo Sign-In', `Signed in as ${user.fullName} (${user.role.replace(/_/g, ' ')})`);
    setShowAuthModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-100 flex flex-col">
        {/* Hospital Branding Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Juaboso Government Hospital</span>
                <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Western North
                </span>
              </div>
              <p className="text-xs text-slate-400">
                JGH Smart Bed Management & Operations Authentication Portal
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 text-xs font-semibold">
          <button
            onClick={() => {
              setAuthModalTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authModalTab === 'login'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Sign In</span>
          </button>

          <button
            onClick={() => {
              setAuthModalTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authModalTab === 'register'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up / Register</span>
          </button>

          <button
            onClick={() => {
              setAuthModalTab('demo');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authModalTab === 'demo'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Demo Logins</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Tab 1: Staff Sign In Form */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Work Username or Official Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. medical_dir or kowusu@jgh.gov.gh"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Workstation Password *</label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('reset');
                    setErrorMsg(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Remember this workstation session</span>
              </label>

              <span className="text-slate-500">Ghana Time (Africa/Accra)</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating Staff...' : 'Sign In to JGH Bed System'}</span>
            </button>

            <div className="pt-2 text-center text-slate-400 text-xs">
              Need a staff account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setErrorMsg(null);
                }}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Register as new hospital staff
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Staff Sign Up / Register Form */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ama Boateng"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Username Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aboateng"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Hospital Email</label>
                <input
                  type="email"
                  placeholder="name@jgh.gov.gh"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ghana Phone Contact</label>
                <input
                  type="text"
                  placeholder="+233 24 123 4567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="NURSE">Staff Nurse</option>
                  <option value="WARD_MANAGER">Ward Manager</option>
                  <option value="DOCTOR">Doctor / Clinical Officer</option>
                  <option value="ADMISSION_OFFICER">Admission Officer</option>
                  <option value="CLEANING_MAINTENANCE">Cleaning & Sanitation Staff</option>
                  <option value="HOSPITAL_MANAGEMENT">Hospital Directorate / Management</option>
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                  <option value="READ_ONLY_AUDITOR">Read-Only Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical Department *</label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Staff Identification PIN / Employee Number
              </label>
              <input
                type="text"
                placeholder="e.g. PIN-8831 (used for password self-service recovery)"
                value={regStaffPin}
                onChange={(e) => setRegStaffPin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Password * (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <span>
                  I confirm that I am an authorized healthcare employee of Juaboso Government Hospital and agree to comply with the Ghana Data Protection Act, 2012 (Act 843) patient confidentiality protocols.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Registering Account...' : 'Register Staff Account'}</span>
            </button>

            <div className="text-center text-slate-400 text-xs">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setErrorMsg(null);
                }}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: 1-Click Fast Demo Login (Tester convenience) */}
        {authModalTab === 'demo' && (
          <div className="p-6 space-y-3.5 text-xs">
            <p className="text-slate-400">
              Select any pre-configured Juaboso Government Hospital staff persona to instantly sign in and test role-based permissions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const roleColors = {
                  HOSPITAL_MANAGEMENT: 'bg-cyan-950 text-cyan-300 border-cyan-800',
                  SYSTEM_ADMIN: 'bg-purple-950 text-purple-300 border-purple-800',
                  WARD_MANAGER: 'bg-blue-950 text-blue-300 border-blue-800',
                  DOCTOR: 'bg-emerald-950 text-emerald-300 border-emerald-800',
                  ADMISSION_OFFICER: 'bg-amber-950 text-amber-300 border-amber-800',
                  NURSE: 'bg-teal-950 text-teal-300 border-teal-800',
                  CLEANING_MAINTENANCE: 'bg-slate-800 text-slate-300 border-slate-700',
                  READ_ONLY_AUDITOR: 'bg-orange-950 text-orange-300 border-orange-800',
                }[u.role] || 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={u.id}
                    onClick={() => handleQuickDemoLogin(u)}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/70 hover:border-cyan-500 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{u.fullName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${roleColors}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{u.department}</p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>User: {u.username}</span>
                      <span className="text-cyan-400 font-semibold">1-Click Sign In &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Password Reset Form */}
        {authModalTab === 'reset' && (
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-cyan-200">
              Provide your username or email and staff PIN to securely reset your workstation credentials.
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Work Username or Email *
              </label>
              <input
                type="text"
                required
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                placeholder="e.g. kowusu or kowusu@jgh.gov.gh"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Staff Identification PIN (if configured)
              </label>
              <input
                type="text"
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value)}
                placeholder="Staff PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                New Workstation Password * (min 6 characters)
              </label>
              <input
                type="password"
                required
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAuthModalTab('login')}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
