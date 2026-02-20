import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { CreateAuditEntrySchema } from '@xero-replica/shared';
import type { AuditEntry } from '@xero-replica/shared';

/* ─── In-memory store ─── */
let store: AuditEntry[] = [];

function seedStore(): AuditEntry[] {
  const now = new Date('2026-02-16T12:00:00.000Z');
  const entries: AuditEntry[] = [
    // Invoices
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 1 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: null, newValue: 'draft' }],
    },
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-001',
      action: 'status_changed',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 0.5 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: 'draft', newValue: 'approved' }],
    },
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-001',
      action: 'sent',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 0.25 * 3600000).toISOString(),
      changes: [],
    },
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-002',
      action: 'created',
      userId: 'user-2',
      userName: 'Admin',
      timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: null, newValue: 'draft' }],
    },
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-002',
      action: 'payment_recorded',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
      changes: [{ field: 'amountPaid', oldValue: '0', newValue: '500.00' }],
    },

    // Bills
    {
      id: randomUUID(),
      entityType: 'bill',
      entityId: 'bill-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(),
      changes: [],
    },
    {
      id: randomUUID(),
      entityType: 'bill',
      entityId: 'bill-001',
      action: 'approved',
      userId: 'user-2',
      userName: 'Admin',
      timestamp: new Date(now.getTime() - 36 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: 'draft', newValue: 'approved' }],
    },
    {
      id: randomUUID(),
      entityType: 'bill',
      entityId: 'bill-002',
      action: 'voided',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 72 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: 'approved', newValue: 'voided' }],
    },

    // Contacts
    {
      id: randomUUID(),
      entityType: 'contact',
      entityId: 'c-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 96 * 3600000).toISOString(),
      changes: [],
    },
    {
      id: randomUUID(),
      entityType: 'contact',
      entityId: 'c-001',
      action: 'updated',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      changes: [
        { field: 'name', oldValue: 'Acme Corp', newValue: 'Acme Corporation' },
        { field: 'email', oldValue: 'info@acme.com', newValue: 'contact@acme.com' },
      ],
    },
    {
      id: randomUUID(),
      entityType: 'contact',
      entityId: 'c-002',
      action: 'deleted',
      userId: 'user-2',
      userName: 'Admin',
      timestamp: new Date(now.getTime() - 120 * 3600000).toISOString(),
      changes: [],
    },

    // Quotes
    {
      id: randomUUID(),
      entityType: 'quote',
      entityId: 'q-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
      changes: [],
    },
    {
      id: randomUUID(),
      entityType: 'quote',
      entityId: 'q-001',
      action: 'sent',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(),
      changes: [],
    },

    // Credit notes
    {
      id: randomUUID(),
      entityType: 'credit-note',
      entityId: 'cn-001',
      action: 'created',
      userId: 'user-2',
      userName: 'Admin',
      timestamp: new Date(now.getTime() - 168 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: null, newValue: 'draft' }],
    },

    // Purchase orders
    {
      id: randomUUID(),
      entityType: 'purchase-order',
      entityId: 'po-001',
      action: 'approved',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      changes: [{ field: 'status', oldValue: 'draft', newValue: 'approved' }],
    },

    // Payments
    {
      id: randomUUID(),
      entityType: 'payment',
      entityId: 'pay-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 6 * 3600000).toISOString(),
      changes: [],
    },

    // Accounts
    {
      id: randomUUID(),
      entityType: 'account',
      entityId: 'acc-001',
      action: 'updated',
      userId: 'user-2',
      userName: 'Admin',
      timestamp: new Date(now.getTime() - 240 * 3600000).toISOString(),
      changes: [{ field: 'name', oldValue: 'Old Account', newValue: 'New Account' }],
    },

    // Journals
    {
      id: randomUUID(),
      entityType: 'journal',
      entityId: 'j-001',
      action: 'created',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 10 * 3600000).toISOString(),
      changes: [],
    },
    {
      id: randomUUID(),
      entityType: 'journal',
      entityId: 'j-002',
      action: 'updated',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 200 * 3600000).toISOString(),
      changes: [{ field: 'narration', oldValue: 'Old narration', newValue: 'Updated narration' }],
    },

    // Additional invoice entries
    {
      id: randomUUID(),
      entityType: 'invoice',
      entityId: 'inv-003',
      action: 'updated',
      userId: 'user-1',
      userName: 'Demo User',
      timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(),
      changes: [
        { field: 'total', oldValue: '100.00', newValue: '250.00' },
        { field: 'dueDate', oldValue: '2026-02-20', newValue: '2026-03-01' },
      ],
    },
  ];

  return entries;
}

export function resetAuditStore() {
  store = seedStore();
}

// Initialize on module load
store = seedStore();

export function auditRoutes() {
  const router = new Hono();

  // GET / — List audit entries with optional filters
  router.get('/', (c) => {
    let results = [...store];

    // Filter by entityType
    const entityType = c.req.query('entityType');
    if (entityType) {
      results = results.filter((e) => e.entityType === entityType);
    }

    // Filter by action
    const action = c.req.query('action');
    if (action) {
      results = results.filter((e) => e.action === action);
    }

    // Filter by entityId
    const entityId = c.req.query('entityId');
    if (entityId) {
      results = results.filter((e) => e.entityId === entityId);
    }

    // Filter by date range
    const startDate = c.req.query('startDate');
    if (startDate) {
      const startTime = new Date(startDate).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() >= startTime);
    }

    const endDate = c.req.query('endDate');
    if (endDate) {
      const endTime = new Date(endDate).getTime();
      results = results.filter((e) => new Date(e.timestamp).getTime() <= endTime);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = results.length;

    // Pagination
    const offset = parseInt(c.req.query('offset') ?? '0', 10);
    const limit = parseInt(c.req.query('limit') ?? '50', 10);
    results = results.slice(offset, offset + limit);

    return c.json({ ok: true, data: results, total });
  });

  // GET /:id — Single audit entry
  router.get('/:id', (c) => {
    const id = c.req.param('id');
    const entry = store.find((e) => e.id === id);
    if (!entry) {
      return c.json({ ok: false, error: 'Audit entry not found' }, 404);
    }
    return c.json({ ok: true, data: entry });
  });

  // POST / — Create audit entry
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = CreateAuditEntrySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { ok: false, error: 'Validation failed', details: parsed.error.flatten() },
        400,
      );
    }

    const entry: AuditEntry = {
      id: randomUUID(),
      ...parsed.data,
    };

    store.push(entry);
    return c.json({ ok: true, data: entry }, 201);
  });

  return router;
}
