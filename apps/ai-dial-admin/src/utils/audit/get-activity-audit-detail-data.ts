import { activityAuditApi, containersApi, deploymentAuditApi, globalFirewallApi, imagesApi } from '@/src/app/api/api';
import { DialActivity, ListApi, ResolverHandlers, RevisionApi } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { FilterDto, SortDto } from '@/src/models/request';
import { errorObjLog } from '@/src/server/logger';
import {
  ActivityAuditEntity,
  isContainerDeploymentResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

const SORT_BY_TIME_DESC: SortDto[] = [{ column: 'epochTimestampMs', direction: SortDirectionDto.DESC }];

const resolvedRoute = (activity: DialActivity) =>
  getRevisionRouteForEntityType(activity.resourceType, decodeURIComponent(activity.resourceId ?? ''));

const makeRouteSnapshotFetcher =
  (api: RevisionApi): ResolverHandlers['fetchSnapshot'] =>
  (activity, revision, token) => {
    if (revision < 0) return Promise.resolve(null);
    const route = resolvedRoute(activity);
    return route ? api.getRevisionDetails(`${route}${revision}`, token) : Promise.resolve(null);
  };

const makeListActivities =
  (api: ListApi): ResolverHandlers['listActivities'] =>
  (filters, token) =>
    api.getActivitiesList(1, 0, token, SORT_BY_TIME_DESC, filters);

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

const adminListActivities = makeListActivities(activityAuditApi);
const deploymentListActivities = makeListActivities(deploymentAuditApi);

const adminHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: makeRouteSnapshotFetcher(activityAuditApi),
  listActivities: adminListActivities,
};

const imageHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: makeRouteSnapshotFetcher(imagesApi),
  listActivities: deploymentListActivities,
};

const firewallHandlers: ResolverHandlers = {
  filter: filterByResourceType,
  fetchSnapshot: fetchFirewallSnapshot,
  listActivities: deploymentListActivities,
};

const containerHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: makeRouteSnapshotFetcher(containersApi),
  listActivities: deploymentListActivities,
};

const pickActivityHandlers = (activity: DialActivity, isDeploymentActivity: boolean): ResolverHandlers | null => {
  if (!isDeploymentActivity) return adminHandlers;
  if (isGlobalFirewallResource(activity.resourceType)) return firewallHandlers;
  if (isImageDefinitionResource(activity.resourceType)) return imageHandlers;
  if (isContainerDeploymentResource(activity.resourceType)) return containerHandlers;
  return null;
};

export interface ActivityAuditDetailData {
  activity: DialActivity | null;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  entity: BaseEntity | undefined;
  currentResourceStatus?: string;
}

const fetchCurrentResourceStatus = async (activity: DialActivity, token: Token): Promise<string | undefined> => {
  try {
    if (isContainerDeploymentResource(activity.resourceType)) {
      const res = await containersApi.getContainer(decodeURIComponent(activity.resourceId ?? ''), token);
      return (res?.response as Container | undefined)?.status;
    }
    if (isImageDefinitionResource(activity.resourceType)) {
      const res = await imagesApi.getImage(decodeURIComponent(activity.resourceId ?? ''), token);
      return (res?.response as Image | undefined)?.buildStatus;
    }
  } catch (e) {
    errorObjLog(e, `Failed to fetch live status for ${activity.resourceType}`);
  }
  return undefined;
};

export const getActivityAuditDetailData = async (
  activityId: string,
  token: Token,
): Promise<ActivityAuditDetailData> => {
  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;
  let entity: BaseEntity | undefined = void 0;
  let currentResourceStatus: string | undefined = void 0;

  try {
    const adminResponse = await activityAuditApi.getActivityById(activityId, token);
    activity = (adminResponse?.response as DialActivity | null) ?? null;
    let isDeploymentActivity = false;

    if (!activity) {
      const deploymentResponse = await deploymentAuditApi.getActivityById(activityId, token);
      activity = (deploymentResponse?.response as DialActivity | null) ?? null;
      isDeploymentActivity = activity != null;
    }

    const handlers = activity ? pickActivityHandlers(activity, isDeploymentActivity) : null;
    if (activity && handlers) {
      const [activities, fetchedActivityRevision, fetchedPreviousRevision, status] = await Promise.all([
        handlers.listActivities(handlers.filter(activity), token),
        handlers.fetchSnapshot(activity, activity.revision, token),
        handlers.fetchSnapshot(activity, activity.revision - 1, token),
        fetchCurrentResourceStatus(activity, token),
      ]);
      activityRevision = fetchedActivityRevision;
      previousRevision = fetchedPreviousRevision;
      currentResourceStatus = status;
      const latestRevision = activities?.data?.[0]?.revision;
      if (latestRevision != null) {
        entity = (await handlers.fetchSnapshot(activity, latestRevision, token)) as BaseEntity | undefined;
      }
    } else {
      activity = null;
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch activity view data');
  }

  return { activity, activityRevision, previousRevision, entity, currentResourceStatus };
};
