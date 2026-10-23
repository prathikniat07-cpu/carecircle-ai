import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeDatabase, getDb } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';
import { toolRegistry } from '../src/tools/registry.js';
import { approvalGate } from '../src/ai/gate.js';
import { proactiveEngine } from '../src/proactive/engine.js';
import { sesService } from '../src/aws/ses.js';
import { orchestrator } from '../src/ai/orchestrator.js';

describe('CareCircle AI Automated Test Suite', () => {
  before(() => {
    initializeDatabase();
    seedDatabase();
  });

  test('Database contains seeded demo records for Meera Rao', () => {
    const db = getDb();
    const caregivers = db.prepare('SELECT * FROM caregivers').all();
    assert.equal(caregivers.length, 2, 'Should have 2 caregivers');

    const anika = caregivers.find((c: any) => c.id === 'cg-anika');
    assert.ok(anika, 'Anika Rao should exist');

    const appointments = db.prepare('SELECT * FROM appointments').all();
    assert.ok(appointments.length >= 2, 'Should have at least 2 appointments');

    const tasks = db.prepare('SELECT * FROM care_tasks').all();
    assert.ok(tasks.length >= 4, 'Should have care tasks');
  });

  test('Tool Registry: executes get_daily_summary and returns structured data', async () => {
    const result = (await toolRegistry.executeTool('get_daily_summary', {})) as any;
    assert.equal(result.recipient, 'Meera Rao');
    assert.ok(typeof result.open_tasks_count === 'number');
    assert.ok(Array.isArray(result.upcoming_appointments));
    assert.ok(Array.isArray(result.priority_tasks));
  });

  test('Tool Registry: rejects unlisted tools safely', async () => {
    await assert.rejects(
      async () => {
        await toolRegistry.executeTool('unauthorized_tool', {});
      },
      { message: /not an allowlisted CareCircle tool/ }
    );
  });

  test('Tool Registry: find_unconfirmed_tasks spots pending transport', async () => {
    const result = (await toolRegistry.executeTool('find_unconfirmed_tasks', {})) as any;
    assert.ok(Array.isArray(result.appointments_with_pending_transport));
    assert.ok(result.appointments_with_pending_transport.length > 0);
    assert.equal(result.appointments_with_pending_transport[0].transport_status, 'pending');
  });

  test('Approval Gate: enforces explicit confirmation and prevents duplicate actions (Idempotency)', async () => {
    // 1. Create a pending action
    const pending = approvalGate.createPendingAction({
      action_type: 'assign_care_task',
      target_type: 'care_task',
      target_id: 'task-1',
      proposed_changes: {
        taskTitle: 'Confirm transport for 11:00 AM clinic visit',
        assigned_to: 'cg-anika',
        assigneeName: 'Anika Rao',
      },
    });

    assert.equal(pending.status, 'pending');

    // 2. Confirm action
    const confirmResult = await approvalGate.confirmPendingAction(pending.id);
    assert.equal(confirmResult.success, true);

    const updated = approvalGate.getPendingAction(pending.id);
    assert.equal(updated?.status, 'confirmed');

    // 3. Duplicate confirmation attempt must be rejected!
    await assert.rejects(
      async () => {
        await approvalGate.confirmPendingAction(pending.id);
      },
      { message: /already been confirmed/ }
    );
  });

  test('Proactive Engine: detects approaching appointment risk and deduplicates', () => {
    const alertsFirstRun = proactiveEngine.evaluateCareRisks();
    assert.ok(alertsFirstRun.length > 0, 'Should detect at least 1 risk');
    assert.equal(alertsFirstRun[0].appointment_id, 'apt-1');
    assert.match(alertsFirstRun[0].message, /transport is still unconfirmed/);

    const firstActionId = alertsFirstRun[0].proposed_action_id;

    // Second run must reuse identical pending action (deduplication)
    const alertsSecondRun = proactiveEngine.evaluateCareRisks();
    assert.equal(alertsSecondRun[0].proposed_action_id, firstActionId);
  });

  test('Amazon SES Adapter: generates verified payload and records audit log in simulation mode', async () => {
    const db = getDb();
    const result = await sesService.sendAppointmentReminder({
      recipientEmail: 'ravi.rao@example.com',
      recipientName: 'Ravi Rao',
      appointmentTitle: 'Routine clinic appointment',
      appointmentTime: '11:00 AM',
      appointmentDate: '2026-10-21',
      message: 'Please confirm transport for Meera.',
      idempotencyToken: 'test-token-123',
    });

    assert.equal(result.success, true);
    assert.equal(result.recipient, 'ravi.rao@example.com');
    assert.ok(result.messageId);

    // Verify written to audit log
    const auditEvent = db.prepare('SELECT * FROM activity_events WHERE target_id = ? ORDER BY timestamp DESC LIMIT 1').get('ravi.rao@example.com') as any;
    assert.ok(auditEvent, 'Audit event must exist');
    assert.equal(auditEvent.result, 'success');
  });

  test('Assistant Orchestrator: handles "Prepare today\'s care plan." with structured tools', async () => {
    const response = await orchestrator.handleUserMessage("Prepare today's care plan.");
    assert.ok(response.message.includes('Meera Rao'));
    assert.equal(response.tools_called.length, 1);
    assert.equal(response.tools_called[0].name, 'get_daily_summary');
  });

  test('Assistant Orchestrator: generates approval card when user requests caregiver reminder', async () => {
    const response = await orchestrator.handleUserMessage("Remind Ravi about Meera's transport.");
    assert.ok(response.pending_action, 'Should include pending_action proposal');
    assert.equal(response.pending_action?.action_type, 'send_reminder_email');
    assert.equal(response.pending_action?.proposed_changes.recipientName, 'Ravi Rao');
  });
});
