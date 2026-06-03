import {
  createContainer,
  createImage,
  deleteContainer,
  deleteImage,
  getDeploymentRevisionDetails,
  rollbackDeploymentContainer,
  rollbackDeploymentImage,
  rollbackDeploymentWhitelist,
} from '@/src/app/actions/deployments';
import { DialActivity } from '@/src/models/activity-audit';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import {
  ActivityAuditType,
  isContainerDeploymentResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { buildCreateBodyFromSnapshot } from './build-create-body-from-snapshot';

export const getDeploymentRollbackAction = (type?: string) => {
  if (isContainerDeploymentResource(type)) return rollbackDeploymentContainer;
  if (isImageDefinitionResource(type)) return rollbackDeploymentImage;
  return null;
};

export const getDeploymentCreateAction = (type?: string) => {
  if (isContainerDeploymentResource(type)) return createContainer;
  if (isImageDefinitionResource(type)) return createImage;
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
 * - `Delete` → recreate the entity from the prior snapshot
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

  if (activityType === ActivityAuditType.Delete) {
    const snapshot = await getDeploymentRevisionDetails(resourceType, id, targetRevision);
    const body = buildCreateBodyFromSnapshot(snapshot, resourceType);
    if (isImageDefinitionResource(resourceType)) {
      return createImage(body as Partial<Image>);
    }
    return createContainer(body as unknown as Container);
  }

  return getDeploymentRollbackAction(resourceType)?.(id, targetRevision);
};
