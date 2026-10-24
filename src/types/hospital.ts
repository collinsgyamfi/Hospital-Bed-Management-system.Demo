export type BedStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'AWAITING_CLEANING'
  | 'CLEANING_IN_PROGRESS'
  | 'BLOCKED'
  | 'OUT_OF_SERVICE';

export type WardOperationalStatus =
  | 'NORMAL'
  | 'APPROACHING_CAPACITY'
  | 'HIGH_OCCUPANCY'
  | 'FULL'
  | 'OVER_CAPACITY'
  | 'SERVICE_DISRUPTION'
  | 'DATA_STALE';

export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'HOSPITAL_MANAGEMENT'
  | 'WARD_MANAGER'
  | 'NURSE'
  | 'ADMISSION_OFFICER'
  | 'DOCTOR'
  | 'CLEANING_MAINTENANCE'
  | 'READ_ONLY_AUDITOR';

export type AdmissionPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type AdmissionStatus = 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'REJECTED' | 'ADMITTED';

export type BedRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';

export type TransferStatus =
  | 'REQUESTED'
  | 'AWAITING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'READY_FOR_TRANSFER'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type DischargeStatus = 'PLANNED' | 'READY' | 'CONFIRMED' | 'CANCELLED';

export type CleaningTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED';

export type MaintenanceTaskStatus = 'REPORTED' | 'IN_PROGRESS' | 'REPAIRED' | 'RETURNED_TO_SERVICE';

export type NotificationPriority = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';

export interface Hospital {
  id: string;
  name: string;
  code: string;
  region: string;
  district: string;
  country: string;
  timezone: string;
  totalInstalledBeds: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description: string;
}

export interface Ward {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  wardManager: string;
  installedCapacity: number;
  operationalCapacity: number;
  warningThreshold: number; // e.g. 80
  criticalThreshold: number; // e.g. 90
  lastSyncTime: string;
  isStale?: boolean;
}

export interface Bed {
  id: string; // e.g. JGH-MMW-001
  wardId: string;
  bedNumber: string;
  category: 'Standard Inpatient' | 'ICU / Critical Care' | 'Isolation' | 'Paediatric Cot' | 'Maternity Delivery' | 'Step-down';
  locationDescription: string;
  status: BedStatus;
  activePatientId?: string;
  activePatientName?: string;
  activeAssignmentId?: string;
  cleaningStatus?: 'CLEAN' | 'NEEDS_CLEANING' | 'IN_PROGRESS';
  maintenanceStatus?: 'OPERATIONAL' | 'NEEDS_REPAIR' | 'UNDER_REPAIR';
  blockReason?: string;
  lastStatusChange: string;
  lastModifiedBy: string;
}

export interface BedStatusHistory {
  id: string;
  bedId: string;
  wardId: string;
  fromStatus: BedStatus;
  toStatus: BedStatus;
  timestamp: string;
  changedBy: string;
  reason?: string;
}

export interface Patient {
  id: string;
  hospitalNumber: string; // e.g. JGH-PT-8821
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  bloodGroup?: string;
  emergencyContact: string;
  maskedNationalId?: string; // Ghana Card format: GHA-723****-2
  currentWardId?: string;
  currentBedId?: string;
}

export interface AdmissionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  hospitalNumber: string;
  referringDepartment: string;
  requestedWardId: string;
  requestedWardName: string;
  bedCategory: string;
  priority: AdmissionPriority;
  clinicalNotes: string;
  requestedBy: string;
  requestTime: string;
  status: AdmissionStatus;
  allocatedBedId?: string;
  allocatedBedNumber?: string;
  isEmergencyOverride?: boolean;
  notes?: string;
}

export interface BedAssignment {
  id: string;
  bedId: string;
  bedNumber: string;
  patientId: string;
  patientName: string;
  wardId: string;
  wardName: string;
  assignedAt: string;
  releasedAt?: string;
  assignedBy: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'DISCHARGED';
}

export interface BedRequest {
  id: string;
  requestingDepartment: string;
  requestedWardId?: string;
  requestedWardName?: string;
  numberOfBeds: number;
  allocatedQuantity: number;
  bedCategory: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  reason: string;
  submittedAt: string;
  requestingStaff: string;
  assignedManager?: string;
  status: BedRequestStatus;
  resolutionNotes?: string;
  escalated?: boolean;
}

