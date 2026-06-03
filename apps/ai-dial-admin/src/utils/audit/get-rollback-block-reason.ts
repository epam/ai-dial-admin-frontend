import { RollbackI18nKey } from '@/src/constants/i18n';
import { DeploymentEntityState } from '@/src/models/deployments/rollback';
import { isContainerDeploymentResource, isImageDefinitionResource } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

// Container is rollback-eligible only when inactive (NOT_DEPLOYED / STOPPED).
const BLOCKED_CONTAINER_STATUSES = new Set<CONTAINER_STATUS>([
  CONTAINER_STATUS.PENDING,
  CONTAINER_STATUS.RUNNING,
  CONTAINER_STATUS.FAILED,
  CONTAINER_STATUS.STOPPING,
]);

// Image is rollback-eligible only when not actively built (NOT_BUILT / BUILD_FAILED / BUILD_STOPPED).
const BLOCKED_IMAGE_STATUSES = new Set<IMAGE_STATUS>([IMAGE_STATUS.BUILDING, IMAGE_STATUS.BUILT]);

/**
 * Decide whether the current lifecycle state of a deployment-manager entity
 * blocks the in-place (Update) rollback path, returning the explanatory i18n
 * key or null when rollback is allowed. The global whitelist is never blocked.
 *
 * @param {string} [resourceType] - deployment-manager resource type
 * @param {DeploymentEntityState | null} [state] - current entity state
 * @returns {RollbackI18nKey | null} explanation key, or null when allowed
 */
export const getRollbackBlockReason = (
  resourceType?: string,
  state?: DeploymentEntityState | null,
): RollbackI18nKey | null => {
  if (!state) {
    return null;
  }
  if (isContainerDeploymentResource(resourceType) && state.status && BLOCKED_CONTAINER_STATUSES.has(state.status)) {
    return RollbackI18nKey.BlockedActiveDeployment;
  }
  if (isImageDefinitionResource(resourceType) && state.buildStatus && BLOCKED_IMAGE_STATUSES.has(state.buildStatus)) {
    return RollbackI18nKey.BlockedImageBuilding;
  }
  return null;
};
