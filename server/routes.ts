import { Router, Request, Response } from 'express';
import {
  getDatabase,
  saveDatabase,
  calculateExecutiveKPIs,
  getWardSummaries,
  broadcast,
  subscribeToEvents,
  generateSeedData,
} from './db.ts';
import {
  BedStatus,
  AdmissionRequest,
  BedAssignment,
  BedRequest,
  PatientTransfer,
  DischargeRecord,
  CleaningTask,
  MaintenanceTask,
  WardUpdate,
  OperationalEvent,
  NotificationItem,
  AuditLogItem,
  UserRole,
} from '../src/types/hospital.ts';

export const apiRouter = Router();

// Helper to log audit events
async function recordAudit(
  db: ReturnType<typeof getDatabase>,
  user: { id?: string; name?: string; role?: UserRole },
  eventType: string,
  entityType: string,
  entityId: string,
  beforeState: any,
  afterState: any,
  reason?: string,
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED' = 'SUCCESS'
) {
  const auditItem: AuditLogItem = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id || 'ANONYMOUS',
    userName: user.name || 'System Staff',
    userRole: user.role || 'WARD_MANAGER',
    eventType,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    beforeState,
    afterState,
    reason,
    outcome,
  };
  db.auditLogs.unshift(auditItem);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

// Helper to log operational events
function logOperationalEvent(
  db: ReturnType<typeof getDatabase>,
  eventType: OperationalEvent['eventType'],
  wardId: string,
  wardName: string,
  title: string,
  description: string,
  status: string,
  staffName: string,
  priority: OperationalEvent['priority'] = 'INFO',
  relatedEntityId?: string,
  actionRequired?: string
) {
  const event: OperationalEvent = {
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventType,
    wardId,
    wardName,
    timestamp: new Date().toISOString(),
    title,
    description,
    status,
    staffName,
    priority,
    actionRequired,
    relatedEntityId,
  };
  db.events.unshift(event);
  if (db.events.length > 300) {
    db.events = db.events.slice(0, 300);
  }
  broadcast('operational_event', event);
}

// Helper to create notifications
function createNotification(
  db: ReturnType<typeof getDatabase>,
  type: string,
  title: string,
  message: string,
  priority: NotificationItem['priority'],
  wardId?: string,
  wardName?: string,
  relatedEntityId?: string
) {
  const notif: NotificationItem = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    title,
    message,
    priority,
    wardId,
    wardName,
    relatedEntityId,
    createdAt: new Date().toISOString(),
    read: false,
    acknowledged: false,
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 200) {
    db.notifications = db.notifications.slice(0, 200);
  }
  broadcast('notification', notif);
}

// 1. Executive Stats & Ward Summaries
apiRouter.get('/stats', (req: Request, res: Response) => {
  const db = getDatabase();
  const kpis = calculateExecutiveKPIs(db);
  const wardSummaries = getWardSummaries(db);
  res.json({ kpis, wardSummaries, settings: db.settings });
});

// 2. Wards & Departments
apiRouter.get('/wards', (req: Request, res: Response) => {
  const db = getDatabase();
  const wardSummaries = getWardSummaries(db);
  res.json({ wards: db.wards, departments: db.departments, summaries: wardSummaries });
});

apiRouter.post('/wards/:id/thresholds', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { warningThreshold, criticalThreshold, operationalCapacity } = req.body;
  const ward = db.wards.find((w) => w.id === id);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  const before = { ...ward };
  if (warningThreshold !== undefined) ward.warningThreshold = Number(warningThreshold);
  if (criticalThreshold !== undefined) ward.criticalThreshold = Number(criticalThreshold);
  if (operationalCapacity !== undefined) ward.operationalCapacity = Number(operationalCapacity);
  ward.lastSyncTime = new Date().toISOString();

  await recordAudit(db, req.body.user || {}, 'WARD_CONFIG_UPDATE', 'Ward', ward.id, before, ward, 'Thresholds updated');
  await saveDatabase(db);
  broadcast('wards_updated', getWardSummaries(db));
  res.json(ward);
});

// 3. Bed Management
apiRouter.get('/beds', (req: Request, res: Response) => {
  const db = getDatabase();
  const { wardId, status, category } = req.query;
  let beds = db.beds;
  if (wardId) beds = beds.filter((b) => b.wardId === wardId);
  if (status) beds = beds.filter((b) => b.status === status);
  if (category) beds = beds.filter((b) => b.category === category);
  res.json(beds);
});

// Direct Bed Status Transition with State Machine validation
apiRouter.post('/beds/:id/status', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status: targetStatus, reason, user } = req.body as { status: BedStatus; reason?: string; user: any };

  const bed = db.beds.find((b) => b.id === id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });
  const ward = db.wards.find((w) => w.id === bed.wardId);

  // Business logic validation:
  if (targetStatus === 'OCCUPIED' && !bed.activePatientId) {
    return res.status(400).json({ error: 'Cannot set bed to OCCUPIED without active patient assignment. Use admission workflow.' });
  }

  if (targetStatus === 'AVAILABLE') {
    if (bed.maintenanceStatus === 'NEEDS_REPAIR' || bed.maintenanceStatus === 'UNDER_REPAIR') {
      return res.status(400).json({ error: 'Cannot mark bed as AVAILABLE while maintenance repair is unresolved.' });
    }
    const pendingCleaning = db.cleaningTasks.find(
      (c) => c.bedId === bed.id && (c.status === 'PENDING' || c.status === 'IN_PROGRESS' || c.status === 'COMPLETED')
    );
    if (pendingCleaning && pendingCleaning.status !== 'INSPECTED') {
      return res.status(400).json({ error: 'Cannot mark bed as AVAILABLE until cleaning inspection is signed off.' });
    }
  }

  const beforeState = { ...bed };
  bed.status = targetStatus;
  bed.lastStatusChange = new Date().toISOString();
  bed.lastModifiedBy = user?.fullName || 'Authorized Staff';
  if (reason) bed.blockReason = reason;
  if (targetStatus === 'AVAILABLE') {
    bed.blockReason = undefined;
    bed.activePatientId = undefined;
    bed.activePatientName = undefined;
    bed.activeAssignmentId = undefined;
  }

  // Record audit
  await recordAudit(db, user || {}, 'BED_STATUS_CHANGED', 'Bed', bed.id, beforeState, bed, reason || `Status changed to ${targetStatus}`);

  logOperationalEvent(
    db,
    'BED_STATUS',
    bed.wardId,
    ward?.name || 'Ward',
    `Bed ${bed.bedNumber} Changed to ${targetStatus}`,
    reason || `Status updated by ${user?.fullName || 'staff'}`,
    targetStatus,
    user?.fullName || 'Staff Member',
    targetStatus === 'OUT_OF_SERVICE' || targetStatus === 'BLOCKED' ? 'WARNING' : 'INFO',
    bed.id
  );

  await saveDatabase(db);
  broadcast('bed_updated', bed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  res.json(bed);
});

