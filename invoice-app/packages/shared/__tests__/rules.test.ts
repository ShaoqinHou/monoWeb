import { describe, it, expect } from 'vitest';
import { canTransition, nextStatuses, isEditable, canReceivePayment } from '../rules/invoice-status';

describe('invoice-status rules', () => {
  describe('canTransition', () => {
    it('draft → submitted', () => {
      expect(canTransition('draft', 'submitted')).toBe(true);
    });

    it('draft → voided', () => {
      expect(canTransition('draft', 'voided')).toBe(true);
    });

    it('draft → paid (invalid)', () => {
      expect(canTransition('draft', 'paid')).toBe(false);
    });

    it('submitted → approved', () => {
      expect(canTransition('submitted', 'approved')).toBe(true);
    });

    it('submitted → draft (send back)', () => {
      expect(canTransition('submitted', 'draft')).toBe(true);
    });

    it('approved → paid', () => {
      expect(canTransition('approved', 'paid')).toBe(true);
    });

    it('approved → voided', () => {
      expect(canTransition('approved', 'voided')).toBe(true);
    });

    it('paid → anything (terminal)', () => {
      expect(canTransition('paid', 'draft')).toBe(false);
      expect(canTransition('paid', 'submitted')).toBe(false);
      expect(canTransition('paid', 'approved')).toBe(false);
      expect(canTransition('paid', 'voided')).toBe(false);
    });

    it('voided → anything (terminal)', () => {
      expect(canTransition('voided', 'draft')).toBe(false);
      expect(canTransition('voided', 'paid')).toBe(false);
    });
  });

  describe('nextStatuses', () => {
    it('draft can go to submitted or voided', () => {
      expect(nextStatuses('draft')).toEqual(['submitted', 'voided']);
    });

    it('submitted can go to approved, draft, or voided', () => {
      expect(nextStatuses('submitted')).toEqual(['approved', 'draft', 'voided']);
    });

    it('paid has no next states', () => {
      expect(nextStatuses('paid')).toEqual([]);
    });
  });

  describe('isEditable', () => {
    it('draft is editable', () => {
      expect(isEditable('draft')).toBe(true);
    });

    it('submitted is not editable', () => {
      expect(isEditable('submitted')).toBe(false);
    });

    it('approved is not editable', () => {
      expect(isEditable('approved')).toBe(false);
    });
  });

  describe('canReceivePayment', () => {
    it('only approved can receive payment', () => {
      expect(canReceivePayment('draft')).toBe(false);
      expect(canReceivePayment('submitted')).toBe(false);
      expect(canReceivePayment('approved')).toBe(true);
      expect(canReceivePayment('paid')).toBe(false);
      expect(canReceivePayment('voided')).toBe(false);
    });
  });
});
