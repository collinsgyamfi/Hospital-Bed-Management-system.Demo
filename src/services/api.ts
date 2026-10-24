import {
  HospitalExecutiveKPIs,
  WardOccupancySummary,
  Ward,
  Department,
  Bed,
  AdmissionRequest,
  BedRequest,
  PatientTransfer,
  DischargeRecord,
  CleaningTask,
  MaintenanceTask,
  WardUpdate,
  OperationalEvent,
  NotificationItem,
  UserProfile,
  AuditLogItem,
  SystemSettings,
  BedStatus,
} from '../types/hospital.ts';

const BASE_URL = '/api';

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error: ${res.status} ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Stats & KPIs
  async getStats(): Promise<{ kpis: HospitalExecutiveKPIs; wardSummaries: WardOccupancySummary[]; settings: SystemSettings }> {
    const res = await fetch(`${BASE_URL}/stats`);
    return handleResponse(res);
  },

  // Wards
  async getWards(): Promise<{ wards: Ward[]; departments: Department[]; summaries: WardOccupancySummary[] }> {
    const res = await fetch(`${BASE_URL}/wards`);
    return handleResponse(res);
  },

  async updateWardThresholds(wardId: string, data: { warningThreshold?: number; criticalThreshold?: number; operationalCapacity?: number }, user?: any): Promise<Ward> {
    const res = await fetch(`${BASE_URL}/wards/${wardId}/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  // Beds
  async getBeds(params?: { wardId?: string; status?: string; category?: string }): Promise<Bed[]> {
    const query = new URLSearchParams();
    if (params?.wardId) query.set('wardId', params.wardId);
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    const res = await fetch(`${BASE_URL}/beds?${query.toString()}`);
    return handleResponse(res);
  },

  async changeBedStatus(bedId: string, status: BedStatus, reason?: string, user?: any): Promise<Bed> {
    const res = await fetch(`${BASE_URL}/beds/${bedId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, user }),
    });
    return handleResponse(res);
  },

  // Admissions
  async getAdmissions(): Promise<AdmissionRequest[]> {
    const res = await fetch(`${BASE_URL}/admissions`);
    return handleResponse(res);
  },

  async createAdmission(data: Partial<AdmissionRequest>, user?: any): Promise<AdmissionRequest> {
    const res = await fetch(`${BASE_URL}/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  async assignBedToAdmission(admissionId: string, bedId: string, notes?: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/admissions/${admissionId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedId, notes, user }),
    });
    return handleResponse(res);
  },

  // Bed Requests
  async getBedRequests(): Promise<BedRequest[]> {
    const res = await fetch(`${BASE_URL}/bed-requests`);
    return handleResponse(res);
  },

  async createBedRequest(data: Partial<BedRequest>, user?: any): Promise<BedRequest> {
    const res = await fetch(`${BASE_URL}/bed-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  async fulfillBedRequest(requestId: string, allocatedQuantity: number, notes?: string, user?: any): Promise<BedRequest> {
    const res = await fetch(`${BASE_URL}/bed-requests/${requestId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocatedQuantity, notes, user }),
    });
    return handleResponse(res);
  },

  // Transfers
  async getTransfers(): Promise<PatientTransfer[]> {
    const res = await fetch(`${BASE_URL}/transfers`);
    return handleResponse(res);
  },

  async createTransfer(data: Partial<PatientTransfer>, user?: any): Promise<PatientTransfer> {
    const res = await fetch(`${BASE_URL}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  async acceptTransfer(transferId: string, receivingBedId: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receivingBedId, user }),
    });
    return handleResponse(res);
  },

  async departTransfer(transferId: string, user?: any): Promise<PatientTransfer> {
    const res = await fetch(`${BASE_URL}/transfers/${transferId}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return handleResponse(res);
  },

  async confirmTransferArrival(transferId: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/transfers/${transferId}/confirm-arrival`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return handleResponse(res);
  },

  // Discharges
  async getDischarges(): Promise<DischargeRecord[]> {
    const res = await fetch(`${BASE_URL}/discharges`);
    return handleResponse(res);
  },

  async planDischarge(data: Partial<DischargeRecord>, user?: any): Promise<DischargeRecord> {
    const res = await fetch(`${BASE_URL}/discharges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  async confirmDischarge(dischargeId: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/discharges/${dischargeId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return handleResponse(res);
  },

  // Cleaning Tasks
  async getCleaningTasks(): Promise<CleaningTask[]> {
    const res = await fetch(`${BASE_URL}/cleaning`);
    return handleResponse(res);
  },

  async updateCleaningStatus(taskId: string, status: CleaningTask['status'], notes?: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/cleaning/${taskId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, user }),
    });
    return handleResponse(res);
  },

  // Maintenance Tasks
  async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    const res = await fetch(`${BASE_URL}/maintenance`);
    return handleResponse(res);
  },

  async reportMaintenance(data: Partial<MaintenanceTask>, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  async updateMaintenanceStatus(taskId: string, status: MaintenanceTask['status'], technician?: string, resolutionSummary?: string, user?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/maintenance/${taskId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, technician, resolutionSummary, user }),
    });
    return handleResponse(res);
  },

  // Ward Updates
  async getWardUpdates(): Promise<WardUpdate[]> {
    const res = await fetch(`${BASE_URL}/ward-updates`);
    return handleResponse(res);
  },

  async reportWardUpdate(data: Partial<WardUpdate>, user?: any): Promise<WardUpdate> {
    const res = await fetch(`${BASE_URL}/ward-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  // Feed & Events
  async getFeed(): Promise<OperationalEvent[]> {
    const res = await fetch(`${BASE_URL}/feed`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${BASE_URL}/notifications`);
    return handleResponse(res);
  },

  async acknowledgeNotification(notificationId: string, user?: any): Promise<NotificationItem> {
    const res = await fetch(`${BASE_URL}/notifications/${notificationId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return handleResponse(res);
  },

  // Reports
  async getReports(): Promise<any> {
    const res = await fetch(`${BASE_URL}/reports`);
    return handleResponse(res);
  },

  // Users & RBAC
  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${BASE_URL}/users`);
    return handleResponse(res);
  },

  async createUser(data: Partial<UserProfile>, user?: any): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch(`${BASE_URL}/audit-logs`);
    return handleResponse(res);
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },

  async updateSettings(settings: Partial<SystemSettings>, user?: any): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, user }),
    });
    return handleResponse(res);
  },

  // Reset Demo Data
  async resetDemoData(): Promise<any> {
    const res = await fetch(`${BASE_URL}/reset-demo`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Auth & Session
  async login(usernameOrEmail: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    return handleResponse(res);
  },

  async register(data: any): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async resetPassword(usernameOrEmail: string, newPassword: string, staffPin?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, newPassword, staffPin }),
    });
    return handleResponse(res);
  },

  async logout(user: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return handleResponse(res);
  },

  async getMe(token?: string): Promise<{ user: UserProfile }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/auth/me`, { headers });
    return handleResponse(res);
  },
};
