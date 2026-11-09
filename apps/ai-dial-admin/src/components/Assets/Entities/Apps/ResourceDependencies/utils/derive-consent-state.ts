import { AdminConsentStatus } from '@/src/models/dial/resource-dependency';
import { ConsentViewState } from '../models';

// Status comes from Core's flags as-is: a record exists exactly when it is live (`consented`) or `stale`.
// `isDirty` never changes the label or which buttons exist — it only disables approving, because Core
// approves the saved declaration.
export const deriveConsentState = (
  savedCount: number,
  status: AdminConsentStatus,
  isDirty: boolean,
): ConsentViewState => {
  const isApproved = status.consented;
  const isStale = !!status.stale;
  const hasRecord = isApproved || isStale;
  const hasSavedDependencies = savedCount > 0;

  return {
    isApproved,
    isStale,
    hasRecord,
    isApproveVisible: hasSavedDependencies && !hasRecord,
    isReApproveVisible: hasSavedDependencies && isStale,
    isRevokeVisible: hasSavedDependencies && hasRecord,
    isApproveDisabled: isDirty,
    isSavedDefinitionNoteVisible: isDirty,
    isStaleNoteVisible: isStale,
  };
};
