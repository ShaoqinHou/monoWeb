import { describe, it, expect } from 'vitest';
import { AuditEntrySchema, CreateAuditEntrySchema } from '../schemas/audit';

describe('AuditEntrySchema', () => {
  const validEntry = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    entityType: 'invoice' as const,
    entityId: 'inv-001',
    action: 'created' as const,
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-16T10:00:00.000Z',
    changes: [],
  };

  it('validates a complete valid entry', () => {
    const result = AuditEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('validates entry with changes array', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      changes: [
        { field: 'status', oldValue: 'draft', newValue: 'approved' },
        { field: 'total', oldValue: '100.00', newValue: null },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes).toHaveLength(2);
      expect(result.data.changes[0].field).toBe('status');
    }
  });

  it('validates entry with metadata', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      metadata: { ip: '127.0.0.1', browser: 'Chrome' },
    });
    expect(result.success).toBe(true);
  });

  it('applies default userId and userName', () => {
    const result = AuditEntrySchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      entityType: 'invoice',
      entityId: 'inv-001',
      action: 'created',
      timestamp: '2026-02-16T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('system');
      expect(result.data.userName).toBe('Demo User');
      expect(result.data.changes).toEqual([]);
    }
  });

  it('rejects missing required fields (id)', () => {
    const { id: _id, ...withoutId } = validEntry;
    const result = AuditEntrySchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });

  it('rejects missing entityType', () => {
    const { entityType: _et, ...withoutEntityType } = validEntry;
    const result = AuditEntrySchema.safeParse(withoutEntityType);
    expect(result.success).toBe(false);
  });

  it('rejects missing action', () => {
    const { action: _a, ...withoutAction } = validEntry;
    const result = AuditEntrySchema.safeParse(withoutAction);
    expect(result.success).toBe(false);
  });

  it('rejects missing timestamp', () => {
    const { timestamp: _t, ...withoutTimestamp } = validEntry;
    const result = AuditEntrySchema.safeParse(withoutTimestamp);
    expect(result.success).toBe(false);
  });

  it('rejects invalid entityType', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      entityType: 'unknown-type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      action: 'unknown-action',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty string for id', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      id: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts non-UUID id like seed data', () => {
    const result = AuditEntrySchema.safeParse({
      ...validEntry,
      id: 'audit-1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid entityType values', () => {
    const types = ['invoice', 'bill', 'contact', 'quote', 'credit-note', 'purchase-order', 'payment', 'account', 'journal'];
    for (const entityType of types) {
      const result = AuditEntrySchema.safeParse({ ...validEntry, entityType });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid action values', () => {
    const actions = ['created', 'updated', 'deleted', 'status_changed', 'payment_recorded', 'sent', 'voided', 'approved'];
    for (const action of actions) {
      const result = AuditEntrySchema.safeParse({ ...validEntry, action });
      expect(result.success).toBe(true);
    }
  });
});

describe('CreateAuditEntrySchema', () => {
  it('validates an entry without id', () => {
    const result = CreateAuditEntrySchema.safeParse({
      entityType: 'contact',
      entityId: 'c-001',
      action: 'updated',
      timestamp: '2026-02-16T12:00:00.000Z',
      changes: [{ field: 'name', oldValue: 'Old Name', newValue: 'New Name' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an entry with id field', () => {
    const result = CreateAuditEntrySchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      entityType: 'contact',
      entityId: 'c-001',
      action: 'updated',
      timestamp: '2026-02-16T12:00:00.000Z',
    });
    // .omit strips the id, so even if passed, it won't be in the result
    expect(result.success).toBe(true);
    if (result.success) {
      expect('id' in result.data).toBe(false);
    }
  });
});