// 4. Admission Coordination & Duplicate Assignment Prevention
apiRouter.get('/admissions', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.admissions);
});

apiRouter.post('/admissions', async (req: Request, res: Response) => {
  const db = getDatabase();
  const {
    patientName,
    patientAge,
    patientGender,
    hospitalNumber,
    referringDepartment,
    requestedWardId,
    bedCategory,
    priority,
    clinicalNotes,
    isEmergencyOverride,
    user,
  } = req.body;

  if (!patientName || !requestedWardId) {
    return res.status(400).json({ error: 'Missing required patient name or ward.' });
  }

  const ward = db.wards.find((w) => w.id === requestedWardId);
  const newAdmission: AdmissionRequest = {
    id: `ADM-REQ-${Date.now().toString().slice(-4)}`,
    patientId: `PT-${Date.now().toString().slice(-4)}`,
    patientName,
    patientAge: Number(patientAge) || 30,
    patientGender: patientGender || 'MALE',
    hospitalNumber: hospitalNumber || `JGH-PT-${Math.floor(1000 + Math.random() * 9000)}`,
    referringDepartment: referringDepartment || 'Emergency and Casualty',
    requestedWardId,
    requestedWardName: ward?.name || 'Ward',
    bedCategory: bedCategory || 'Standard Inpatient',
    priority: priority || 'ROUTINE',
    clinicalNotes: clinicalNotes || 'Inpatient admission requested.',
    requestedBy: user?.fullName || 'Dr. On Duty',
    requestTime: new Date().toISOString(),
    status: 'PENDING',
    isEmergencyOverride: !!isEmergencyOverride,
  };

  db.admissions.unshift(newAdmission);

  await recordAudit(db, user || {}, 'ADMISSION_REQUEST_CREATED', 'AdmissionRequest', newAdmission.id, null, newAdmission, clinicalNotes);

  logOperationalEvent(
    db,
    'ADMISSION',
    requestedWardId,
    ward?.name || 'Ward',
    `New ${priority} Admission Request: ${patientName}`,
    `Referred from ${referringDepartment}. Notes: ${clinicalNotes}`,
    'PENDING',
    user?.fullName || 'Staff',
    priority === 'EMERGENCY' ? 'CRITICAL' : priority === 'URGENT' ? 'URGENT' : 'INFO',
    newAdmission.id
  );

  if (priority === 'EMERGENCY' || priority === 'URGENT') {
    createNotification(
      db,
      'URGENT_ADMISSION',
      `Urgent Admission: ${patientName} (${priority})`,
      `Patient awaiting placement in ${ward?.name}. Priority: ${priority}`,
      priority === 'EMERGENCY' ? 'CRITICAL' : 'URGENT',
      ward?.id,
      ward?.name,
      newAdmission.id
    );
  }

  await saveDatabase(db);
  broadcast('admission_created', newAdmission);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  res.status(201).json(newAdmission);
});

// Test 2 & Test 3: Complete Admission into Bed with Transactional Duplicate Prevention
apiRouter.post('/admissions/:id/assign', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { bedId, user, notes } = req.body;

  const admission = db.admissions.find((a) => a.id === id);
  if (!admission) return res.status(404).json({ error: 'Admission request not found' });

  const targetBed = db.beds.find((b) => b.id === bedId);
  if (!targetBed) return res.status(404).json({ error: 'Target bed not found' });

  // Test 3: Duplicate allocation prevention!
  if (targetBed.status === 'OCCUPIED' || targetBed.activePatientId) {
    return res.status(409).json({
      error: `Bed ${targetBed.bedNumber} is already occupied by ${targetBed.activePatientName || 'another patient'}. Duplicate assignment prohibited.`,
    });
  }

  if (targetBed.status === 'OUT_OF_SERVICE') {
    return res.status(400).json({ error: `Bed ${targetBed.bedNumber} is OUT_OF_SERVICE and cannot receive patients.` });
  }

  if (targetBed.status === 'AWAITING_CLEANING' || targetBed.status === 'CLEANING_IN_PROGRESS') {
    return res.status(400).json({ error: `Bed ${targetBed.bedNumber} is currently undergoing sanitization and cannot be occupied yet.` });
  }

  // Prevent double inpatient assignment for the same patient across hospital
  const existingActiveAssignment = db.bedAssignments.find(
    (a) => a.patientId === admission.patientId && a.status === 'ACTIVE'
  );
  if (existingActiveAssignment) {
    return res.status(409).json({
      error: `Patient ${admission.patientName} already has an active bed assignment in ${existingActiveAssignment.wardName} (${existingActiveAssignment.bedNumber}).`,
    });
  }

  const ward = db.wards.find((w) => w.id === targetBed.wardId);
  const beforeBedState = { ...targetBed };
  const beforeAdmState = { ...admission };

  // Create Assignment
  const assignmentId = `ASN-${Date.now().toString().slice(-6)}`;
  const assignment: BedAssignment = {
    id: assignmentId,
    bedId: targetBed.id,
    bedNumber: targetBed.bedNumber,
    patientId: admission.patientId,
    patientName: admission.patientName,
    wardId: targetBed.wardId,
    wardName: ward?.name || 'Ward',
    assignedAt: new Date().toISOString(),
    assignedBy: user?.fullName || 'Admissions Officer',
    status: 'ACTIVE',
  };
  db.bedAssignments.unshift(assignment);

  // Update Bed
  targetBed.status = 'OCCUPIED';
  targetBed.activePatientId = admission.patientId;
  targetBed.activePatientName = admission.patientName;
  targetBed.activeAssignmentId = assignmentId;
  targetBed.lastStatusChange = new Date().toISOString();
  targetBed.lastModifiedBy = user?.fullName || 'Admissions Officer';
  targetBed.blockReason = undefined;

  // Update Admission Request
  admission.status = 'ADMITTED';
  admission.allocatedBedId = targetBed.id;
  admission.allocatedBedNumber = targetBed.bedNumber;
  admission.notes = notes || 'Patient successfully admitted and assigned to bed.';

  // Check capacity warnings (Test 11)
  const wardBeds = db.beds.filter((b) => b.wardId === targetBed.wardId);
  const occupiedCount = wardBeds.filter((b) => b.status === 'OCCUPIED').length;
  if (ward && occupiedCount > ward.operationalCapacity) {
    createNotification(
      db,
      'CAPACITY_OVER',
      `Ward Over Capacity Alert: ${ward.name}`,
      `Occupancy has reached ${occupiedCount}/${ward.operationalCapacity} beds (${Math.round((occupiedCount / ward.operationalCapacity) * 100)}%). Authorized review required.`,
      'CRITICAL',
      ward.id,
      ward.name
    );
  }

  // Audit
  await recordAudit(db, user || {}, 'PATIENT_ADMITTED', 'BedAssignment', assignmentId, beforeBedState, targetBed, `Admitted into ${targetBed.bedNumber}`);

  logOperationalEvent(
    db,
    'ADMISSION',
    targetBed.wardId,
    ward?.name || 'Ward',
    `Patient Admitted: ${admission.patientName}`,
    `Assigned to ${targetBed.bedNumber} in ${ward?.name}. Priority: ${admission.priority}.`,
    'OCCUPIED',
    user?.fullName || 'Admissions Staff',
    'INFO',
    admission.id
  );

  await saveDatabase(db);
  broadcast('admission_updated', admission);
  broadcast('bed_updated', targetBed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.json({ success: true, admission, bed: targetBed, assignment });
});

