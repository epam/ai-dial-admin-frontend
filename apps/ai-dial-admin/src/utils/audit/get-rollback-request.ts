import { getRevisionDetails } from '@/src/app/[lang]/activity-audit/actions';
import { createAdapter, removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import { createAddon, removeAddon, updateAddon } from '@/src/app/[lang]/addons/actions';
import {
  createApplicationScheme,
  removeApplicationScheme,
  updateApplicationScheme,
} from '@/src/app/[lang]/application-runners/actions';
import { createApplication, removeApplication, updateApplication } from '@/src/app/[lang]/applications/actions';
import { createAssistant, removeAssistant, updateAssistant } from '@/src/app/[lang]/assistants/actions';
import { createInterceptor, removeInterceptor, updateInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { createKey, removeKey, updateKey } from '@/src/app/[lang]/keys/actions';
import { createModel, removeModel, updateModel } from '@/src/app/[lang]/models/actions';
import { createRole, removeRole, updateRole } from '@/src/app/[lang]/roles/actions';
import { createRoute, removeRoute, updateRoute } from '@/src/app/[lang]/routes/actions';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditEntity, ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { getRevisionRouteForEntityType } from './get-revision-route';

export const rollbackEntityPerRevision = async (
  activity: DialActivity,
  activityRevision: ActivityAuditEntity | null,
  previousRevision: ActivityAuditEntity | null,
) => {
  if (activity.activityType === ActivityAuditType.Create) {
    return getDeleteAction(activity.resourceType)?.(activityRevision?.name as string);
  }

  if (activity.activityType === ActivityAuditType.Delete) {
    return getCreateAction(activity.resourceType)?.(previousRevision as any);
  }

  return getUpdateAction(activity.resourceType)?.(previousRevision as any);
};

export const rollbackEntityPerType = async (activity: DialActivity) => {
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

export const getUpdateAction = (type?: ActivityAuditResourceType) => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return updateModel;
    case ActivityAuditResourceType.APPLICATION:
      return updateApplication;
    case ActivityAuditResourceType.ADAPTER:
      return updateAdapter;
    case ActivityAuditResourceType.ASSISTANT:
      return updateAssistant;
    case ActivityAuditResourceType.INTERCEPTOR:
      return updateInterceptor;
    case ActivityAuditResourceType.KEY:
      return updateKey;
    case ActivityAuditResourceType.ROLE:
      return updateRole;
    case ActivityAuditResourceType.ROUTE:
      return updateRoute;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return updateApplicationScheme;
    case ActivityAuditResourceType.ADDON:
      return updateAddon;
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
    case ActivityAuditResourceType.ASSISTANT:
      return createAssistant;
    case ActivityAuditResourceType.INTERCEPTOR:
      return createInterceptor;
    case ActivityAuditResourceType.KEY:
      return createKey;
    case ActivityAuditResourceType.ROLE:
      return createRole;
    case ActivityAuditResourceType.ROUTE:
      return createRoute;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return createApplicationScheme;
    case ActivityAuditResourceType.ADDON:
      return createAddon;
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
    case ActivityAuditResourceType.ASSISTANT:
      return removeAssistant;
    case ActivityAuditResourceType.INTERCEPTOR:
      return removeInterceptor;
    case ActivityAuditResourceType.KEY:
      return removeKey;
    case ActivityAuditResourceType.ROLE:
      return removeRole;
    case ActivityAuditResourceType.ROUTE:
      return removeRoute;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return removeApplicationScheme;
    case ActivityAuditResourceType.ADDON:
      return removeAddon;
    default:
      return null;
  }
};
