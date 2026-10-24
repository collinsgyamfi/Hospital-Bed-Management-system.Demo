import fs from 'fs';
import path from 'path';
import {
  Bed,
  Ward,
  Department,
  Patient,
  AdmissionRequest,
  BedAssignment,
  BedRequest,
  PatientTransfer,
  DischargeRecord,
  CleaningTask,
  MaintenanceTask,
  WardUpdate,
  OperationalIssue,
  OperationalEvent,
  NotificationItem,
  UserProfile,
  AuditLogItem,
  SystemSettings,
  HospitalExecutiveKPIs,
  WardOccupancySummary,
  BedStatus
} from '../src/types/hospital.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hospital_db.json');

export interface DatabaseSchema {
  settings: SystemSettings;
  departments: Department[];
  wards: Ward[];
  beds: Bed[];
  patients: Patient[];
  admissions: AdmissionRequest[];
  bedAssignments: BedAssignment[];
  bedRequests: BedRequest[];
  transfers: PatientTransfer[];
  discharges: DischargeRecord[];
  cleaningTasks: CleaningTask[];
  maintenanceTasks: MaintenanceTask[];
  wardUpdates: WardUpdate[];
  operationalIssues: OperationalIssue[];
  events: OperationalEvent[];
  notifications: NotificationItem[];
  users: UserProfile[];
  auditLogs: AuditLogItem[];
}

// Event listeners for SSE
type EventListener = (event: { type: string; data: any }) => void;
const listeners: Set<EventListener> = new Set();

export function subscribeToEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcast(type: string, data: any) {
  for (const listener of listeners) {
    try {
      listener({ type, data });
    } catch (err) {
      console.error('Error broadcasting to listener', err);
    }
  }
}