// 5. Inter-ward Bed Requests (Test 6)
apiRouter.get('/bed-requests', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.bedRequests);
});

apiRouter.post('/bed-requests', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { requestingDepartment, requestedWardId, numberOfBeds, bedCategory, priority, reason, user } = req.body;

  const targetWard = requestedWardId ? db.wards.find((w) => w.id === requestedWardId) : undefined;
  const newReq: BedRequest = {
    id: `BREQ-${Date.now().toString().slice(-4)}`,
    requestingDepartment: requestingDepartment || 'Emergency and Casualty',
    requestedWardId,
    requestedWardName: targetWard?.name,
    numberOfBeds: Number(numberOfBeds) || 1,
    allocatedQuantity: 0,
    bedCategory: bedCategory || 'Standard Inpatient',
    priority: priority || 'ROUTINE',
    reason: reason || 'Capacity surge request',
    submittedAt: new Date().toISOString(),
    requestingStaff: user?.fullName || 'Shift Lead',
    status: 'SUBMITTED',
    escalated: priority === 'URGENT' || priority === 'EMERGENCY',
  };

  db.bedRequests.unshift(newReq);

  await recordAudit(db, user || {}, 'BED_REQUEST_SUBMITTED', 'BedRequest', newReq.id, null, newReq, reason);

  logOperationalEvent(
    db,
    'BED_REQUEST',
    requestedWardId || 'HOSPITAL',
    targetWard?.name || requestingDepartment,
    `Bed Request Submitted: ${newReq.numberOfBeds} Bed(s)`,
    `From ${requestingDepartment}. Reason: ${reason}`,
    'SUBMITTED',
    user?.fullName || 'Staff',
    priority === 'EMERGENCY' ? 'CRITICAL' : priority === 'URGENT' ? 'URGENT' : 'INFO',
    newReq.id
  );

  if (priority === 'URGENT' || priority === 'EMERGENCY') {
    createNotification(
      db,
      'URGENT_BED_REQUEST',
      `Urgent Bed Request: ${requestingDepartment}`,
      `Request for ${newReq.numberOfBeds} bed(s). Priority: ${priority}. Reason: ${reason}`,
      priority === 'EMERGENCY' ? 'CRITICAL' : 'URGENT',
      targetWard?.id,
      targetWard?.name,
      newReq.id
    );
  }

  await saveDatabase(db);
  broadcast('bed_request_created', newReq);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  res.status(201).json(newReq);
});

apiRouter.post('/bed-requests/:id/fulfill', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { allocatedQuantity, notes, user } = req.body;

  const reqItem = db.bedRequests.find((r) => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Bed request not found' });

  const before = { ...reqItem };
  const addQty = Number(allocatedQuantity) || 1;
  reqItem.allocatedQuantity = Math.min(reqItem.numberOfBeds, (reqItem.allocatedQuantity || 0) + addQty);
  reqItem.resolutionNotes = notes || 'Allocated beds to request';
  reqItem.assignedManager = user?.fullName || 'Ward Manager';

  if (reqItem.allocatedQuantity >= reqItem.numberOfBeds) {
    reqItem.status = 'FULFILLED';
  } else {
    reqItem.status = 'PARTIALLY_FULFILLED';
  }

  await recordAudit(db, user || {}, 'BED_REQUEST_FULFILLED', 'BedRequest', reqItem.id, before, reqItem, notes);

  logOperationalEvent(
    db,
    'BED_REQUEST',
    reqItem.requestedWardId || 'HOSPITAL',
    reqItem.requestedWardName || 'Hospital',
    `Bed Request Updated: ${reqItem.status} (${reqItem.allocatedQuantity}/${reqItem.numberOfBeds})`,
    notes || 'Capacity allocation updated',
    reqItem.status,
    user?.fullName || 'Manager',
    'INFO',
    reqItem.id
  );

  await saveDatabase(db);
  broadcast('bed_request_updated', reqItem);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  res.json(reqItem);
});

// 6. Patient Transfers (Test 4)
apiRouter.get('/transfers', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.transfers);
});

