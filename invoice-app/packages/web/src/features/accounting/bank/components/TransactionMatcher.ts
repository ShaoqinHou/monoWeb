import type { ImportTransactionRow } from '../types';

export interface MatchCandidate {
  entityType: 'invoice' | 'bill' | 'payment';
  entityId: string;
  label: string;
  amount: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface InvoiceRecord {
  id: string;
  number: string;
  contactName: string;
  total: number;
  amountDue: number;
}

interface BillRecord {
  id: string;
  number: string;
  contactName: string;
  total: number;
  amountDue: number;
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * Find matching invoices/bills for a bank transaction.
 *
 * Matching rules:
 * - Positive amounts match invoices (money in)
 * - Negative amounts match bills (money out)
 * - Exact amount match -> high confidence
 * - Description contains invoice/bill number -> high confidence
 * - Description contains contact name -> medium confidence
 * - Amount within 5% -> low confidence
 *
 * Results are deduplicated and sorted by confidence (high first).
 */
export function findMatches(
  transaction: ImportTransactionRow,
  invoices: InvoiceRecord[],
  bills: BillRecord[],
): MatchCandidate[] {
  const candidates = new Map<string, MatchCandidate>();
  const absAmount = Math.abs(transaction.amount);
  const descLower = transaction.description.toLowerCase();

  // Determine which entities to match against
  const isInflow = transaction.amount > 0;

  if (isInflow) {
    // Match against invoices
    for (const inv of invoices) {
      matchEntity(
        candidates,
        'invoice',
        inv.id,
        inv.number,
        inv.contactName,
        inv.amountDue,
        absAmount,
        descLower,
      );
    }
  } else {
    // Match against bills
    for (const bill of bills) {
      matchEntity(
        candidates,
        'bill',
        bill.id,
        bill.number,
        bill.contactName,
        bill.amountDue,
        absAmount,
        descLower,
      );
    }
  }

  // Sort by confidence (high -> medium -> low)
  const results = Array.from(candidates.values());
  results.sort((a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]);
  return results;
}

function matchEntity(
  candidates: Map<string, MatchCandidate>,
  entityType: 'invoice' | 'bill',
  id: string,
  number: string,
  contactName: string,
  amountDue: number,
  absAmount: number,
  descLower: string,
): void {
  const label = `${number} - ${contactName}`;

  // Rule 1: Exact amount match -> high
  if (Math.abs(amountDue - absAmount) < 0.01) {
    upsertCandidate(candidates, {
      entityType,
      entityId: id,
      label,
      amount: amountDue,
      confidence: 'high',
      reason: 'Amount matches exactly',
    });
  }

  // Rule 2: Description contains invoice/bill number -> high
  if (number && descLower.includes(number.toLowerCase())) {
    upsertCandidate(candidates, {
      entityType,
      entityId: id,
      label,
      amount: amountDue,
      confidence: 'high',
      reason: `Description contains ${entityType} number "${number}"`,
    });
  }

  // Rule 3: Description contains contact name -> medium
  if (contactName && descLower.includes(contactName.toLowerCase())) {
    upsertCandidate(candidates, {
      entityType,
      entityId: id,
      label,
      amount: amountDue,
      confidence: 'medium',
      reason: `Description contains contact name "${contactName}"`,
    });
  }

  // Rule 4: Amount within 5% -> low
  const maxAmt = Math.max(absAmount, amountDue);
  if (maxAmt > 0) {
    const diff = Math.abs(amountDue - absAmount);
    const pct = diff / maxAmt;
    if (pct > 0.001 && pct <= 0.05) {
      // >0.1% to exclude exact matches, <=5%
      upsertCandidate(candidates, {
        entityType,
        entityId: id,
        label,
        amount: amountDue,
        confidence: 'low',
        reason: `Amount is close (within ${(pct * 100).toFixed(1)}%)`,
      });
    }
  }
}

/**
 * Insert or upgrade a candidate. If a candidate with the same entityId already
 * exists, keep the one with higher confidence.
 */
function upsertCandidate(
  map: Map<string, MatchCandidate>,
  candidate: MatchCandidate,
): void {
  const existing = map.get(candidate.entityId);
  if (!existing) {
    map.set(candidate.entityId, candidate);
    return;
  }

  // Keep higher confidence
  if (CONFIDENCE_ORDER[candidate.confidence] < CONFIDENCE_ORDER[existing.confidence]) {
    map.set(candidate.entityId, candidate);
  }
}
