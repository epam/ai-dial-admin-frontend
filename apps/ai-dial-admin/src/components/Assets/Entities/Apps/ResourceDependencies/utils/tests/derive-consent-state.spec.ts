import { describe, expect, test } from 'vitest';

import { AdminConsentStatus } from '@/src/models/dial/resource-dependency';
import { deriveConsentState } from '../derive-consent-state';

const NO_RECORD: AdminConsentStatus = { consented: false };
const CONSENTED: AdminConsentStatus = { consented: true };
const STALE: AdminConsentStatus = { consented: false, stale: true };

describe('deriveConsentState', () => {
  test('offers no button when nothing is saved', () => {
    [NO_RECORD, CONSENTED, STALE].forEach((status) => {
      const state = deriveConsentState(0, status, false);

      expect(state.isApproveVisible).toBe(false);
      expect(state.isReApproveVisible).toBe(false);
      expect(state.isRevokeVisible).toBe(false);
    });
  });

  test('offers only Approve when there is no record', () => {
    const state = deriveConsentState(2, NO_RECORD, false);

    expect(state).toMatchObject({
      isApproved: false,
      hasRecord: false,
      isApproveVisible: true,
      isReApproveVisible: false,
      isRevokeVisible: false,
      isStaleNoteVisible: false,
    });
  });

  test('offers only Revoke when consented', () => {
    const state = deriveConsentState(2, CONSENTED, false);

    expect(state).toMatchObject({
      isApproved: true,
      hasRecord: true,
      isApproveVisible: false,
      isReApproveVisible: false,
      isRevokeVisible: true,
      isStaleNoteVisible: false,
    });
  });

  test('offers Re-Approve and Revoke when stale, and flags it', () => {
    const state = deriveConsentState(2, STALE, false);

    expect(state).toMatchObject({
      isApproved: false,
      isStale: true,
      hasRecord: true,
      isApproveVisible: false,
      isReApproveVisible: true,
      isRevokeVisible: true,
      isStaleNoteVisible: true,
    });
  });

  test('only disables approving, and shows the saved-definition note, while the draft is dirty', () => {
    const clean = deriveConsentState(2, STALE, false);
    const dirty = deriveConsentState(2, STALE, true);

    expect(clean.isApproveDisabled).toBe(false);
    expect(clean.isSavedDefinitionNoteVisible).toBe(false);
    expect(dirty).toMatchObject({
      isApproveDisabled: true,
      isSavedDefinitionNoteVisible: true,
      isReApproveVisible: true,
      isRevokeVisible: true,
    });
  });
});