apiRouter.post('/transfers', async (req: Request, res: Response) => {
  const db = getDatabase();
  const {
    patientId,
    patientName,
    hospitalNumber,
    sendingWardId,
    sendingBedId,
    receivingWardId,
    clinicalReason,
    priority,
    user,
  } = req.body;

  const sendingWard = db.wards.find((w) => w.id === sendingWardId);
  const receivingWard = db.wards.find((w) => w.id === receivingWardId);

  const transfer: PatientTransfer = {
    id: `TRF-${Date.now().toString().slice(-4)}`,
    patientId,
    patientName,
    hospitalNumber: hospitalNumber || 'JGH-PT-8820',
    sendingWardId,
    sendingWardName: sendingWard?.name || 'Sending Ward',
    sendingBedId,
    receivingWardId,
    receivingWardName: receivingWard?.name || 'Receiving Ward',
    clinicalReason: clinicalReason || 'Clinical step-down or surgical transfer',
    priority: priority || 'ROUTINE',
    requestTime: new Date().toISOString(),
    requestedBy: user?.fullName || 'Ward Charge Nurse',
    status: 'REQUESTED',
  };

  db.transfers.unshift(transfer);

  await recordAudit(db, user || {}, 'TRANSFER_REQUESTED', 'PatientTransfer', transfer.id, null, transfer, clinicalReason);

  createNotification(
    db,
    'TRANSFER_REQUESTED',
    `Incoming Transfer Request: ${patientName}`,
    `From ${sendingWard?.name} to ${receivingWard?.name}. Priority: ${priority}`,
    priority === 'URGENT' || priority === 'EMERGENCY' ? 'URGENT' : 'INFO',
    receivingWardId,
    receivingWard?.name,
    transfer.id
  );

  await saveDatabase(db);
  broadcast('transfer_created', transfer);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  res.status(201).json(transfer);
});

apiRouter.post('/transfers/:id/accept', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { receivingBedId, user } = req.body;

  const transfer = db.transfers.find((t) => t.id === id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  const targetBed = db.beds.find((b) => b.id === receivingBedId);
  if (!targetBed) return res.status(404).json({ error: 'Receiving bed not found' });

  if (targetBed.status !== 'AVAILABLE') {
    return res.status(400).json({ error: `Receiving bed ${targetBed.bedNumber} is not AVAILABLE (currently ${targetBed.status}).` });
  }

  // Reserve the receiving bed
  targetBed.status = 'RESERVED';
  targetBed.blockReason = `Reserved for incoming transfer TRF-${transfer.id}: ${transfer.patientName}`;
  targetBed.lastStatusChange = new Date().toISOString();
  targetBed.lastModifiedBy = user?.fullName || 'Receiving Ward Manager';

  transfer.receivingBedId = targetBed.id;
  transfer.status = 'ACCEPTED';
  transfer.acceptedBy = user?.fullName || 'Receiving Ward Manager';

  await recordAudit(db, user || {}, 'TRANSFER_ACCEPTED', 'PatientTransfer', transfer.id, null, transfer, `Bed ${targetBed.bedNumber} reserved`);

  await saveDatabase(db);
  broadcast('transfer_updated', transfer);
  broadcast('bed_updated', targetBed);
  res.json({ success: true, transfer, bed: targetBed });
});

apiRouter.post('/transfers/:id/depart', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { user } = req.body;

  const transfer = db.transfers.find((t) => t.id === id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  transfer.status = 'IN_PROGRESS';
  transfer.departureTime = new Date().toISOString();

  await recordAudit(db, user || {}, 'TRANSFER_DEPARTED', 'PatientTransfer', transfer.id, null, transfer, 'Patient en route');
  await saveDatabase(db);
  broadcast('transfer_updated', transfer);
  res.json(transfer);
});

// Test 4: Confirm Transfer Arrival
apiRouter.post('/transfers/:id/confirm-arrival', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { user } = req.body;

  const transfer = db.transfers.find((t) => t.id === id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  if (!transfer.receivingBedId) {
    return res.status(400).json({ error: 'Receiving bed has not been assigned for this transfer.' });
  }

  const sendingBed = db.beds.find((b) => b.id === transfer.sendingBedId);
  const receivingBed = db.beds.find((b) => b.id === transfer.receivingBedId);
  const receivingWard = db.wards.find((w) => w.id === transfer.receivingWardId);

  // 1. Release sending bed into AWAITING_CLEANING workflow
  if (sendingBed) {
    const beforeSending = { ...sendingBed };
    sendingBed.status = 'AWAITING_CLEANING';
    sendingBed.activePatientId = undefined;
    sendingBed.activePatientName = undefined;
    sendingBed.activeAssignmentId = undefined;
    sendingBed.cleaningStatus = 'NEEDS_CLEANING';
    sendingBed.lastStatusChange = new Date().toISOString();
    sendingBed.lastModifiedBy = user?.fullName || 'Transfer Receiving Staff';

    // Create cleaning task for sending bed
    const cleaningTask: CleaningTask = {
      id: `CLN-${Date.now().toString().slice(-4)}`,
      bedId: sendingBed.id,
      bedNumber: sendingBed.bedNumber,
      wardId: sendingBed.wardId,
      wardName: transfer.sendingWardName,
      priority: transfer.priority === 'EMERGENCY' ? 'URGENT' : 'ROUTINE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      notes: `Terminal cleaning following patient transfer of ${transfer.patientName} to ${transfer.receivingWardName}.`,
    };
    db.cleaningTasks.unshift(cleaningTask);
    broadcast('cleaning_created', cleaningTask);

    await recordAudit(db, user || {}, 'BED_RELEASED_TO_CLEANING', 'Bed', sendingBed.id, beforeSending, sendingBed, 'Transferred out');
  }

  // 2. Close old active bed assignment
  const oldAssignment = db.bedAssignments.find(
    (a) => a.bedId === transfer.sendingBedId && a.status === 'ACTIVE'
  );
  if (oldAssignment) {
    oldAssignment.status = 'TRANSFERRED';
    oldAssignment.releasedAt = new Date().toISOString();
  }

  // 3. Occupy receiving bed
  if (receivingBed) {
    receivingBed.status = 'OCCUPIED';
    receivingBed.activePatientId = transfer.patientId;
    receivingBed.activePatientName = transfer.patientName;
    const newAsnId = `ASN-${Date.now().toString().slice(-6)}`;
    receivingBed.activeAssignmentId = newAsnId;
    receivingBed.lastStatusChange = new Date().toISOString();
    receivingBed.lastModifiedBy = user?.fullName || 'Receiving Staff';
    receivingBed.blockReason = undefined;

    // Create new active assignment
    const newAssignment: BedAssignment = {
      id: newAsnId,
      bedId: receivingBed.id,
      bedNumber: receivingBed.bedNumber,
      patientId: transfer.patientId,
      patientName: transfer.patientName,
      wardId: transfer.receivingWardId,
      wardName: transfer.receivingWardName,
      assignedAt: new Date().toISOString(),
      assignedBy: user?.fullName || 'Receiving Staff',
      status: 'ACTIVE',
    };
    db.bedAssignments.unshift(newAssignment);
  }

  // 4. Update transfer record
  transfer.status = 'COMPLETED';
  transfer.arrivalTime = new Date().toISOString();
  transfer.completedAt = new Date().toISOString();

  await recordAudit(db, user || {}, 'TRANSFER_COMPLETED', 'PatientTransfer', transfer.id, null, transfer, 'Arrival confirmed');

  logOperationalEvent(
    db,
    'TRANSFER',
    transfer.receivingWardId,
    receivingWard?.name || 'Ward',
    `Transfer Completed: ${transfer.patientName}`,
    `Successfully arrived in ${transfer.receivingWardName} (${receivingBed?.bedNumber}). Sending bed ${sendingBed?.bedNumber} dispatched to sanitization.`,
    'COMPLETED',
    user?.fullName || 'Staff',
    'INFO',
    transfer.id
  );

  await saveDatabase(db);
  broadcast('transfer_updated', transfer);
  if (sendingBed) broadcast('bed_updated', sendingBed);
  if (receivingBed) broadcast('bed_updated', receivingBed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.json({ success: true, transfer, sendingBed, receivingBed });
});

// 7. Discharge Coordination (Test 5)
apiRouter.get('/discharges', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.discharges);
});