let dbCache: DatabaseSchema | null = null;
let writeQueue = Promise.resolve();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function generateSeedData(): DatabaseSchema {
  const now = new Date().toISOString();

  const settings: SystemSettings = {
    hospitalName: 'Juaboso Government Hospital',
    hospitalCode: 'JGH-WN',
    region: 'Western North Region, Ghana',
    timezone: 'Africa/Accra',
    defaultWarningThreshold: 80,
    defaultCriticalThreshold: 90,
    bedTurnaroundTargetMinutes: 45,
    escalationEmail: 'director.operations@jgh.gov.gh',
    dataStaleThresholdMinutes: 30,
    isDemoData: true,
  };

  const departments: Department[] = [
    {
      id: 'DEP-EMERG',
      name: 'Emergency & Acute Care',
      code: 'EMERG',
      headOfDepartment: 'Dr. Emmanuel Addo-Yobo (Consultant)',
      description: '24-hour triage, resuscitation, and urgent trauma admissions',
    },
    {
      id: 'DEP-MED',
      name: 'Internal Medicine',
      code: 'MED',
      headOfDepartment: 'Dr. Faustina Mensah (Senior Medical Officer)',
      description: 'Adult non-surgical acute and sub-acute inpatient care',
    },
    {
      id: 'DEP-SURG',
      name: 'General Surgery & Orthopaedics',
      code: 'SURG',
      headOfDepartment: 'Dr. Joseph Kwasi Boateng (Surgeon Specialist)',
      description: 'Pre and post-operative surgical and trauma recovery',
    },
    {
      id: 'DEP-OBSGYN',
      name: 'Obstetrics & Gynaecology',
      code: 'OBSGYN',
      headOfDepartment: 'Dr. Grace Asantewaa (Obstetrician Specialist)',
      description: 'Antenatal, labour, delivery, and postpartum maternal care',
    },
    {
      id: 'DEP-PAED',
      name: 'Child Health & Neonatology',
      code: 'PAED',
      headOfDepartment: 'Dr. Cynthia Baffour (Paediatrician)',
      description: 'Inpatient paediatric medical care and neonatal intensive care',
    },
    {
      id: 'DEP-CRIT',
      name: 'Isolation & Infectious Disease',
      code: 'CRIT',
      headOfDepartment: 'Dr. Kofi Nyarko (Infection Control Lead)',
      description: 'Infectious outbreak isolation and high-dependency monitoring',
    },
  ];

  const wards: Ward[] = [
    {
      id: 'WARD-EMERG',
      departmentId: 'DEP-EMERG',
      name: 'Emergency and Casualty',
      code: 'A&E',
      wardManager: 'Nursing Officer Rita Osei',
      installedCapacity: 20,
      operationalCapacity: 20,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-MMW',
      departmentId: 'DEP-MED',
      name: 'Male Medical Ward',
      code: 'MMW',
      wardManager: 'Senior Nursing Officer Kwame Owusu',
      installedCapacity: 30,
      operationalCapacity: 30,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-FMW',
      departmentId: 'DEP-MED',
      name: 'Female Medical Ward',
      code: 'FMW',
      wardManager: 'Principal Nursing Officer Joyce Mensah',
      installedCapacity: 30,
      operationalCapacity: 28, // 2 beds out of service
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-PAED',
      departmentId: 'DEP-PAED',
      name: 'Paediatric Ward',
      code: 'PAED',
      wardManager: 'Nursing Officer Grace Ansah',
      installedCapacity: 25,
      operationalCapacity: 24, // 1 bed out of service
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-MAT',
      departmentId: 'DEP-OBSGYN',
      name: 'Maternity Ward',
      code: 'MAT',
      wardManager: 'Principal Midwifery Officer Abena Pokua',
      installedCapacity: 25,
      operationalCapacity: 25,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-LD',
      departmentId: 'DEP-OBSGYN',
      name: 'Labour and Delivery Ward',
      code: 'L&D',
      wardManager: 'Senior Midwife Doris Darko',
      installedCapacity: 12,
      operationalCapacity: 12,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-SURG',
      departmentId: 'DEP-SURG',
      name: 'Surgical Ward',
      code: 'SURG',
      wardManager: 'Senior Nursing Officer Samuel Mensah',
      installedCapacity: 30,
      operationalCapacity: 28, // 2 beds undergoing maintenance
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-PACU',
      departmentId: 'DEP-SURG',
      name: 'Postoperative Recovery',
      code: 'PACU',
      wardManager: 'Critical Care Nurse Isaac Sarpong',
      installedCapacity: 10,
      operationalCapacity: 10,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-NICU',
      departmentId: 'DEP-PAED',
      name: 'Neonatal Unit',
      code: 'NICU',
      wardManager: 'Senior Paediatric Midwife Mercy Tetteh',
      installedCapacity: 14,
      operationalCapacity: 14,
      warningThreshold: 80,
      criticalThreshold: 90,
      lastSyncTime: now,
    },
    {
      id: 'WARD-ISOL',
      departmentId: 'DEP-CRIT',
      name: 'Isolation Ward',
      code: 'ISOL',
      wardManager: 'Infection Control Officer Peter Cudjoe',
      installedCapacity: 8,
      operationalCapacity: 8,
      warningThreshold: 75,
      criticalThreshold: 85,
      lastSyncTime: now,
    },
  ];

  // Users representing various clinical & management roles
  const users: UserProfile[] = [
    {
      id: 'USR-ADMIN',
      username: 'sysadmin',
      fullName: 'Kofi Twumasi-Ankrah',
      role: 'SYSTEM_ADMIN',
      department: 'Health Informatics & IT',
      email: 'ktwumasi@jgh.gov.gh',
      phone: '+233 24 551 2289',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-MGMT',
      username: 'medical_dir',
      fullName: 'Dr. Kwabena Frimpong-Mansoh',
      role: 'HOSPITAL_MANAGEMENT',
      department: 'Hospital Directorate',
      email: 'medical.director@jgh.gov.gh',
      phone: '+233 20 812 3456',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-WM-MMW',
      username: 'wm_mmw',
      fullName: 'Kwame Owusu (SNO)',
      role: 'WARD_MANAGER',
      department: 'Internal Medicine',
      assignedWardId: 'WARD-MMW',
      email: 'kowusu@jgh.gov.gh',
      phone: '+233 24 998 1234',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-WM-EMERG',
      username: 'wm_emerg',
      fullName: 'Rita Osei (NO)',
      role: 'WARD_MANAGER',
      department: 'Emergency Medicine',
      assignedWardId: 'WARD-EMERG',
      email: 'rosei@jgh.gov.gh',
      phone: '+233 24 331 4455',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-NURSE',
      username: 'nurse_sarah',
      fullName: 'Staff Nurse Sarah Boakye',
      role: 'NURSE',
      department: 'Internal Medicine',
      assignedWardId: 'WARD-MMW',
      email: 'sboakye@jgh.gov.gh',
      phone: '+233 27 114 9081',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-ADMIT',
      username: 'admissions_off',
      fullName: 'Ebenezer Quaye',
      role: 'ADMISSION_OFFICER',
      department: 'Patient Records & Admissions',
      email: 'admissions@jgh.gov.gh',
      phone: '+233 24 776 5432',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-DOC',
      username: 'dr_addo',
      fullName: 'Dr. Emmanuel Addo-Yobo',
      role: 'DOCTOR',
      department: 'Emergency Medicine',
      assignedWardId: 'WARD-EMERG',
      email: 'eaddo@jgh.gov.gh',
      phone: '+233 20 443 2198',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-CLEAN',
      username: 'env_lead',
      fullName: 'Yaw Badu (Environmental Lead)',
      role: 'CLEANING_MAINTENANCE',
      department: 'Sanitation & Maintenance',
      email: 'ybadu@jgh.gov.gh',
      phone: '+233 55 678 1209',
      active: true,
      lastLoginAt: now,
    },
    {
      id: 'USR-AUDIT',
      username: 'auditor_gns',
      fullName: 'Matilda Appiah (Quality & Audit)',
      role: 'READ_ONLY_AUDITOR',
      department: 'Ghana Health Service Audit',
      email: 'mappiah@audit.ghs.gov.gh',
      phone: '+233 24 456 7890',
      active: true,
      lastLoginAt: now,
    },
  ];

  // Patients with authentic Ghanaian names
  const patients: Patient[] = [
    { id: 'PT-101', hospitalNumber: 'JGH-PT-8821', fullName: 'Kwame Mensah', gender: 'MALE', age: 48, bloodGroup: 'O+', emergencyContact: 'Akosua Mensah (Wife) 0244123456', maskedNationalId: 'GHA-71289381-1', currentWardId: 'WARD-MMW', currentBedId: 'JGH-MMW-001' },
    { id: 'PT-102', hospitalNumber: 'JGH-PT-8822', fullName: 'Kofi Boateng', gender: 'MALE', age: 62, bloodGroup: 'A+', emergencyContact: 'Yaw Boateng (Son) 0209876543', maskedNationalId: 'GHA-72314562-4', currentWardId: 'WARD-MMW', currentBedId: 'JGH-MMW-002' },
    { id: 'PT-103', hospitalNumber: 'JGH-PT-8823', fullName: 'Ama Serwaa', gender: 'FEMALE', age: 34, bloodGroup: 'B+', emergencyContact: 'Kwesi Serwaa (Brother) 0551239876', maskedNationalId: 'GHA-70918234-9', currentWardId: 'WARD-FMW', currentBedId: 'JGH-FMW-001' },
    { id: 'PT-104', hospitalNumber: 'JGH-PT-8824', fullName: 'Abena Frimpong', gender: 'FEMALE', age: 29, bloodGroup: 'O+', emergencyContact: 'Kojo Frimpong (Husband) 0243456789', maskedNationalId: 'GHA-78192039-3', currentWardId: 'WARD-MAT', currentBedId: 'JGH-MAT-001' },
    { id: 'PT-105', hospitalNumber: 'JGH-PT-8825', fullName: 'Master Yaw Appiah', gender: 'MALE', age: 6, bloodGroup: 'A-', emergencyContact: 'Evelyn Appiah (Mother) 0277889900', maskedNationalId: 'GHA-79018231-5', currentWardId: 'WARD-PAED', currentBedId: 'JGH-PAED-001' },
    { id: 'PT-106', hospitalNumber: 'JGH-PT-8826', fullName: 'Kwaku Osei-Bonsu', gender: 'MALE', age: 52, bloodGroup: 'O-', emergencyContact: 'Mabel Osei (Daughter) 0245671234', maskedNationalId: 'GHA-73210987-8', currentWardId: 'WARD-SURG', currentBedId: 'JGH-SURG-001' },
    { id: 'PT-107', hospitalNumber: 'JGH-PT-8827', fullName: 'Akua Gyasi', gender: 'FEMALE', age: 41, bloodGroup: 'B-', emergencyContact: 'Emmanuel Gyasi (Brother) 0201122334', maskedNationalId: 'GHA-74567123-2', currentWardId: 'WARD-FMW', currentBedId: 'JGH-FMW-002' },
    { id: 'PT-108', hospitalNumber: 'JGH-PT-8828', fullName: 'Baby Boy Darko', gender: 'MALE', age: 1, bloodGroup: 'O+', emergencyContact: 'Doris Darko (Mother) 0558877665', maskedNationalId: 'GHA-76543210-9', currentWardId: 'WARD-NICU', currentBedId: 'JGH-NICU-001' },
    { id: 'PT-109', hospitalNumber: 'JGH-PT-8829', fullName: 'Ebenezer Antwi', gender: 'MALE', age: 57, bloodGroup: 'AB+', emergencyContact: 'Grace Antwi (Wife) 0249911223', maskedNationalId: 'GHA-71199228-7', currentWardId: 'WARD-EMERG', currentBedId: 'JGH-EMERG-001' },
    { id: 'PT-110', hospitalNumber: 'JGH-PT-8830', fullName: 'Gifty Kyeremateng', gender: 'FEMALE', age: 26, bloodGroup: 'O+', emergencyContact: 'Stephen Kyeremateng 0204455667', maskedNationalId: 'GHA-78899001-4', currentWardId: 'WARD-LD', currentBedId: 'JGH-LD-001' },
  ];

  // Generate beds for each ward
  const beds: Bed[] = [];
  const bedAssignments: BedAssignment[] = [];

  wards.forEach((ward) => {
    const total = ward.installedCapacity;
    const operational = ward.operationalCapacity;
    const outOfServiceCount = total - operational;

    // Test 1 compliance requirement:
    // "Given a ward with 30 operational beds and 24 occupied beds: Available beds must equal 6 if no beds reserved, blocked, or unavailable. Occupancy must equal 80%."
    let occupiedCount = 0;
    let reservedCount = 0;
    let blockedCount = 0;
    let awaitingCleaningCount = 0;

    if (ward.id === 'WARD-MMW') {
      occupiedCount = 24; // Test 1: 24 / 30 = 80.0%
      reservedCount = 0;
      blockedCount = 0;
      awaitingCleaningCount = 0;
    } else if (ward.id === 'WARD-EMERG') {
      occupiedCount = 18; // 18 / 20 = 90% High occupancy / approaching capacity
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-FMW') {
      occupiedCount = 23; // 23 / 28 = 82.1% Approaching capacity
      reservedCount = 1;
      blockedCount = 1;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-PAED') {
      occupiedCount = 16;
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-MAT') {
      occupiedCount = 22; // 22 / 25 = 88.0%
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-LD') {
      occupiedCount = 7;
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-SURG') {
      occupiedCount = 21;
      reservedCount = 2;
      blockedCount = 1;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-PACU') {
      occupiedCount = 5;
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 0;
    } else if (ward.id === 'WARD-NICU') {
      occupiedCount = 11;
      reservedCount = 1;
      blockedCount = 0;
      awaitingCleaningCount = 1;
    } else if (ward.id === 'WARD-ISOL') {
      occupiedCount = 3;
      reservedCount = 0;
      blockedCount = 1;
      awaitingCleaningCount = 1;
    }

    for (let i = 1; i <= total; i++) {
      const bedNumber = `Bed ${String(i).padStart(2, '0')}`;
      const bedId = `JGH-${ward.code}-${String(i).padStart(3, '0')}`;
      let status: BedStatus = 'AVAILABLE';
      let activePatientId: string | undefined = undefined;
      let activePatientName: string | undefined = undefined;
      let activeAssignmentId: string | undefined = undefined;
      let cleaningStatus: 'CLEAN' | 'NEEDS_CLEANING' | 'IN_PROGRESS' | undefined = 'CLEAN';
      let maintenanceStatus: 'OPERATIONAL' | 'NEEDS_REPAIR' | 'UNDER_REPAIR' | undefined = 'OPERATIONAL';
      let blockReason: string | undefined = undefined;

      if (i > operational) {
        status = 'OUT_OF_SERVICE';
        maintenanceStatus = 'UNDER_REPAIR';
        blockReason = 'Hydraulic actuator fault and frame welding requirement';
      } else if (i <= occupiedCount) {
        status = 'OCCUPIED';
        const pIndex = (i - 1) % patients.length;
        const patient = patients[pIndex];
        activePatientId = `PT-AUTO-${ward.code}-${i}`;
        activePatientName = i === 1 && patient ? patient.fullName : `Patient ${ward.code}-${String(i).padStart(2, '0')}`;
        activeAssignmentId = `ASN-${ward.code}-${i}`;

        bedAssignments.push({
          id: activeAssignmentId,
          bedId,
          bedNumber,
          patientId: activePatientId,
          patientName: activePatientName,
          wardId: ward.id,
          wardName: ward.name,
          assignedAt: new Date(Date.now() - (i * 3600000 + 7200000)).toISOString(),
          assignedBy: 'Nurse Officer on Duty',
          status: 'ACTIVE',
        });
      } else if (i <= occupiedCount + reservedCount) {
        status = 'RESERVED';
        blockReason = 'Reserved for incoming emergency triage admission';
      } else if (i <= occupiedCount + reservedCount + awaitingCleaningCount) {
        status = 'AWAITING_CLEANING';
        cleaningStatus = 'NEEDS_CLEANING';
      } else if (i <= occupiedCount + reservedCount + awaitingCleaningCount + blockedCount) {
        status = 'BLOCKED';
        blockReason = 'Infection control buffer zone isolation protocol';
      } else {
        status = 'AVAILABLE';
      }

      let category: Bed['category'] = 'Standard Inpatient';
      if (ward.id === 'WARD-EMERG' || ward.id === 'WARD-PACU') category = 'ICU / Critical Care';
      else if (ward.id === 'WARD-PAED') category = 'Paediatric Cot';
      else if (ward.id === 'WARD-NICU') category = 'ICU / Critical Care';
      else if (ward.id === 'WARD-LD' || ward.id === 'WARD-MAT') category = 'Maternity Delivery';
      else if (ward.id === 'WARD-ISOL') category = 'Isolation';

      beds.push({
        id: bedId,
        wardId: ward.id,
        bedNumber,
        category,
        locationDescription: `Bay ${Math.ceil(i / 6)}, Position ${((i - 1) % 6) + 1}`,
        status,
        activePatientId,
        activePatientName,
        activeAssignmentId,
        cleaningStatus,
        maintenanceStatus,
        blockReason,
        lastStatusChange: new Date(Date.now() - i * 1800000).toISOString(),
        lastModifiedBy: 'Charge Nurse',
      });
    }
  });

  const admissions: AdmissionRequest[] = [
    {
      id: 'ADM-REQ-001',
      patientId: 'PT-111',
      patientName: 'Kofi Mensah Addae',
      patientAge: 54,
      patientGender: 'MALE',
      hospitalNumber: 'JGH-PT-8831',
      referringDepartment: 'Emergency and Casualty',
      requestedWardId: 'WARD-MMW',
      requestedWardName: 'Male Medical Ward',
      bedCategory: 'Standard Inpatient',
      priority: 'URGENT',
      clinicalNotes: 'Severe hypertensive urgency with headache, BP 190/115 mmHg. Requires IV labetalol infusion and telemetry.',
      requestedBy: 'Dr. Emmanuel Addo-Yobo (A&E Lead)',
      requestTime: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'PENDING',
    },
    {
      id: 'ADM-REQ-002',
      patientId: 'PT-112',
      patientName: 'Priscilla Asare',
      patientAge: 27,
      patientGender: 'FEMALE',
      hospitalNumber: 'JGH-PT-8832',
      referringDepartment: 'Obstetrics & Gynaecology Outpatient',
      requestedWardId: 'WARD-MAT',
      requestedWardName: 'Maternity Ward',
      bedCategory: 'Maternity Delivery',
      priority: 'ROUTINE',
      clinicalNotes: 'Gravida 2 Para 1 at 38 weeks with mild pre-eclampsia. Scheduled for induction of labour.',
      requestedBy: 'Dr. Grace Asantewaa',
      requestTime: new Date(Date.now() - 90 * 60000).toISOString(),
      status: 'APPROVED',
      notes: 'Approved by Maternity Shift Lead. Bed assignment pending discharge of Bed 08.',
    },
    {
      id: 'ADM-REQ-003',
      patientId: 'PT-113',
      patientName: 'Master Christian Boadi',
      patientAge: 4,
      patientGender: 'MALE',
      hospitalNumber: 'JGH-PT-8833',
      referringDepartment: 'Paediatric Emergency Unit',
      requestedWardId: 'WARD-PAED',
      requestedWardName: 'Paediatric Ward',
      bedCategory: 'Paediatric Cot',
      priority: 'EMERGENCY',
      clinicalNotes: 'Severe falciparum malaria with severe anaemia (Hb 4.8 g/dL). Blood transfusion required urgently.',
      requestedBy: 'Dr. Cynthia Baffour',
      requestTime: new Date(Date.now() - 25 * 60000).toISOString(),
      status: 'PENDING',
      isEmergencyOverride: true,
    },
    {
      id: 'ADM-REQ-004',
      patientId: 'PT-114',
      patientName: 'Salomey Donkor',
      patientAge: 46,
      patientGender: 'FEMALE',
      hospitalNumber: 'JGH-PT-8834',
      referringDepartment: 'Surgical Outpatient Department',
      requestedWardId: 'WARD-SURG',
      requestedWardName: 'Surgical Ward',
      bedCategory: 'Standard Inpatient',
      priority: 'ROUTINE',
      clinicalNotes: 'Elective open cholecystectomy scheduled for tomorrow 08:00 AM.',
      requestedBy: 'Dr. Joseph Kwasi Boateng',
      requestTime: new Date(Date.now() - 150 * 60000).toISOString(),
      status: 'APPROVED',
    },
  ];

  const bedRequests: BedRequest[] = [
    {
      id: 'BREQ-001',
      requestingDepartment: 'Emergency and Casualty',
      requestedWardId: 'WARD-MMW',
      requestedWardName: 'Male Medical Ward',
      numberOfBeds: 2,
      allocatedQuantity: 1,
      bedCategory: 'Standard Inpatient',
      priority: 'URGENT',
      reason: 'Acute influx of adult male medical emergencies from Bodi road traffic accident and severe pneumonia',
      submittedAt: new Date(Date.now() - 80 * 60000).toISOString(),
      requestingStaff: 'NO Rita Osei (A&E)',
      assignedManager: 'Kwame Owusu (SNO)',
      status: 'PARTIALLY_FULFILLED',
      resolutionNotes: 'Bed 25 allocated. 1 remaining bed awaiting expected discharge.',
      escalated: true,
    },
    {
      id: 'BREQ-002',
      requestingDepartment: 'Labour and Delivery Ward',
      requestedWardId: 'WARD-MAT',
      requestedWardName: 'Maternity Ward',
      numberOfBeds: 3,
      allocatedQuantity: 0,
      bedCategory: 'Maternity Delivery',
      priority: 'URGENT',
      reason: 'Three post-caesarean mothers awaiting postnatal step-down beds to clear delivery suites',
      submittedAt: new Date(Date.now() - 40 * 60000).toISOString(),
      requestingStaff: 'Senior Midwife Doris Darko',
      status: 'SUBMITTED',
      escalated: true,
    },
    {
      id: 'BREQ-003',
      requestingDepartment: 'Paediatric Ward',
      requestedWardId: 'WARD-NICU',
      requestedWardName: 'Neonatal Unit',
      numberOfBeds: 1,
      allocatedQuantity: 1,
      bedCategory: 'ICU / Critical Care',
      priority: 'EMERGENCY',
      reason: 'Extremely preterm neonate with respiratory distress syndrome requiring CPAP in incubator',
      submittedAt: new Date(Date.now() - 120 * 60000).toISOString(),
      requestingStaff: 'Dr. Cynthia Baffour',
      status: 'FULFILLED',
      resolutionNotes: 'Bed JGH-NICU-007 allocated promptly.',
    },
  ];

  const transfers: PatientTransfer[] = [
    {
      id: 'TRF-001',
      patientId: 'PT-109',
      patientName: 'Ebenezer Antwi',
      hospitalNumber: 'JGH-PT-8829',
      sendingWardId: 'WARD-EMERG',
      sendingWardName: 'Emergency and Casualty',
      sendingBedId: 'JGH-EMERG-001',
      receivingWardId: 'WARD-MMW',
      receivingWardName: 'Male Medical Ward',
      receivingBedId: 'JGH-MMW-025',
      clinicalReason: 'Stabilized post-asthmatic exacerbation. Transferred for 48h ward observation and nebulization.',
      priority: 'URGENT',
      requestTime: new Date(Date.now() - 65 * 60000).toISOString(),
      departureTime: new Date(Date.now() - 15 * 60000).toISOString(),
      requestedBy: 'Dr. Emmanuel Addo-Yobo',
      acceptedBy: 'SNO Kwame Owusu',
      status: 'IN_PROGRESS',
      notes: 'Patient wheeled via stretcher by orderly Collins. Arrival confirmation pending vitals sign-off.',
    },
    {
      id: 'TRF-002',
      patientId: 'PT-106',
      patientName: 'Kwaku Osei-Bonsu',
      hospitalNumber: 'JGH-PT-8826',
      sendingWardId: 'WARD-PACU',
      sendingWardName: 'Postoperative Recovery',
      sendingBedId: 'JGH-PACU-002',
      receivingWardId: 'WARD-SURG',
      receivingWardName: 'Surgical Ward',
      receivingBedId: 'JGH-SURG-012',
      clinicalReason: 'Recovery score 10/10 following open reduction internal fixation of femur fracture.',
      priority: 'ROUTINE',
      requestTime: new Date(Date.now() - 110 * 60000).toISOString(),
      departureTime: new Date(Date.now() - 40 * 60000).toISOString(),
      arrivalTime: new Date(Date.now() - 20 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 18 * 60000).toISOString(),
      requestedBy: 'Nurse Isaac Sarpong',
      acceptedBy: 'SNO Samuel Mensah',
      status: 'COMPLETED',
      notes: 'Transfer signed off cleanly. JGH-PACU-002 dispatched to cleaning.',
    },
    {
      id: 'TRF-003',
      patientId: 'PT-104',
      patientName: 'Abena Frimpong',
      hospitalNumber: 'JGH-PT-8824',
      sendingWardId: 'WARD-LD',
      sendingWardName: 'Labour and Delivery Ward',
      sendingBedId: 'JGH-LD-003',
      receivingWardId: 'WARD-MAT',
      receivingWardName: 'Maternity Ward',
      clinicalReason: 'Normal spontaneous vaginal delivery. Stable mother and vigorous baby boy transferred to postnatal bay.',
      priority: 'ROUTINE',
      requestTime: new Date(Date.now() - 35 * 60000).toISOString(),
      requestedBy: 'Midwife Doris Darko',
      status: 'AWAITING_ACCEPTANCE',
    },
  ];

  const discharges: DischargeRecord[] = [
    {
      id: 'DSC-001',
      admissionId: 'ASN-MMW-008',
      patientId: 'PT-AUTO-MMW-8',
      patientName: 'Daniel Kwakye',
      hospitalNumber: 'JGH-PT-8815',
      wardId: 'WARD-MMW',
      wardName: 'Male Medical Ward',
      bedId: 'JGH-MMW-008',
      bedNumber: 'Bed 08',
      expectedDischargeDate: new Date(Date.now() + 2 * 3600000).toISOString(),
      dischargingDoctor: 'Dr. Faustina Mensah',
      summary: 'Resolved cellulitis of left lower limb. Completed 5 days IV flucloxacillin. Oral medication dispensed.',
      status: 'READY',
      bedReadinessTriggered: false,
    },
    {
      id: 'DSC-002',
      admissionId: 'ASN-FMW-014',
      patientId: 'PT-AUTO-FMW-14',
      patientName: 'Comfort Yeboah',
      hospitalNumber: 'JGH-PT-8810',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      bedId: 'JGH-FMW-014',
      bedNumber: 'Bed 14',
      expectedDischargeDate: new Date(Date.now() - 30 * 60000).toISOString(),
      confirmedDischargeDate: new Date(Date.now() - 25 * 60000).toISOString(),
      dischargingDoctor: 'Dr. Emmanuel Addo-Yobo',
      summary: 'Recovered severe gastroenteritis. Discharge instructions and oral rehydration therapy education provided.',
      status: 'CONFIRMED',
      bedReadinessTriggered: true,
    },
  ];

  const cleaningTasks: CleaningTask[] = [
    {
      id: 'CLN-001',
      bedId: 'JGH-FMW-014',
      bedNumber: 'Bed 14',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      priority: 'ROUTINE',
      status: 'IN_PROGRESS',
      assignedTo: 'Kwadwo Poku (Cleaning Staff)',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      notes: 'Terminal disinfection following patient discharge in progress. Replacement waterproof linen staged.',
    },
    {
      id: 'CLN-002',
      bedId: 'JGH-PACU-002',
      bedNumber: 'Bed 02',
      wardId: 'WARD-PACU',
      wardName: 'Postoperative Recovery',
      priority: 'URGENT',
      status: 'PENDING',
      assignedTo: 'Yaw Badu (Environmental Lead)',
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
      notes: 'Patient transferred to surgical ward. Rapid turnaround required for next theatre patient.',
    },
    {
      id: 'CLN-003',
      bedId: 'JGH-ISOL-004',
      bedNumber: 'Bed 04',
      wardId: 'WARD-ISOL',
      wardName: 'Isolation Ward',
      priority: 'POST_INFECTION',
      status: 'COMPLETED',
      assignedTo: 'Peter Cudjoe (Infection Control)',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      inspectedBy: 'Dr. Kofi Nyarko',
      notes: 'Full chlorine fogging protocol completed. Awaiting 30-min contact time sign-off before releasing to AVAILABLE.',
    },
  ];

  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: 'MNT-001',
      bedId: 'JGH-FMW-029',
      bedNumber: 'Bed 29',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      issueCategory: 'Mechanical Frame',
      description: 'Head-elevation crank stripped and locking pins loose; unable to support Fowler position safely.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      reportedBy: 'Joyce Mensah (PNO)',
      assignedTechnician: 'Ernest Bioh (Biomedical Tech)',
      reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      resolutionSummary: 'Replacement gear assembly ordered from Kumasi supplier; fitting underway.',
    },
    {
      id: 'MNT-002',
      bedId: 'JGH-SURG-029',
      bedNumber: 'Bed 29',
      wardId: 'WARD-SURG',
      wardName: 'Surgical Ward',
      issueCategory: 'Side Rails / Locks',
      description: 'Right collapsible side rail hinge fractured after trauma patient transfer; sharp metal edge.',
      priority: 'CRITICAL',
      status: 'REPORTED',
      reportedBy: 'Samuel Mensah (SNO)',
      reportedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ];

  const wardUpdates: WardUpdate[] = [
    {
      id: 'WUPD-001',
      wardId: 'WARD-EMERG',
      wardName: 'Emergency and Casualty',
      category: 'High patient demand',
      description: 'Accident on Sefwi Juaboso highway brought 6 casualty victims simultaneously. Resuscitation bay fully occupied.',
      priority: 'CRITICAL',
      reportedBy: 'Dr. Emmanuel Addo-Yobo',
      timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
      resolved: false,
      assignedTeam: 'Hospital Disaster Response & Triage Command',
    },
    {
      id: 'WUPD-002',
      wardId: 'WARD-MMW',
      wardName: 'Male Medical Ward',
      category: 'Bed shortage',
      description: 'Occupancy at 80% (24/30 beds occupied). Approaching warning threshold. Requesting expedited discharge reviews.',
      priority: 'URGENT',
      reportedBy: 'Kwame Owusu (SNO)',
      timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
      resolved: false,
      resolutionNotes: 'Medical ward doctors reviewing 3 patients for potential safe discharge.',
    },
    {
      id: 'WUPD-003',
      wardId: 'WARD-SURG',
      wardName: 'Surgical Ward',
      category: 'Maintenance requirement',
      description: 'Two inpatient beds flagged out of service for mechanical repairs. Effective capacity reduced to 28.',
      priority: 'ROUTINE',
      reportedBy: 'Samuel Mensah (SNO)',
      timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
      resolved: true,
      resolutionNotes: 'Bio-engineering acknowledged. Work order #MNT-002 generated.',
    },
  ];

  const operationalIssues: OperationalIssue[] = [
    {
      id: 'ISS-001',
      wardId: 'WARD-EMERG',
      wardName: 'Emergency and Casualty',
      title: 'Emergency Resuscitation Overflow',
      description: 'High casualty influx requiring additional step-down beds to prevent triage bottleneck.',
      category: 'Surge Capacity',
      priority: 'CRITICAL',
      status: 'OPEN',
      reportedBy: 'Dr. Emmanuel Addo-Yobo',
      assignedTo: 'Hospital Directorate',
      reportedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    },
    {
      id: 'ISS-002',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      title: 'Waterproofing Mattress Replacement Needed',
      description: 'Beds 12 and 19 require replacement impermeable antimicrobial covers before re-admission.',
      category: 'Infection Prevention',
      priority: 'MEDIUM',
      status: 'INVESTIGATING',
      reportedBy: 'Joyce Mensah (PNO)',
      assignedTo: 'Yaw Badu (Environmental Lead)',
      reportedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    },
  ];

  const events: OperationalEvent[] = [
    {
      id: 'EVT-001',
      eventType: 'CAPACITY_WARNING',
      wardId: 'WARD-EMERG',
      wardName: 'Emergency and Casualty',
      timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
      title: 'A&E Reached 90% Occupancy',
      description: 'Emergency department has 18/20 operational beds filled with 4 patients undergoing triage.',
      status: 'URGENT',
      staffName: 'Automated Capacity Monitor',
      priority: 'CRITICAL',
      actionRequired: 'Expedite inpatient ward transfers and activate surge overflow beds.',
    },
    {
      id: 'EVT-002',
      eventType: 'BED_REQUEST',
      wardId: 'WARD-EMERG',
      wardName: 'Emergency and Casualty',
      timestamp: new Date(Date.now() - 79 * 60000).toISOString(),
      title: 'Urgent Inpatient Bed Request Submitted',
      description: 'Request BREQ-001 for 2 medical beds submitted to Male Medical Ward.',
      status: 'PARTIALLY_FULFILLED',
      staffName: 'NO Rita Osei',
      priority: 'URGENT',
      relatedEntityId: 'BREQ-001',
    },
    {
      id: 'EVT-003',
      eventType: 'TRANSFER',
      wardId: 'WARD-MMW',
      wardName: 'Male Medical Ward',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      title: 'Patient Transfer in Transit',
      description: 'Patient Ebenezer Antwi en route from A&E to MMW Bed 25.',
      status: 'IN_PROGRESS',
      staffName: 'Orderly Collins / Nurse Sarah Boakye',
      priority: 'INFO',
      relatedEntityId: 'TRF-001',
    },
    {
      id: 'EVT-004',
      eventType: 'DISCHARGE',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      title: 'Discharge Confirmed: Bed JGH-FMW-014',
      description: 'Comfort Yeboah discharged. Bed dispatched to terminal cleaning.',
      status: 'COMPLETED',
      staffName: 'Dr. Emmanuel Addo-Yobo',
      priority: 'INFO',
      relatedEntityId: 'DSC-002',
    },
    {
      id: 'EVT-005',
      eventType: 'CLEANING',
      wardId: 'WARD-FMW',
      wardName: 'Female Medical Ward',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      title: 'Cleaning in Progress on Bed 14',
      description: 'Sanitation team sanitizing mattress and frame; expected ready in 20 min.',
      status: 'IN_PROGRESS',
      staffName: 'Kwadwo Poku',
      priority: 'INFO',
      relatedEntityId: 'CLN-001',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'NOTIF-001',
      type: 'CAPACITY_CRITICAL',
      title: 'Emergency and Casualty Critical Occupancy',
      message: 'Emergency Department has hit 90% capacity (18/20 beds). Action required on pending ward admissions.',
      priority: 'CRITICAL',
      wardId: 'WARD-EMERG',
      wardName: 'Emergency and Casualty',
      createdAt: new Date(Date.now() - 48 * 60000).toISOString(),
      read: false,
      acknowledged: false,
    },
    {
      id: 'NOTIF-002',
      type: 'URGENT_BED_REQUEST',
      title: 'Urgent Bed Request from Labour & Delivery',
      message: 'Request BREQ-002: 3 post-caesarean mothers awaiting postnatal maternity placement.',
      priority: 'URGENT',
      wardId: 'WARD-LD',
      wardName: 'Labour and Delivery Ward',
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
      read: false,
      acknowledged: false,
    },
    {
      id: 'NOTIF-003',
      type: 'ADMISSION_PENDING',
      title: 'Emergency Paediatric Admission Awaiting Cot',
      message: 'Severe malaria patient (Master Christian Boadi, 4 yrs) awaiting Paediatric Cot placement.',
      priority: 'URGENT',
      wardId: 'WARD-PAED',
      wardName: 'Paediatric Ward',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      read: false,
      acknowledged: false,
    },
    {
      id: 'NOTIF-004',
      type: 'MAINTENANCE_HOLD',
      title: 'Bed Fractured in Surgical Ward',
      message: 'JGH-SURG-029 placed OUT_OF_SERVICE due to damaged collapsible side rail.',
      priority: 'WARNING',
      wardId: 'WARD-SURG',
      wardName: 'Surgical Ward',
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      read: true,
      acknowledged: true,
      acknowledgedBy: 'Samuel Mensah (SNO)',
      acknowledgedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ];

  const auditLogs: AuditLogItem[] = [
    {
      id: 'AUD-001',
      userId: 'USR-DOC',
      userName: 'Dr. Emmanuel Addo-Yobo',
      userRole: 'DOCTOR',
      eventType: 'ADMISSION_REQUEST_CREATED',
      entityType: 'AdmissionRequest',
      entityId: 'ADM-REQ-001',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      afterState: { patientName: 'Kofi Mensah Addae', priority: 'URGENT', requestedWard: 'WARD-MMW' },
      reason: 'Hypertensive emergency requiring inpatient admission',
      outcome: 'SUCCESS',
    },
    {
      id: 'AUD-002',
      userId: 'USR-WM-EMERG',
      userName: 'Rita Osei (NO)',
      userRole: 'WARD_MANAGER',
      eventType: 'BED_REQUEST_SUBMITTED',
      entityType: 'BedRequest',
      entityId: 'BREQ-001',
      timestamp: new Date(Date.now() - 80 * 60000).toISOString(),
      afterState: { requestingDept: 'Emergency and Casualty', quantity: 2, priority: 'URGENT' },
      reason: 'Multiple trauma surge from highway accident',
      outcome: 'SUCCESS',
    },
    {
      id: 'AUD-003',
      userId: 'USR-DOC',
      userName: 'Dr. Emmanuel Addo-Yobo',
      userRole: 'DOCTOR',
      eventType: 'DISCHARGE_CONFIRMED',
      entityType: 'DischargeRecord',
      entityId: 'DSC-002',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      beforeState: { bedStatus: 'OCCUPIED', patient: 'Comfort Yeboah' },
      afterState: { bedStatus: 'AWAITING_CLEANING', patientReleased: true },
      reason: 'Clinical recovery achieved',
      outcome: 'SUCCESS',
    },
  ];

  return {
    settings,
    departments,
    wards,
    beds,
    patients,
    admissions,
    bedAssignments,
    bedRequests,
    transfers,
    discharges,
    cleaningTasks,
    maintenanceTasks,
    wardUpdates,
    operationalIssues,
    events,
    notifications,
    users,
    auditLogs,
  };
}