export interface PatientTransfer {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  sendingWardId: string;
  sendingWardName: string;
  sendingBedId: string;
  receivingWardId: string;
  receivingWardName: string;
  receivingBedId?: string;
  clinicalReason: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  requestTime: string;
  departureTime?: string;
  arrivalTime?: string;
  completedAt?: string;
  requestedBy: string;
  acceptedBy?: string;
  status: TransferStatus;
  rejectionReason?: string;
  notes?: string;
}

export interface DischargeRecord {
  id: string;
  admissionId: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  wardId: string;
  wardName: string;
  bedId: string;
  bedNumber: string;
  expectedDischargeDate: string;
  confirmedDischargeDate?: string;
  dischargingDoctor: string;
  summary: string;
  status: DischargeStatus;
  bedReadinessTriggered: boolean;
}

export interface CleaningTask {
  id: string;
  bedId: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  priority: 'ROUTINE' | 'URGENT' | 'POST_INFECTION';
  status: CleaningTaskStatus;
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  bedId: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  issueCategory: 'Mechanical Frame' | 'Electrical / Motor' | 'Mattress / Waterproofing' | 'Side Rails / Locks' | 'IV Pole Mount' | 'Sanitation Defect';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: MaintenanceTaskStatus;
  reportedBy: string;
  assignedTechnician?: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionSummary?: string;
}

export interface WardUpdate {
  id: string;
  wardId: string;
  wardName: string;
  category:
    | 'Bed shortage'
    | 'High patient demand'
    | 'Staff shortage'
    | 'Equipment problem'
    | 'Maintenance requirement'
    | 'Cleaning delay'
    | 'Infection-control restriction'
    | 'Delayed patient transfer'
    | 'Delayed discharge'
    | 'General operational update';
  description: string;
  priority: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  reportedBy: string;
  timestamp: string;
  resolved: boolean;
  assignedTeam?: string;
  resolutionNotes?: string;
}

export interface OperationalIssue {
  id: string;
  wardId: string;
  wardName: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  reportedBy: string;
  assignedTo?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface OperationalEvent {
  id: string;
  eventType:
    | 'ADMISSION'
    | 'DISCHARGE'
    | 'TRANSFER'
    | 'BED_STATUS'
    | 'BED_REQUEST'
    | 'CLEANING'
    | 'MAINTENANCE'
    | 'CAPACITY_WARNING'
    | 'WARD_UPDATE';
  wardId: string;
  wardName: string;
  timestamp: string;
  title: string;
  description: string;
  status: string;
  staffName: string;
  priority: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  actionRequired?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  wardId?: string;
  wardName?: string;
  relatedEntityId?: string;
  createdAt: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
  assignedWardId?: string;
  email: string;
  phone: string;
  active: boolean;
  lastLoginAt: string;
  passwordHash?: string;
  staffPin?: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  eventType: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
}

export interface SystemSettings {
  hospitalName: string;
  hospitalCode: string;
  region: string;
  timezone: string;
  defaultWarningThreshold: number;
  defaultCriticalThreshold: number;
  bedTurnaroundTargetMinutes: number;
  escalationEmail: string;
  dataStaleThresholdMinutes: number;
  isDemoData: boolean;
}

export interface HospitalExecutiveKPIs {
  totalInstalledBeds: number;
  operationalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  blockedBeds: number;
  outOfServiceBeds: number;
  occupancyRate: number; // occupied / operational * 100
  awaitingAdmissionCount: number;
  pendingBedRequestsCount: number;
  urgentBedRequestsCount: number;
  pendingTransfersCount: number;
  bedsOutOfServiceCount: number;
  wardsRequiringAttentionCount: number;
  lastSyncTimestamp: string;
}

export interface WardOccupancySummary {
  wardId: string;
  wardName: string;
  wardCode: string;
  departmentName: string;
  installedCapacity: number;
  operationalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  blockedBeds: number;
  outOfServiceBeds: number;
  occupancyPercentage: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: WardOperationalStatus;
  pendingAdmissions: number;
  pendingTransfers: number;
  pendingRequests: number;
  managerName: string;
  lastUpdated: string;
  isStale: boolean;
}
