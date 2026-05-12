import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { activityAuditApi, deploymentAuditApi, globalFirewallApi, imagesApi } from '@/src/app/api/api';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import SystemRollback from '@/src/components/ActivityAudit/Rollback/SystemRollback';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { DialActivity } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { errorObjLog } from '@/src/server/logger';
import { ActivityAuditEntity, isGlobalFirewallResource, isImageDefinitionResource } from '@/src/types/activity-audit';
import { SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

const SORT_BY_TIME_DESC = [{ column: 'epochTimestampMs', direction: SortDirectionDto.DESC }];

interface ResolverHandlers {
  filter: (activity: DialActivity) => FilterDto[];
  fetchSnapshot: (activity: DialActivity, revision: number, token: Token) => Promise<ActivityAuditEntity | null>;
  listActivities: (filters: FilterDto[], token: Token) => Promise<{ data?: DialActivity[]; total?: number } | null>;
}

const adminListActivities: ResolverHandlers['listActivities'] = (filters, token) =>
  activityAuditApi.getActivitiesList(1, 0, token, SORT_BY_TIME_DESC, filters);

const deploymentListActivities: ResolverHandlers['listActivities'] = (filters, token) =>
  deploymentAuditApi.getActivitiesList(1, 0, token, SORT_BY_TIME_DESC, filters);

const fetchAdminSnapshot: ResolverHandlers['fetchSnapshot'] = (activity, revision, token) => {
  const route = getRevisionRouteForEntityType(activity.resourceType, decodeURIComponent(activity.resourceId ?? ''));
  return route ? activityAuditApi.getRevisionDetails(`${route}${revision}`, token) : Promise.resolve(null);
};

const fetchImageSnapshot: ResolverHandlers['fetchSnapshot'] = (activity, revision, token) => {
  const route = getRevisionRouteForEntityType(activity.resourceType, decodeURIComponent(activity.resourceId ?? ''));
  return route ? imagesApi.getRevisionDetails(`${route}${revision}`, token) : Promise.resolve(null);
};

const fetchFirewallSnapshot: ResolverHandlers['fetchSnapshot'] = async (_activity, revision, token) => {
  if (revision < 0) return null;
  const domains = await globalFirewallApi.getRevisionDetails(revision, token);
  return domains == null ? null : { domains };
};

const filterByResourceId: ResolverHandlers['filter'] = (activity) => [
  { column: 'resourceId', value: activity.resourceId ?? '', operator: 'eq' } as FilterDto,
];

const filterByResourceType: ResolverHandlers['filter'] = (activity) => [
  { column: 'resourceType', value: activity.resourceType, operator: 'eq' } as FilterDto,
];

const adminHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: fetchAdminSnapshot,
  listActivities: adminListActivities,
};

const imageHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: fetchImageSnapshot,
  listActivities: deploymentListActivities,
};

const firewallHandlers: ResolverHandlers = {
  filter: filterByResourceType,
  fetchSnapshot: fetchFirewallSnapshot,
  listActivities: deploymentListActivities,
};

const pickHandlers = (activity: DialActivity, isDeploymentActivity: boolean): ResolverHandlers | null => {
  if (!isDeploymentActivity) return adminHandlers;
  if (isGlobalFirewallResource(activity.resourceType)) return firewallHandlers;
  if (isImageDefinitionResource(activity.resourceType)) return imageHandlers;
  return null;
};

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;
  let entity: BaseEntity | undefined = void 0;

  try {
    const auditViewId = decodeURIComponent((await params.params).id);
    if (auditViewId === SYSTEM_ROLLBACK_ID) {
      return <SystemRollback />;
    }

    const adminResponse = await activityAuditApi.getActivityById(auditViewId, token);
    activity = (adminResponse?.response as DialActivity | null) ?? null;
    let isDeploymentActivity = false;

    if (!activity) {
      const deploymentResponse = await deploymentAuditApi.getActivityById(auditViewId, token);
      activity = (deploymentResponse?.response as DialActivity | null) ?? null;
      isDeploymentActivity = activity != null;
    }

    if (activity) {
      const handlers = pickHandlers(activity, isDeploymentActivity);
      if (!handlers) {
        activity = null;
      } else {
        const [activities, fetchedActivityRevision, fetchedPreviousRevision] = await Promise.all([
          handlers.listActivities(handlers.filter(activity), token),
          handlers.fetchSnapshot(activity, activity.revision, token),
          handlers.fetchSnapshot(activity, activity.revision - 1, token),
        ]);
        activityRevision = fetchedActivityRevision;
        previousRevision = fetchedPreviousRevision;
        const latestRevision = activities?.data?.[0]?.revision;
        if (latestRevision != null) {
          entity = (await handlers.fetchSnapshot(activity, latestRevision, token)) as BaseEntity | undefined;
        }
      }
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch activity view data');
  }

  if (activity == null) {
    notFound();
  }

  return (
    <AuditView
      activity={activity}
      activityRevision={activityRevision}
      previousRevision={previousRevision}
      entity={entity}
    />
  );
}
