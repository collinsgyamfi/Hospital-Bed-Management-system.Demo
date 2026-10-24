import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { HospitalProvider } from './context/HospitalContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DemoDataBadge } from './components/DemoDataBadge.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

// Pages
import { DashboardOverview } from './pages/DashboardOverview.tsx';
import { WardsDirectory } from './pages/WardsDirectory.tsx';
import { WardWorkspace } from './pages/WardWorkspace.tsx';
import { BedManagementPage } from './pages/BedManagementPage.tsx';
import { BedMapPage } from './pages/BedMapPage.tsx';
import { AdmissionsPage } from './pages/AdmissionsPage.tsx';
import { BedRequestsPage } from './pages/BedRequestsPage.tsx';
import { TransfersPage } from './pages/TransfersPage.tsx';
import { DischargesPage } from './pages/DischargesPage.tsx';
import { CleaningReadinessPage } from './pages/CleaningReadinessPage.tsx';
import { MaintenancePage } from './pages/MaintenancePage.tsx';
import { OperationsFeedPage } from './pages/OperationsFeedPage.tsx';
import { NotificationsCenterPage } from './pages/NotificationsCenterPage.tsx';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage.tsx';
import { UserManagementPage } from './pages/UserManagementPage.tsx';
import { AuditLogsPage } from './pages/AuditLogsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

// Modals
import { AdmitPatientModal } from './components/modals/AdmitPatientModal.tsx';
import { CreateBedRequestModal } from './components/modals/CreateBedRequestModal.tsx';
import { RequestTransferModal } from './components/modals/RequestTransferModal.tsx';
import { PlanDischargeModal } from './components/modals/PlanDischargeModal.tsx';
import { ReportWardUpdateModal } from './components/modals/ReportWardUpdateModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { useAuth } from './context/AuthContext.tsx';

function MainAppContent() {
  const { openLogin } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedWardId, setSelectedWardId] = useState<string>('WARD-MMW');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modal triggers
  const [showAdmitModal, setShowAdmitModal] = useState<boolean>(false);
  const [showBedRequestModal, setShowBedRequestModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showDischargeModal, setShowDischargeModal] = useState<boolean>(false);
  const [showReportWardModal, setShowReportWardModal] = useState<boolean>(false);
  const [reportWardInitialId, setReportWardInitialId] = useState<string>('');

  const navigateTo = (page: string, params?: any) => {
    if (page === 'auth-portal') {
      openLogin();
      return;
    }
    if (params?.wardId) {
      setSelectedWardId(params.wardId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReportWard = (wardId?: string) => {
    setReportWardInitialId(wardId || '');
    setShowReportWardModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        onOpenNotifications={() => navigateTo('notifications')}
        onNavigate={navigateTo}
      />

      {/* Demo Data Banner (Section 1 & 22 Compliance) */}
      <DemoDataBadge />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={navigateTo}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 text-slate-100">
          {currentPage === 'dashboard' && (
            <DashboardOverview
              onNavigate={navigateTo}
              onAdmitClick={() => setShowAdmitModal(true)}
              onRequestBedClick={() => setShowBedRequestModal(true)}
              onReportWardClick={() => handleOpenReportWard()}
            />
          )}

          {currentPage === 'wards' && (
            <WardsDirectory
              onSelectWard={(wId) => {
                setSelectedWardId(wId);
                setCurrentPage('ward-workspace');
              }}
            />
          )}

          {currentPage === 'ward-workspace' && (
            <WardWorkspace
              wardId={selectedWardId}
              onBack={() => setCurrentPage('wards')}
              onAdmitClick={() => setShowAdmitModal(true)}
              onReportUpdateClick={(wId) => handleOpenReportWard(wId)}
            />
          )}

          {currentPage === 'beds' && (
            <BedManagementPage onAdmitClick={() => setShowAdmitModal(true)} />
          )}

          {currentPage === 'bed-map' && (
            <BedMapPage onAdmitClick={() => setShowAdmitModal(true)} />
          )}

          {currentPage === 'admissions' && (
            <AdmissionsPage onNewAdmissionClick={() => setShowAdmitModal(true)} />
          )}

          {currentPage === 'bed-requests' && (
            <BedRequestsPage onRequestBedClick={() => setShowBedRequestModal(true)} />
          )}

          {currentPage === 'transfers' && (
            <TransfersPage onNewTransferClick={() => setShowTransferModal(true)} />
          )}

          {currentPage === 'discharges' && (
            <DischargesPage onPlanDischargeClick={() => setShowDischargeModal(true)} />
          )}

          {currentPage === 'cleaning' && <CleaningReadinessPage />}

          {currentPage === 'maintenance' && <MaintenancePage />}

          {currentPage === 'feed' && (
            <OperationsFeedPage onReportWardClick={() => handleOpenReportWard()} />
          )}

          {currentPage === 'notifications' && <NotificationsCenterPage />}

          {currentPage === 'reports' && <ReportsAnalyticsPage />}

          {currentPage === 'users' && <UserManagementPage />}

          {currentPage === 'audit' && <AuditLogsPage />}

          {currentPage === 'settings' && <SettingsPage />}

          {currentPage === 'profile' && <ProfilePage />}
        </main>
      </div>

      {/* Global Modals */}
      {showAdmitModal && (
        <AdmitPatientModal
          onClose={() => setShowAdmitModal(false)}
          onSuccess={() => {
            setShowAdmitModal(false);
          }}
        />
      )}

      {showBedRequestModal && (
        <CreateBedRequestModal
          onClose={() => setShowBedRequestModal(false)}
          onSuccess={() => {
            setShowBedRequestModal(false);
          }}
        />
      )}

      {showTransferModal && (
        <RequestTransferModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
          }}
        />
      )}

      {showDischargeModal && (
        <PlanDischargeModal
          onClose={() => setShowDischargeModal(false)}
          onSuccess={() => {
            setShowDischargeModal(false);
          }}
        />
      )}

      {showReportWardModal && (
        <ReportWardUpdateModal
          initialWardId={reportWardInitialId}
          onClose={() => setShowReportWardModal(false)}
          onSuccess={() => {
            setShowReportWardModal(false);
          }}
        />
      )}

      {/* Authentication Modal (Sign In, Register, Demo Quick Login) */}
      <AuthModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <MainAppContent />
      </HospitalProvider>
    </AuthProvider>
  );
}