export function getDatabase(): DatabaseSchema {
  if (dbCache) {
    return dbCache;
  }
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      return dbCache!;
    } catch (err) {
      console.error('Failed reading database file, regenerating seed data', err);
    }
  }

  const initialData = generateSeedData();
  saveDatabaseSync(initialData);
  dbCache = initialData;
  return dbCache;
}

export function saveDatabaseSync(data: DatabaseSchema) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  dbCache = data;
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    ensureDataDir();
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  });
  return writeQueue;
}

// Recalculates authoritative Hospital Executive KPIs
export function calculateExecutiveKPIs(db: DatabaseSchema): HospitalExecutiveKPIs {
  let totalInstalled = 0;
  let operationalBeds = 0;
  let occupiedBeds = 0;
  let availableBeds = 0;
  let reservedBeds = 0;
  let blockedBeds = 0;
  let outOfServiceBeds = 0;

  // Track installed and operational from wards definition
  db.wards.forEach((w) => {
    totalInstalled += w.installedCapacity;
    operationalBeds += w.operationalCapacity;
  });

  // Calculate bed states from actual bed records
  db.beds.forEach((bed) => {
    switch (bed.status) {
      case 'OCCUPIED':
        occupiedBeds++;
        break;
      case 'AVAILABLE':
        availableBeds++;
        break;
      case 'RESERVED':
        reservedBeds++;
        break;
      case 'BLOCKED':
        blockedBeds++;
        break;
      case 'OUT_OF_SERVICE':
        outOfServiceBeds++;
        break;
      case 'AWAITING_CLEANING':
      case 'CLEANING_IN_PROGRESS':
        // These are operational beds undergoing cleaning, excluded from available
        blockedBeds++;
        break;
    }
  });

  // Occupancy rate formula explicitly: occupied / operational * 100
  const occupancyRate = operationalBeds > 0 ? Number(((occupiedBeds / operationalBeds) * 100).toFixed(1)) : 0;

  const awaitingAdmissionCount = db.admissions.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED').length;
  const pendingBedRequests = db.bedRequests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'PARTIALLY_FULFILLED'
  );
  const pendingBedRequestsCount = pendingBedRequests.length;
  const urgentBedRequestsCount = pendingBedRequests.filter((r) => r.priority === 'URGENT' || r.priority === 'EMERGENCY').length;
  const pendingTransfersCount = db.transfers.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.status !== 'REJECTED').length;

  const wardsRequiringAttentionCount = db.wards.filter((w) => {
    const wardBeds = db.beds.filter((b) => b.wardId === w.id);
    const wardOccupied = wardBeds.filter((b) => b.status === 'OCCUPIED').length;
    const rate = w.operationalCapacity > 0 ? (wardOccupied / w.operationalCapacity) * 100 : 0;
    return rate >= w.warningThreshold;
  }).length;

  return {
    totalInstalledBeds: totalInstalled,
    operationalBeds,
    occupiedBeds,
    availableBeds,
    reservedBeds,
    blockedBeds,
    outOfServiceBeds,
    occupancyRate,
    awaitingAdmissionCount,
    pendingBedRequestsCount,
    urgentBedRequestsCount,
    pendingTransfersCount,
    bedsOutOfServiceCount: outOfServiceBeds,
    wardsRequiringAttentionCount,
    lastSyncTimestamp: new Date().toISOString(),
  };
}

