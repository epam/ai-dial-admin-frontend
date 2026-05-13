import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { readAndClearAuditTabReturn, saveAuditTabReturn } from '../audit-tab-return';
import { EntityViewTab } from '../tabs/utils';

const ENTITY_PATH = '/en/adapters/my-adapter';
const STORAGE_KEY = `audit-tab-return:${ENTITY_PATH}`;

describe('audit-tab-return', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveAuditTabReturn', () => {
    test('writes correct key and value to sessionStorage', () => {
      saveAuditTabReturn(ENTITY_PATH);

      const raw = sessionStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed).toEqual({
        mainTab: EntityViewTab.Audit,
        auditTab: EntityViewTab.Activities,
      });
    });

    test('no-ops when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);

      expect(() => saveAuditTabReturn(ENTITY_PATH)).not.toThrow();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('readAndClearAuditTabReturn', () => {
    test('returns saved state and removes the key', () => {
      saveAuditTabReturn(ENTITY_PATH);

      const result = readAndClearAuditTabReturn(ENTITY_PATH);

      expect(result).toEqual({
        mainTab: EntityViewTab.Audit,
        auditTab: EntityViewTab.Activities,
      });
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    test('returns null when no entry exists', () => {
      const result = readAndClearAuditTabReturn(ENTITY_PATH);

      expect(result).toBeNull();
    });

    test('returns null when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);

      const result = readAndClearAuditTabReturn(ENTITY_PATH);

      expect(result).toBeNull();
    });
  });
});
