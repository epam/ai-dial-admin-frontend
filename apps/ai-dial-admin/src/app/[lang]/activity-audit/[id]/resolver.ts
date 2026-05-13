import { activityAuditApi, containersApi, deploymentAuditApi, globalFirewallApi, imagesApi } from '@/src/app/api/api';
import { DialActivity, ListApi, ResolverHandlers, RevisionApi } from '@/src/models/activity-audit';
import { FilterDto, SortDto } from '@/src/models/request';
import {
  isContainerDeploymentResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

export const SORT_BY_TIME_DESC: SortDto[] = [{ column: 'epochTimestampMs', direction: SortDirectionDto.DESC }];

const resolvedRoute = (activity: DialActivity) =>
  getRevisionRouteForEntityType(activity.resourceType, decodeURIComponent(activity.resourceId ?? ''));

// All revisioned APIs (admin, image, container) share the same call shape:
// `${route}${revision}` against the API instance's getRevisionDetails.
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

// The global firewall is a singleton: no route prefix, the API takes the raw
// revision number. Kept standalone — every other branch follows the
// `${route}${revision}` shape.
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

export const pickActivityHandlers = (
  activity: DialActivity,
  isDeploymentActivity: boolean,
): ResolverHandlers | null => {
  if (!isDeploymentActivity) return adminHandlers;
  if (isGlobalFirewallResource(activity.resourceType)) return firewallHandlers;
  if (isImageDefinitionResource(activity.resourceType)) return imageHandlers;
  if (isContainerDeploymentResource(activity.resourceType)) return containerHandlers;
  return null;
};