// Recalculates Ward Summaries
export function getWardSummaries(db: DatabaseSchema): WardOccupancySummary[] {
  return db.wards.map((ward) => {
    const dept = db.departments.find((d) => d.id === ward.departmentId);
    const wardBeds = db.beds.filter((b) => b.wardId === ward.id);

    const occupiedBeds = wardBeds.filter((b) => b.status === 'OCCUPIED').length;
    const availableBeds = wardBeds.filter((b) => b.status === 'AVAILABLE').length;
    const reservedBeds = wardBeds.filter((b) => b.status === 'RESERVED').length;
    const blockedBeds = wardBeds.filter((b) => b.status === 'BLOCKED' || b.status === 'AWAITING_CLEANING' || b.status === 'CLEANING_IN_PROGRESS').length;
    const outOfServiceBeds = wardBeds.filter((b) => b.status === 'OUT_OF_SERVICE').length;

    const occupancyPercentage = ward.operationalCapacity > 0
      ? Number(((occupiedBeds / ward.operationalCapacity) * 100).toFixed(1))
      : 0;

    let status: WardOccupancySummary['status'] = 'NORMAL';
    if (occupancyPercentage > 100) {
      status = 'OVER_CAPACITY';
    } else if (availableBeds === 0 && occupiedBeds + reservedBeds >= ward.operationalCapacity) {
      status = 'FULL';
    } else if (occupancyPercentage >= ward.criticalThreshold) {
      status = 'HIGH_OCCUPANCY';
    } else if (occupancyPercentage >= ward.warningThreshold) {
      status = 'APPROACHING_CAPACITY';
    }

    const pendingAdmissions = db.admissions.filter(
      (a) => a.requestedWardId === ward.id && (a.status === 'PENDING' || a.status === 'APPROVED')
    ).length;

    const pendingTransfers = db.transfers.filter(
      (t) => (t.sendingWardId === ward.id || t.receivingWardId === ward.id) &&
             (t.status === 'REQUESTED' || t.status === 'AWAITING_ACCEPTANCE' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS')
    ).length;

    const pendingRequests = db.bedRequests.filter(
      (r) => r.requestedWardId === ward.id && (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'PARTIALLY_FULFILLED')
    ).length;

    return {
      wardId: ward.id,
      wardName: ward.name,
      wardCode: ward.code,
      departmentName: dept?.name || 'General',
      installedCapacity: ward.installedCapacity,
      operationalCapacity: ward.operationalCapacity,
      occupiedBeds,
      availableBeds,
      reservedBeds,
      blockedBeds,
      outOfServiceBeds,
      occupancyPercentage,
      warningThreshold: ward.warningThreshold,
      criticalThreshold: ward.criticalThreshold,
      status,
      pendingAdmissions,
      pendingTransfers,
      pendingRequests,
      managerName: ward.wardManager,
      lastUpdated: ward.lastSyncTime || new Date().toISOString(),
      isStale: false,
    };
  });
}
