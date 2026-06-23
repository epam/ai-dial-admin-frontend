import {
  deleteContainer,
  deleteImage,
  getDeploymentRevisionDetails,
  rollbackDeploymentContainer,
  rollbackDeploymentImage,
  rollbackDeploymentWhitelist,
} from '@/src/app/actions/deployments';
import { DialActivity } from '@/src/models/activity-audit';
import {
  ActivityAuditType,
  isContainerDeploymentResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';

export const getDeploymentRollbackAction = (type?: string) => {
  if (isContainerDeploymentResource(type)) return rollbackDeploymentContainer;
  if (isImageDefinitionResource(type)) return rollbackDeploymentImage;
  return null;
};

export const getDeploymentDeleteAction = (type?: string) => {
  if (isContainerDeploymentResource(type)) return deleteContainer;
  if (isImageDefinitionResource(type)) return deleteImage;
  return null;
};

/**
 * Roll back a single deployment-manager entity by undoing the selected audit
 * activity, i.e. restoring the entity to the state at `revision − 1`.
 *
 * - `Update` → the deployment-manager rollback endpoint (backend point-in-time)
 * - `Create` → delete the entity (it did not exist before)
 * - `Delete` → the deployment-manager rollback endpoint; the backend resurrects
 *   the currently-deleted entity from audit history and resets sensitive values
 *   server-side (no client-side recreate, which would 500 on masked secrets)
 * - whitelist (singleton) → full-replacement rollback endpoint regardless of type
 *
 * @param {DialActivity} activity - the audit activity being reverted
 * @returns {Promise<ServerActionResponse | null>} the server action result, or null when unsupported
 */
export const rollbackDeploymentEntity = async (activity: DialActivity) => {
  const { resourceType, activityType, revision } = activity;
  const id = decodeURIComponent(activity.resourceId ?? '');
  const targetRevision = revision - 1;

  if (isGlobalFirewallResource(resourceType)) {
    return rollbackDeploymentWhitelist(targetRevision);
  }

  if (activityType === ActivityAuditType.Create) {
    const snapshot = await getDeploymentRevisionDetails(resourceType, id, revision);
    const deleteId = isImageDefinitionResource(resourceType)
      ? ((snapshot?.id as string) ?? id)
      : ((snapshot?.name as string) ?? id);
    return getDeploymentDeleteAction(resourceType)?.(deleteId);
  }

  return getDeploymentRollbackAction(resourceType)?.(id, targetRevision);
};