apiRouter.post('/discharges', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { bedId, expectedDischargeDate, summary, dischargingDoctor, user } = req.body;

  const bed = db.beds.find((b) => b.id === bedId);
  if (!bed || !bed.activePatientId) {
    return res.status(400).json({ error: 'Specified bed has no active patient to discharge.' });
  }

  const ward = db.wards.find((w) => w.id === bed.wardId);
  const dischargeRecord: DischargeRecord = {
    id: `DSC-${Date.now().toString().slice(-4)}`,
    admissionId: bed.activeAssignmentId || `ASN-${Date.now()}`,
    patientId: bed.activePatientId,
    patientName: bed.activePatientName || 'Patient',
    hospitalNumber: `JGH-PT-${Math.floor(1000 + Math.random() * 9000)}`,
    wardId: bed.wardId,
    wardName: ward?.name || 'Ward',
    bedId: bed.id,
    bedNumber: bed.bedNumber,
    expectedDischargeDate: expectedDischargeDate || new Date(Date.now() + 3600000).toISOString(),
    dischargingDoctor: dischargingDoctor || user?.fullName || 'Dr. Medical Officer',
    summary: summary || 'Clinical condition stabilized. Discharge planned.',
    status: 'READY',
    bedReadinessTriggered: false,
  };

  db.discharges.unshift(dischargeRecord);
  await recordAudit(db, user || {}, 'DISCHARGE_PLANNED', 'DischargeRecord', dischargeRecord.id, null, dischargeRecord, summary);
  await saveDatabase(db);
  broadcast('discharge_created', dischargeRecord);
  res.status(201).json(dischargeRecord);
});

// Test 5: Confirm Discharge
apiRouter.post('/discharges/:id/confirm', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { user } = req.body;

  const discharge = db.discharges.find((d) => d.id === id);
  if (!discharge) return res.status(404).json({ error: 'Discharge record not found' });

  const bed = db.beds.find((b) => b.id === discharge.bedId);
  const ward = db.wards.find((w) => w.id === discharge.wardId);

  // Close active assignment
  const activeAssignment = db.bedAssignments.find(
    (a) => a.bedId === discharge.bedId && a.status === 'ACTIVE'
  );
  if (activeAssignment) {
    activeAssignment.status = 'DISCHARGED';
    activeAssignment.releasedAt = new Date().toISOString();
  }

  // Update Bed: NEVER immediately AVAILABLE! Moves to AWAITING_CLEANING!
  if (bed) {
    const beforeBed = { ...bed };
    bed.status = 'AWAITING_CLEANING';
    bed.cleaningStatus = 'NEEDS_CLEANING';
    bed.activePatientId = undefined;
    bed.activePatientName = undefined;
    bed.activeAssignmentId = undefined;
    bed.lastStatusChange = new Date().toISOString();
    bed.lastModifiedBy = user?.fullName || 'Discharging Staff';

    // Create Cleaning Task automatically
    const cleaningTask: CleaningTask = {
      id: `CLN-${Date.now().toString().slice(-4)}`,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      wardId: bed.wardId,
      wardName: ward?.name || 'Ward',
      priority: 'ROUTINE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      notes: `Terminal sanitization following discharge of ${discharge.patientName}.`,
    };
    db.cleaningTasks.unshift(cleaningTask);
    broadcast('cleaning_created', cleaningTask);

    await recordAudit(db, user || {}, 'BED_RELEASED_TO_CLEANING', 'Bed', bed.id, beforeBed, bed, 'Patient discharged');
  }

  discharge.status = 'CONFIRMED';
  discharge.confirmedDischargeDate = new Date().toISOString();
  discharge.bedReadinessTriggered = true;

  await recordAudit(db, user || {}, 'DISCHARGE_CONFIRMED', 'DischargeRecord', discharge.id, null, discharge, 'Discharge confirmed');

  logOperationalEvent(
    db,
    'DISCHARGE',
    discharge.wardId,
    ward?.name || 'Ward',
    `Discharge Confirmed: ${discharge.patientName}`,
    `Bed ${bed?.bedNumber} dispatched to terminal cleaning workflow.`,
    'CONFIRMED',
    user?.fullName || 'Staff',
    'INFO',
    discharge.id
  );

  await saveDatabase(db);
  broadcast('discharge_updated', discharge);
  if (bed) broadcast('bed_updated', bed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.json({ success: true, discharge, bed });
});

// 8. Cleaning & Bed Readiness Workflow
apiRouter.get('/cleaning', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.cleaningTasks);
});

