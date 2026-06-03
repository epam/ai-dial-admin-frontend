import { getDeploymentEntityState } from '@/src/app/actions/deployments';
import { RollbackI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import {
  ActivityAuditType,
  isContainerDeploymentResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { getRollbackBlockReason } from './get-rollback-block-reason';

/**
 * Whether the `Update`→rollback path for this activity needs a live lifecycle
 * pre-check. Only container deployments and image definitions can be blocked by
 * an active state; everything else (whitelist, admin resources, Create/Delete)
 * is allowed without a fetch.
 *
 * @param {DialActivity} [activity] - the audit activity under consideration
 * @returns {boolean} true when a state fetch is required before rollback
 */
export const needsDeploymentLifecycleCheck = (activity?: DialActivity): boolean =>
  activity?.activityType === ActivityAuditType.Update &&
  (isContainerDeploymentResource(activity?.resourceType) || isImageDefinitionResource(activity?.resourceType));

/**
 * Fetch the entity's current lifecycle state and derive the rollback block
 * reason, returning the i18n key when blocked or null when allowed. Fetch
 * failures resolve to null — the backend 400 remains authoritative.
 *
 * @param {DialActivity} activity - the audit activity being rolled back
 * @returns {Promise<RollbackI18nKey | null>} the block-reason key, or null
 */
export const resolveDeploymentRollbackBlockReason = (activity: DialActivity): Promise<RollbackI18nKey | null> =>
  getDeploymentEntityState(activity.resourceType, decodeURIComponent(activity.resourceId ?? ''))
    .then((state) => getRollbackBlockReason(activity.resourceType, state))
    .catch(() => null);
