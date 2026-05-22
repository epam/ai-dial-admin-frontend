import { getRevisionDetails } from '@/src/app/[lang]/activity-audit/actions';
import { createAdapter, removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import {
  createApplicationScheme,
  removeApplicationScheme,
  updateApplicationScheme,
} from '@/src/app/[lang]/application-runners/actions';
import { createApplication, removeApplication, updateApplication } from '@/src/app/[lang]/applications/actions';
import { createInterceptor, removeInterceptor, updateInterceptor } from '@/src/app/[lang]/interceptors/actions';
import {
  createInterceptorTemplate,
  deleteInterceptorTemplate,
  updateInterceptorTemplate,
} from '@/src/app/[lang]/interceptor-templates/actions';
import { createKey, removeKey, updateKey } from '@/src/app/[lang]/keys/actions';
import { createModel, removeModel, updateModel } from '@/src/app/[lang]/models/actions';
import { createRole, removeRole, updateRole } from '@/src/app/[lang]/roles/actions';
import { createRoute, removeRoute, updateRoute } from '@/src/app/[lang]/routes/actions';
import {
  rollbackContainerToRevision,
  rollbackImageBuildWhitelistToRevision,
  rollbackImageDefinitionToRevision,
} from '@/src/app/actions/deployments';
import { DialActivity } from '@/src/models/activity-audit';
import {
  ActivityAuditEntity,
  ActivityAuditResourceType,
  ActivityAuditType,
  isContainerDeploymentResource,
  isDeploymentManagerResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { getRevisionRouteForEntityType } from './get-revision-route';
import { createToolset, removeToolset, updateToolset } from '@/src/app/[lang]/toolsets/actions';

const rollbackDeploymentManagerResource = (activity: DialActivity, targetRevision: number) => {
  const id = decodeURIComponent(activity.resourceId ?? '');
  if (isContainerDeploymentResource(activity.resourceType)) {
    return rollbackContainerToRevision(id, targetRevision);
  }
  if (isImageDefinitionResource(activity.resourceType)) {
    return rollbackImageDefinitionToRevision(id, targetRevision);
  }
  if (isGlobalFirewallResource(activity.resourceType)) {
    return rollbackImageBuildWhitelistToRevision(targetRevision);
  }
  return null;
};

export const rollbackEntityPerRevision = async (
  activity: DialActivity,
  activityRevision: ActivityAuditEntity | null,
  previousRevision: ActivityAuditEntity | null,
) => {
  if (isDeploymentManagerResource(activity.resourceType)) {
    return rollbackDeploymentManagerResource(activity, activity.revision - 1);
  }

  if (activity.activityType === ActivityAuditType.Create) {
    return getDeleteAction(activity.resourceType)?.(activityRevision?.name as string);
  }

  if (activity.activityType === ActivityAuditType.Delete) {
    return getCreateAction(activity.resourceType)?.(previousRevision as any);
  }

  return getUpdateAction(activity.resourceType)?.(previousRevision as any);
};

export const rollbackEntityPerType = async (activity: DialActivity) => {
  if (isDeploymentManagerResource(activity.resourceType)) {
    return rollbackDeploymentManagerResource(activity, activity.revision - 1);
  }

  const route = getRevisionRouteForEntityType(activity.resourceType, decodeURIComponent(activity.resourceId));

  if (activity.activityType === ActivityAuditType.Create) {
    const revision = await getRevisionDetails(`${route}${activity.revision}`);
    return getDeleteAction(activity.resourceType)?.((revision?.name || revision?.$id) as string);
  }

  if (activity.activityType === ActivityAuditType.Delete) {
    const revision = await getRevisionDetails(`${route}${activity.revision - 1}`);
    return getCreateAction(activity.resourceType)?.(revision as unknown as any);
  }

  const revision = await getRevisionDetails(`${route}${activity.revision - 1}`);

  return getUpdateAction(activity.resourceType)?.(revision as unknown as any);
};

export const getUpdateAction = (type?: ActivityAuditResourceType): any => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return updateModel;
    case ActivityAuditResourceType.APPLICATION:
      return updateApplication;
    case ActivityAuditResourceType.ADAPTER:
      return updateAdapter;
    case ActivityAuditResourceType.INTERCEPTOR:
      return updateInterceptor;
    case ActivityAuditResourceType.KEY:
      return updateKey;
    case ActivityAuditResourceType.ROLE:
      return updateRole;
    case ActivityAuditResourceType.ROUTE:
      return updateRoute;
    case ActivityAuditResourceType.TOOLSET:
      return updateToolset;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return updateApplicationScheme;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return updateInterceptorTemplate;
    default:
      return null;
  }
};

export const getCreateAction = (type?: ActivityAuditResourceType) => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return createModel;
    case ActivityAuditResourceType.APPLICATION:
      return createApplication;
    case ActivityAuditResourceType.ADAPTER:
      return createAdapter;
    case ActivityAuditResourceType.INTERCEPTOR:
      return createInterceptor;
    case ActivityAuditResourceType.KEY:
      return createKey;
    case ActivityAuditResourceType.ROLE:
      return createRole;
    case ActivityAuditResourceType.ROUTE:
      return createRoute;
    case ActivityAuditResourceType.TOOLSET:
      return createToolset;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return createApplicationScheme;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return createInterceptorTemplate;
    default:
      return null;
  }
};

export const getDeleteAction = (type?: ActivityAuditResourceType) => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return removeModel;
    case ActivityAuditResourceType.APPLICATION:
      return removeApplication;
    case ActivityAuditResourceType.ADAPTER:
      return removeAdapter;
    case ActivityAuditResourceType.INTERCEPTOR:
      return removeInterceptor;
    case ActivityAuditResourceType.KEY:
      return removeKey;
    case ActivityAuditResourceType.ROLE:
      return removeRole;
    case ActivityAuditResourceType.ROUTE:
      return removeRoute;
    case ActivityAuditResourceType.TOOLSET:
      return removeToolset;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return removeApplicationScheme;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return deleteInterceptorTemplate;
    default:
      return null;
  }
};