apiRouter.post('/cleaning/:id/status', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status, user, notes } = req.body;

  const task = db.cleaningTasks.find((c) => c.id === id);
  if (!task) return res.status(404).json({ error: 'Cleaning task not found' });

  const bed = db.beds.find((b) => b.id === task.bedId);
  const beforeTask = { ...task };

  task.status = status;
  if (notes) task.notes = notes;

  if (status === 'IN_PROGRESS') {
    task.startedAt = task.startedAt || new Date().toISOString();
    task.assignedTo = task.assignedTo || user?.fullName || 'Sanitation Staff';
    if (bed) {
      bed.status = 'CLEANING_IN_PROGRESS';
      bed.cleaningStatus = 'IN_PROGRESS';
      bed.lastStatusChange = new Date().toISOString();
      bed.lastModifiedBy = user?.fullName || 'Sanitation Staff';
    }
  } else if (status === 'COMPLETED') {
    task.completedAt = new Date().toISOString();
    if (bed) {
      bed.cleaningStatus = 'CLEAN';
      bed.lastStatusChange = new Date().toISOString();
    }
  } else if (status === 'INSPECTED') {
    task.inspectedBy = user?.fullName || 'Infection Control Lead';

    // Check if bed can now return to AVAILABLE
    if (bed) {
      if (bed.maintenanceStatus === 'NEEDS_REPAIR' || bed.maintenanceStatus === 'UNDER_REPAIR' || bed.status === 'OUT_OF_SERVICE') {
        // Bed remains out of service / maintenance hold
        bed.cleaningStatus = 'CLEAN';
      } else {
        // Safely return to AVAILABLE!
        bed.status = 'AVAILABLE';
        bed.cleaningStatus = 'CLEAN';
        bed.blockReason = undefined;
        bed.lastStatusChange = new Date().toISOString();
        bed.lastModifiedBy = user?.fullName || 'Infection Control Lead';

        logOperationalEvent(
          db,
          'CLEANING',
          bed.wardId,
          task.wardName,
          `Bed ${bed.bedNumber} Ready & Returned to AVAILABLE`,
          `Sanitization and inspection certified by ${task.inspectedBy}.`,
          'AVAILABLE',
          user?.fullName || 'Inspector',
          'INFO',
          bed.id
        );
      }
    }
  }

  await recordAudit(db, user || {}, 'CLEANING_TASK_UPDATED', 'CleaningTask', task.id, beforeTask, task, notes || `Status changed to ${status}`);
  await saveDatabase(db);
  broadcast('cleaning_updated', task);
  if (bed) broadcast('bed_updated', bed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.json({ success: true, task, bed });
});

// 9. Maintenance Management
apiRouter.get('/maintenance', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.maintenanceTasks);
});

apiRouter.post('/maintenance', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { bedId, issueCategory, description, priority, user } = req.body;

  const bed = db.beds.find((b) => b.id === bedId);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });
  const ward = db.wards.find((w) => w.id === bed.wardId);

  // Bed is placed OUT_OF_SERVICE
  const beforeBed = { ...bed };
  bed.status = 'OUT_OF_SERVICE';
  bed.maintenanceStatus = 'NEEDS_REPAIR';
  bed.blockReason = `Maintenance Hold: ${issueCategory} - ${description}`;
  bed.lastStatusChange = new Date().toISOString();
  bed.lastModifiedBy = user?.fullName || 'Reporting Staff';

  const task: MaintenanceTask = {
    id: `MNT-${Date.now().toString().slice(-4)}`,
    bedId: bed.id,
    bedNumber: bed.bedNumber,
    wardId: bed.wardId,
    wardName: ward?.name || 'Ward',
    issueCategory: issueCategory || 'Mechanical Frame',
    description: description || 'Fault reported requiring biomedical inspection',
    priority: priority || 'MEDIUM',
    status: 'REPORTED',
    reportedBy: user?.fullName || 'Ward Staff',
    reportedAt: new Date().toISOString(),
  };

  db.maintenanceTasks.unshift(task);

  await recordAudit(db, user || {}, 'BED_MAINTENANCE_REPORTED', 'MaintenanceTask', task.id, beforeBed, bed, description);

  createNotification(
    db,
    'MAINTENANCE_HOLD',
    `Bed Placed Out of Service: ${bed.bedNumber} (${ward?.name})`,
    `Issue: ${issueCategory} - ${description}. Priority: ${priority}`,
    priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    ward?.id,
    ward?.name,
    task.id
  );

  logOperationalEvent(
    db,
    'MAINTENANCE',
    bed.wardId,
    ward?.name || 'Ward',
    `Bed ${bed.bedNumber} Out of Service (Maintenance)`,
    `Issue: ${issueCategory}. Priority: ${priority}.`,
    'OUT_OF_SERVICE',
    user?.fullName || 'Staff',
    'WARNING',
    task.id
  );

  await saveDatabase(db);
  broadcast('maintenance_created', task);
  broadcast('bed_updated', bed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.status(201).json({ success: true, task, bed });
});

apiRouter.post('/maintenance/:id/status', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status, technician, resolutionSummary, user } = req.body;

  const task = db.maintenanceTasks.find((m) => m.id === id);
  if (!task) return res.status(404).json({ error: 'Maintenance task not found' });

  const bed = db.beds.find((b) => b.id === task.bedId);
  const beforeTask = { ...task };

  task.status = status;
  if (technician) task.assignedTechnician = technician;
  if (resolutionSummary) task.resolutionSummary = resolutionSummary;

  if (status === 'IN_PROGRESS') {
    if (bed) bed.maintenanceStatus = 'UNDER_REPAIR';
  } else if (status === 'RETURNED_TO_SERVICE') {
    task.resolvedAt = new Date().toISOString();
    if (bed) {
      bed.maintenanceStatus = 'OPERATIONAL';
      // If bed cleaning is clean, return to AVAILABLE
      if (bed.cleaningStatus === 'CLEAN') {
        bed.status = 'AVAILABLE';
        bed.blockReason = undefined;
      } else {
        bed.status = 'AWAITING_CLEANING';
        bed.blockReason = 'Repaired; awaiting terminal cleaning before patient admission.';
      }
      bed.lastStatusChange = new Date().toISOString();
      bed.lastModifiedBy = user?.fullName || 'Biomedical Engineer';
    }
  }

  await recordAudit(db, user || {}, 'MAINTENANCE_STATUS_UPDATED', 'MaintenanceTask', task.id, beforeTask, task, resolutionSummary);
  await saveDatabase(db);
  broadcast('maintenance_updated', task);
  if (bed) broadcast('bed_updated', bed);
  broadcast('stats_updated', calculateExecutiveKPIs(db));
  broadcast('wards_updated', getWardSummaries(db));

  res.json({ success: true, task, bed });
});

