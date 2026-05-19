import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { AUDIT_LIST_PRESELECT_STORAGE_KEY } from '@/src/constants/audit-list-preselect';
import { AuditListPreselect } from '@/src/types/audit-list-preselect';
import { clearAuditListPreselect, readAuditListPreselect, saveAuditListPreselect } from '../audit-list-preselect';

describe('audit-list-preselect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveAuditListPreselect', () => {
    test('writes the enum value to sessionStorage', () => {
      saveAuditListPreselect(AuditListPreselect.GlobalFirewall);

      expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe(AuditListPreselect.GlobalFirewall);
    });

    test('no-ops when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(typeof window).toBe('undefined');

      expect(() => saveAuditListPreselect(AuditListPreselect.GlobalFirewall)).not.toThrow();
    });
  });

  describe('readAuditListPreselect', () => {
    test('returns the saved value without clearing the key', () => {
      saveAuditListPreselect(AuditListPreselect.GlobalFirewall);

      const result = readAuditListPreselect();

      expect(result).toBe(AuditListPreselect.GlobalFirewall);
      expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe(AuditListPreselect.GlobalFirewall);
    });

    test('is idempotent — repeated calls return the same value', () => {
      saveAuditListPreselect(AuditListPreselect.GlobalFirewall);

      expect(readAuditListPreselect()).toBe(AuditListPreselect.GlobalFirewall);
      expect(readAuditListPreselect()).toBe(AuditListPreselect.GlobalFirewall);
    });

    test('returns null when no entry exists', () => {
      expect(readAuditListPreselect()).toBeNull();
    });

    test('returns null when the stored value is not a known enum member (without clearing)', () => {
      sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, 'something-else');

      expect(readAuditListPreselect()).toBeNull();
      expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBe('something-else');
    });

    test('returns null when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(typeof window).toBe('undefined');

      expect(readAuditListPreselect()).toBeNull();
    });
  });

  describe('clearAuditListPreselect', () => {
    test('removes the key from sessionStorage', () => {
      saveAuditListPreselect(AuditListPreselect.GlobalFirewall);

      clearAuditListPreselect();

      expect(sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY)).toBeNull();
    });

    test('no-ops when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(typeof window).toBe('undefined');

      expect(() => clearAuditListPreselect()).not.toThrow();
    });
  });
});
