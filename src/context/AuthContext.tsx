import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/hospital.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authModalTab: 'login' | 'register' | 'demo' | 'reset';
  setAuthModalTab: (tab: 'login' | 'register' | 'demo' | 'reset') => void;
  openLogin: () => void;
  openRegister: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  canApproveAdmissions: boolean;
  canAssignBeds: boolean;
  canInitiateTransfers: boolean;
  canConfirmDischarge: boolean;
  canSubmitBedRequests: boolean;
  canManageSettings: boolean;
  canUpdateCleaning: boolean;
  canUpdateMaintenance: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  isReadOnly: boolean;
}

const DEFAULT_USER: UserProfile = {
  id: 'USR-MGMT',
  username: 'medical_dir',
  fullName: 'Dr. Kwabena Frimpong-Mansoh',
  role: 'HOSPITAL_MANAGEMENT',
  department: 'Hospital Directorate',
  email: 'medical.director@jgh.gov.gh',
  phone: '+233 20 812 3456',
  active: true,
  lastLoginAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jgh_token'));
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'demo' | 'reset'>('login');

  useEffect(() => {
    api.getUsers().then((users) => {
      if (users && users.length > 0) {
        setAllUsers(users);
        const savedUserId = localStorage.getItem('jgh_user_id');
        if (savedUserId) {
          const matched = users.find((u) => u.id === savedUserId);
          if (matched) {
            setCurrentUser(matched);
            setIsAuthenticated(true);
            return;
          }
        }
        const mgmt = users.find((u) => u.role === 'HOSPITAL_MANAGEMENT') || users[0];
        setCurrentUser(mgmt);
        setIsAuthenticated(true);
      }
    }).catch(console.error);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await api.login(usernameOrEmail, password);
    setCurrentUser(res.user);
    setToken(res.token);
    setIsAuthenticated(true);
    localStorage.setItem('jgh_token', res.token);
    localStorage.setItem('jgh_user_id', res.user.id);

    // Refresh all users list
    const users = await api.getUsers();
    setAllUsers(users);
  };

  const register = async (formData: any) => {
    const res = await api.register(formData);
    setCurrentUser(res.user);
    setToken(res.token);
    setIsAuthenticated(true);
    localStorage.setItem('jgh_token', res.token);
    localStorage.setItem('jgh_user_id', res.user.id);

    const users = await api.getUsers();
    setAllUsers(users);
  };

  const logout = async () => {
    try {
      await api.logout(currentUser);
    } catch {
      // ignore
    }
    setToken(null);
    localStorage.removeItem('jgh_token');
    localStorage.removeItem('jgh_user_id');
    setIsAuthenticated(false);
    setAuthModalTab('login');
    setShowAuthModal(true);
  };

  const openLogin = () => {
    setAuthModalTab('login');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthModalTab('register');
    setShowAuthModal(true);
  };

  const switchUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('jgh_user_id', user.id);
    }
  };

  const switchRole = (role: UserRole) => {
    const userWithRole = allUsers.find((u) => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
      localStorage.setItem('jgh_user_id', userWithRole.id);
    } else {
      const newUser: UserProfile = {
        ...currentUser,
        id: `USR-CUSTOM-${role}`,
        role,
        fullName: `${role.replace(/_/g, ' ')} Officer`,
      };
      setCurrentUser(newUser);
    }
  };

  // RBAC Permission Gates (Test 8 compliance)
  const role = currentUser.role;

  const canApproveAdmissions =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'ADMISSION_OFFICER' || role === 'DOCTOR';

  const canAssignBeds =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'WARD_MANAGER' || role === 'ADMISSION_OFFICER';

  const canInitiateTransfers =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'WARD_MANAGER' || role === 'DOCTOR' || role === 'NURSE';

  const canConfirmDischarge =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'WARD_MANAGER' || role === 'DOCTOR';

  const canSubmitBedRequests =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'WARD_MANAGER' || role === 'NURSE' || role === 'ADMISSION_OFFICER';

  const canManageSettings = role === 'SYSTEM_ADMIN';

  const canUpdateCleaning =
    role === 'SYSTEM_ADMIN' || role === 'CLEANING_MAINTENANCE' || role === 'WARD_MANAGER';

  const canUpdateMaintenance =
    role === 'SYSTEM_ADMIN' || role === 'CLEANING_MAINTENANCE' || role === 'WARD_MANAGER';

  const canViewReports = role !== 'CLEANING_MAINTENANCE';

  const canExportData =
    role === 'SYSTEM_ADMIN' || role === 'HOSPITAL_MANAGEMENT' || role === 'READ_ONLY_AUDITOR';

  const isReadOnly = role === 'READ_ONLY_AUDITOR';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated,
        token,
        login,
        register,
        logout,
        showAuthModal,
        setShowAuthModal,
        authModalTab,
        setAuthModalTab,
        openLogin,
        openRegister,
        switchUser,
        switchRole,
        canApproveAdmissions,
        canAssignBeds,
        canInitiateTransfers,
        canConfirmDischarge,
        canSubmitBedRequests,
        canManageSettings,
        canUpdateCleaning,
        canUpdateMaintenance,
        canViewReports,
        canExportData,
        isReadOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