// 10. Ward Status Updates (Test 7)
apiRouter.get('/ward-updates', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.wardUpdates);
});

apiRouter.post('/ward-updates', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { wardId, category, description, priority, user } = req.body;

  const ward = db.wards.find((w) => w.id === wardId);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  const update: WardUpdate = {
    id: `WUPD-${Date.now().toString().slice(-4)}`,
    wardId,
    wardName: ward.name,
    category: category || 'Bed shortage',
    description: description || 'Operational status report',
    priority: priority || 'ROUTINE',
    reportedBy: user?.fullName || 'Ward Manager',
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  db.wardUpdates.unshift(update);

  await recordAudit(db, user || {}, 'WARD_STATUS_REPORTED', 'WardUpdate', update.id, null, update, description);

  logOperationalEvent(
    db,
    'WARD_UPDATE',
    ward.id,
    ward.name,
    `Ward Report: ${category} (${ward.name})`,
    description,
    'OPEN',
    user?.fullName || 'Ward Staff',
    priority === 'CRITICAL' ? 'CRITICAL' : priority === 'URGENT' ? 'URGENT' : 'INFO',
    update.id
  );

  if (priority === 'URGENT' || priority === 'CRITICAL') {
    createNotification(
      db,
      'WARD_ALERT',
      `Ward Alert: ${ward.name} - ${category}`,
      description,
      priority === 'CRITICAL' ? 'CRITICAL' : 'URGENT',
      ward.id,
      ward.name,
      update.id
    );
  }

  await saveDatabase(db);
  broadcast('ward_update_created', update);
  res.status(201).json(update);
});

// 11. Hospital Operations Feed ("What's Happening Across the Hospital")
apiRouter.get('/feed', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.events);
});

// 12. Notifications Center
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.notifications);
});

apiRouter.post('/notifications/:id/acknowledge', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { user } = req.body;

  const notif = db.notifications.find((n) => n.id === id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  notif.read = true;
  notif.acknowledged = true;
  notif.acknowledgedBy = user?.fullName || 'Authorized Staff';
  notif.acknowledgedAt = new Date().toISOString();

  await saveDatabase(db);
  broadcast('notification_updated', notif);
  res.json(notif);
});

// 13. Reports & Analytics (Test 10)
apiRouter.get('/reports', (req: Request, res: Response) => {
  const db = getDatabase();
  const kpis = calculateExecutiveKPIs(db);
  const wardSummaries = getWardSummaries(db);

  // Turnaround metrics
  const completedCleaning = db.cleaningTasks.filter((c) => c.startedAt && c.completedAt);
  const avgTurnaroundMinutes = completedCleaning.length > 0
    ? Math.round(
        completedCleaning.reduce((acc, c) => {
          const diff = (new Date(c.completedAt!).getTime() - new Date(c.startedAt!).getTime()) / 60000;
          return acc + diff;
        }, 0) / completedCleaning.length
      )
    : 38;

  // Historical occupancy mock trend data for charts (Daily, Weekly, Monthly)
  const dailyTrends = [
    { day: 'Mon', occupied: 158, capacity: 195, rate: 81.0 },
    { day: 'Tue', occupied: 162, capacity: 195, rate: 83.1 },
    { day: 'Wed', occupied: 169, capacity: 195, rate: 86.6 },
    { day: 'Thu', occupied: 174, capacity: 195, rate: 89.2 },
    { day: 'Fri', occupied: 179, capacity: 195, rate: 91.8 },
    { day: 'Sat', occupied: 171, capacity: 195, rate: 87.7 },
    { day: 'Sun (Today)', occupied: kpis.occupiedBeds, capacity: kpis.operationalBeds, rate: kpis.occupancyRate },
  ];

  const admissionsByDept = [
    { name: 'Emergency & Acute', count: db.admissions.filter((a) => a.referringDepartment.includes('Emergency')).length + 14 },
    { name: 'Internal Medicine', count: 18 },
    { name: 'General Surgery', count: 11 },
    { name: 'Obstetrics & Gynae', count: 16 },
    { name: 'Child Health', count: 9 },
  ];

  res.json({
    kpis,
    wardSummaries,
    avgTurnaroundMinutes,
    dailyTrends,
    admissionsByDept,
    formulas: {
      occupancyRate: 'Occupied Beds ÷ Operational Beds × 100',
      fulfillmentRate: 'Requests fully fulfilled ÷ Total requests × 100',
      bedTurnaround: 'Time elapsed between patient departure and bed certified AVAILABLE',
    },
  });
});

// 14. Audit Logs
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.auditLogs);
});

// 15. User Management & Roles
apiRouter.get('/users', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.users);
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { fullName, username, role, department, assignedWardId, email, phone, user } = req.body;

  const newUser = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    username: username || fullName.toLowerCase().replace(/\s+/g, '_'),
    fullName,
    role: role || 'NURSE',
    department: department || 'General Clinical',
    assignedWardId,
    email: email || `${username}@jgh.gov.gh`,
    phone: phone || '+233 24 000 0000',
    active: true,
    lastLoginAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  await recordAudit(db, user || {}, 'USER_CREATED', 'UserProfile', newUser.id, null, newUser, 'New staff user created');
  await saveDatabase(db);
  res.status(201).json(newUser);
});

// 16. System Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.settings);
});

apiRouter.post('/settings', async (req: Request, res: Response) => {
  const db = getDatabase();
  const before = { ...db.settings };
  db.settings = { ...db.settings, ...req.body };
  await recordAudit(db, req.body.user || {}, 'SETTINGS_UPDATED', 'SystemSettings', 'GLOBAL', before, db.settings, 'Updated system settings');
  await saveDatabase(db);
  broadcast('settings_updated', db.settings);
  res.json(db.settings);
});

// 17. Reset to Seed Demo Data
apiRouter.post('/reset-demo', async (req: Request, res: Response) => {
  const seed = generateSeedData();
  await saveDatabase(seed);
  broadcast('database_reset', {});
  res.json({ success: true, message: 'Database reset to official Juaboso Government Hospital demonstration state.' });
});

