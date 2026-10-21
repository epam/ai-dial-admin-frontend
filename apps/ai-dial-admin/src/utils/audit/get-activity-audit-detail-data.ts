import {
  activityAuditApi,
  analyticsAuditApi,
  containersApi,
  deploymentAuditApi,
  globalFirewallApi,
  imagesApi,
} from '@/src/app/api/api';
import {
  ActivityLookupSource,
  DialActivity,
  ListApi,
  ResolverHandlers,
  RevisionApi,
} from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { SortDto } from '@/src/models/request';
import { ANALYTICS_ACTIVITIES_URL } from '@/src/server/analytics/audit-api';
import { DEPLOYMENT_ACTIVITIES_URL } from '@/src/server/deployments/audit-api';
import { ACTIVITIES_URL } from '@/src/server/entities/activity-audit-api';
import { errorObjLog } from '@/src/server/logger';
import {
  ActivityAuditEntity,
  isContainerDeploymentResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';
import { isValueTruthy } from '@/src/utils/types';

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
  { column: 'resourceId', value: activity.resourceId ?? '', operator: FilterOperatorDto.EQUALS },
];

const filterByResourceType: ResolverHandlers['filter'] = (activity) => [
  { column: 'resourceType', value: activity.resourceType, operator: FilterOperatorDto.EQUALS },
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

const analyticsHandlers: ResolverHandlers = {
  filter: filterByResourceId,
  fetchSnapshot: makeRouteSnapshotFetcher(analyticsAuditApi),
  listActivities: makeListActivities(analyticsAuditApi),
};

// `isAnalyticsActivity` is the backend the activity came from, not its resource type: only the
// analytics backend owns the snapshots and the activity list for a resource it resolved.
const pickActivityHandlers = (
  activity: DialActivity,
  isDeploymentActivity: boolean,
  isAnalyticsActivity: boolean,
): ResolverHandlers | null => {
  if (isAnalyticsActivity) return analyticsHandlers;
  if (!isDeploymentActivity) return adminHandlers;
  if (isGlobalFirewallResource(activity.resourceType)) return firewallHandlers;
  if (isImageDefinitionResource(activity.resourceType)) return imageHandlers;
  if (isContainerDeploymentResource(activity.resourceType)) return containerHandlers;
  return null;
};

const ADMIN_LOOKUP: ActivityLookupSource = {
  backend: 'admin',
  route: ACTIVITIES_URL,
  getActivityById: (id, token) => activityAuditApi.getActivityById(id, token),
};

const DEPLOYMENT_LOOKUP: ActivityLookupSource = {
  backend: 'deployment manager',
  route: DEPLOYMENT_ACTIVITIES_URL,
  getActivityById: (id, token) => deploymentAuditApi.getActivityById(id, token),
};

const ANALYTICS_LOOKUP: ActivityLookupSource = {
  backend: 'analytics',
  route: ANALYTICS_ACTIVITIES_URL,
  getActivityById: (id, token) => analyticsAuditApi.getActivityById(id, token),
};

/**
 * Probe one backend of the fallback chain for the activity.
 *
 * A backend that is unreachable, or whose host variable is unset, *rejects* rather than answering
 * `404` — and the chain must survive that, because the activity may well live in a backend probed
 * later. Two things follow, and both are the point of this helper:
 *
 * - the rejection is confined to the step that produced it, so a dead deployment manager can no
 *   longer hide every analytics activity behind the page's `notFound()`;
 * - the rejection is logged with the backend and the route it was asked for. The page renders the
 *   same 404 for a failure and for a genuine miss, so the log is the only place the two are
 *   distinguishable: a miss is silent, a failure is not.
 */
const lookupActivity = async (
  source: ActivityLookupSource,
  activityId: string,
  token: Token,
): Promise<DialActivity | null> => {
  try {
    const response = await source.getActivityById(activityId, token);
    return (response?.response as DialActivity | null) ?? null;
  } catch (e) {
    errorObjLog(e, `Activity lookup failed on the ${source.backend} backend: ${source.route}/${activityId}`);
    return null;
  }
};

/**
 * Keeps one failing upstream call from discarding the results of the calls issued beside it — a
 * snapshot the backend cannot serve leaves that one side of the comparison empty, rather than
 * blanking the whole detail view.
 */
const settled = async <T>(request: () => Promise<T>, message: string): Promise<T | null> => {
  try {
    return await request();
  } catch (e) {
    errorObjLog(e, message);
    return null;
  }
};

export interface ActivityAuditDetailData {
  activity: DialActivity | null;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  entity: BaseEntity | undefined;
}

const noActivityFound = (): ActivityAuditDetailData => ({
  activity: null,
  activityRevision: null,
  previousRevision: null,
  entity: void 0,
});

export const getActivityAuditDetailData = async (
  activityId: string,
  token: Token,
): Promise<ActivityAuditDetailData> => {
  let activity = await lookupActivity(ADMIN_LOOKUP, activityId, token);
  let isDeploymentActivity = false;
  let isAnalyticsActivity = false;

  if (!activity) {
    activity = await lookupActivity(DEPLOYMENT_LOOKUP, activityId, token);
    isDeploymentActivity = activity != null;
  }

  // Last step of the chain, and only on an install that has analytics: `isValueTruthy` answers true
  // for the exact string `true` alone, so this agrees with `featureFlags.analyticsEnabled`, which
  // `layout.tsx` reads from the same variable through the same helper.
  if (!activity && isValueTruthy(process.env.ANALYTICS_ENABLED)) {
    activity = await lookupActivity(ANALYTICS_LOOKUP, activityId, token);
    isAnalyticsActivity = activity != null;
  }

  if (!activity) return noActivityFound();

  const handlers = pickActivityHandlers(activity, isDeploymentActivity, isAnalyticsActivity);
  if (!handlers) return noActivityFound();

  // `activity` is a reassigned `let`, so its non-null narrowing does not survive into the closures
  // below — they capture this `const` instead.
  const resolvedActivity = activity;
  const snapshotFailure = `Failed to fetch a revision snapshot for activity ${activityId}`;

  const [activities, activityRevision, previousRevision] = await Promise.all([
    settled(
      () => handlers.listActivities(handlers.filter(resolvedActivity), token),
      `Failed to fetch the activity list for activity ${activityId}`,
    ),
    settled(() => handlers.fetchSnapshot(resolvedActivity, resolvedActivity.revision, token), snapshotFailure),
    settled(() => handlers.fetchSnapshot(resolvedActivity, resolvedActivity.revision - 1, token), snapshotFailure),
  ]);

  const latestRevision = activities?.data?.[0]?.revision;
  let entity: BaseEntity | undefined = void 0;
  if (latestRevision != null) {
    const latestSnapshot = await settled(
      () => handlers.fetchSnapshot(resolvedActivity, latestRevision, token),
      snapshotFailure,
    );
    entity = (latestSnapshot ?? void 0) as BaseEntity | undefined;
  }

  return { activity: resolvedActivity, activityRevision, previousRevision, entity };
};