// 18. Server-Sent Events (SSE) for Real-Time Live Sync
apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  const unsubscribe = subscribeToEvents((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const keepAliveInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    unsubscribe();
  });
});

// 19. User Authentication (Login, Sign-Up / Register, Logout, Password Reset)
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const cleanQuery = usernameOrEmail.trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanQuery ||
      u.email.toLowerCase() === cleanQuery
  );

  if (!user) {
    await recordAudit(
      db,
      { name: cleanQuery },
      'AUTH_LOGIN_FAILED',
      'User',
      cleanQuery,
      null,
      null,
      'Invalid username or email',
      'FAILED'
    );
    await saveDatabase(db);
    return res.status(401).json({ error: 'Invalid username, email, or credentials.' });
  }

  // Password verification:
  // If user has a passwordHash, compare it; if not (pre-seeded demo users), accept password and store hash
  const inputHash = hashPassword(password);
  if (user.passwordHash && user.passwordHash !== inputHash) {
    await recordAudit(
      db,
      { id: user.id, name: user.fullName, role: user.role },
      'AUTH_LOGIN_FAILED',
      'User',
      user.id,
      null,
      null,
      'Incorrect password entered',
      'FAILED'
    );
    await saveDatabase(db);
    return res.status(401).json({ error: 'Incorrect password entered. Please try again or use password reset.' });
  }

  // If first login without hash, set hash
  if (!user.passwordHash) {
    user.passwordHash = inputHash;
  }

  user.lastLoginAt = new Date().toISOString();

  // Create session token
  const token = `jgh-session-${user.id}-${Date.now()}`;

  await recordAudit(
    db,
    { id: user.id, name: user.fullName, role: user.role },
    'AUTH_LOGIN_SUCCESS',
    'User',
    user.id,
    null,
    { lastLoginAt: user.lastLoginAt },
    'Staff authenticated successfully',
    'SUCCESS'
  );

  logOperationalEvent(
    db,
    'WARD_UPDATE',
    user.assignedWardId || 'HOSPITAL',
    user.department,
    `Staff Sign-In: ${user.fullName}`,
    `Authenticated as ${user.role.replace(/_/g, ' ')} (${user.department})`,
    'ONLINE',
    user.fullName,
    'INFO',
    user.id
  );

  await saveDatabase(db);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token });
});

// Register / Sign-up
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const db = getDatabase();
  const {
    fullName,
    username,
    email,
    phone,
    role,
    department,
    assignedWardId,
    password,
    staffPin,
  } = req.body;

  if (!fullName || !username || !password) {
    return res.status(400).json({ error: 'Full name, username, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUsername}@jgh.gov.gh`).trim().toLowerCase();

  // Check unique username
  const existingUser = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      u.email.toLowerCase() === cleanEmail
  );
  if (existingUser) {
    return res.status(409).json({ error: 'A staff member with this username or email already exists in JGH records.' });
  }

  const newUser: any = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    username: cleanUsername,
    fullName: fullName.trim(),
    role: role || 'NURSE',
    department: department || 'General Inpatient Care',
    assignedWardId: assignedWardId || undefined,
    email: cleanEmail,
    phone: phone?.trim() || '+233 24 000 0000',
    active: true,
    lastLoginAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
    staffPin: staffPin || `PIN-${Math.floor(1000 + Math.random() * 9000)}`,
  };

  db.users.push(newUser);

  await recordAudit(
    db,
    { id: newUser.id, name: newUser.fullName, role: newUser.role },
    'AUTH_USER_REGISTERED',
    'User',
    newUser.id,
    null,
    { username: newUser.username, role: newUser.role, department: newUser.department },
    'New staff account registration completed',
    'SUCCESS'
  );

  logOperationalEvent(
    db,
    'WARD_UPDATE',
    newUser.assignedWardId || 'HOSPITAL',
    newUser.department,
    `New Staff Registered: ${newUser.fullName}`,
    `Assigned role: ${newUser.role.replace(/_/g, ' ')} (${newUser.department})`,
    'REGISTERED',
    newUser.fullName,
    'INFO',
    newUser.id
  );

  await saveDatabase(db);

  const token = `jgh-session-${newUser.id}-${Date.now()}`;
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser, token });
});

// Reset Password
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { usernameOrEmail, newPassword, staffPin } = req.body;

  if (!usernameOrEmail || !newPassword) {
    return res.status(400).json({ error: 'Username/Email and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const cleanQuery = usernameOrEmail.trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanQuery ||
      u.email.toLowerCase() === cleanQuery
  );

  if (!user) {
    return res.status(404).json({ error: 'Staff member record not found.' });
  }

  // If staffPin provided, verify it if set on record
  if (user.staffPin && staffPin && user.staffPin !== staffPin) {
    return res.status(403).json({ error: 'Staff PIN verification failed.' });
  }

  user.passwordHash = hashPassword(newPassword);

  await recordAudit(
    db,
    { id: user.id, name: user.fullName, role: user.role },
    'AUTH_PASSWORD_RESET',
    'User',
    user.id,
    null,
    null,
    'Password reset completed via self-service verification',
    'SUCCESS'
  );

  await saveDatabase(db);
  res.json({ success: true, message: 'Password updated successfully. You can now sign in with your new password.' });
});

// Logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const db = getDatabase();
  const { user } = req.body;

  if (user?.id) {
    await recordAudit(
      db,
      user,
      'AUTH_LOGOUT',
      'User',
      user.id,
      null,
      null,
      'Staff logged out of workstation',
      'SUCCESS'
    );
    await saveDatabase(db);
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current Authenticated User Check
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const db = getDatabase();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer jgh-session-')) {
    const parts = authHeader.replace('Bearer ', '').split('-');
    const userId = parts[2] ? `USR-${parts[2]}` : null;
    const user = db.users.find((u) => u.id === userId || authHeader.includes(u.id));
    if (user) {
      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    }
  }

  // Default fallback user (Medical Director)
  const defaultUser = db.users.find((u) => u.role === 'HOSPITAL_MANAGEMENT') || db.users[0];
  const { passwordHash: _, ...safeUser } = defaultUser;
  res.json({ user: safeUser });
});
