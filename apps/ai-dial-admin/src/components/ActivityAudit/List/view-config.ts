import {
  getActivities,
  getAnalyticsActivities,
  getDeploymentActivities,
} from '@/src/app/[lang]/activity-audit/actions';
import { ActivityAuditHrefParams, ActivityAuditViewConfig } from '@/src/components/ActivityAudit/List/models';
import {
  getActivityAuditColumns,
  getAnalyticsActivityAuditColumns,
  getAuditActivityHref,
  getDeploymentActivityAuditColumns,
} from '@/src/components/ActivityAudit/List/utils';
import { ActivityAuditView, isDeploymentManagerResource } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

const isAnyRowNavigable = (): boolean => true;

const getNamespacedEntityActivityHref = ({ entity, entityType, activityId }: ActivityAuditHrefParams): string =>
  getAuditActivityHref(entity, entityType, activityId);

// Analytics rows resolve to the global detail page, not to an entity-namespaced audit route:
// `/tables/{name}/{activityId}` and its siblings do not exist, so `auditResourceRoute` has no
// analytics entry and this view does not read it.
const getGlobalActivityHref = ({ activityId }: ActivityAuditHrefParams): string =>
  activityId ? `${ApplicationRoute.ActivityAudit}/${encodeURIComponent(activityId)}` : '';

/**
 * Everything `ActivityAuditList` needs to know about the active view, declared per view.
 *
 * Typed as a full `Record` rather than a `Partial<Record>` on purpose: a fifth
 * `ActivityAuditView` member then fails to compile here instead of resolving to `undefined`
 * at runtime.
 */
export const ACTIVITY_AUDIT_VIEW_CONFIG: Record<ActivityAuditView, ActivityAuditViewConfig> = {
  [ActivityAuditView.Config]: {
    fetchActivities: getActivities,
    getColumns: ({ t, open, onRollback, isSingleEntity }) =>
      getActivityAuditColumns(t, open, onRollback, void 0, isSingleEntity),
    hasParentChildAggregation: true,
    hasDeletedParentSuppression: false,
    hasRollback: true,
    isRowNavigable: isAnyRowNavigable,
    getEntityActivityHref: getNamespacedEntityActivityHref,
  },
  [ActivityAuditView.Deployments]: {
    fetchActivities: getDeploymentActivities,
    // Entity mode has always rendered the shared single-entity column set — with its row
    // Rollback action — whatever the view; the deployment column set belongs to the global page.
    getColumns: ({ t, open, onRollback, isSingleEntity }) =>
      isSingleEntity
        ? getActivityAuditColumns(t, open, onRollback, void 0, true)
        : getDeploymentActivityAuditColumns(t, open, onRollback),
    hasParentChildAggregation: false,
    hasDeletedParentSuppression: false,
    hasRollback: true,
    isRowNavigable: isDeploymentManagerResource,
    getEntityActivityHref: getNamespacedEntityActivityHref,
  },
  [ActivityAuditView.Analytics]: {
    fetchActivities: getAnalyticsActivities,
    // No `onRollback` and no `isSingleEntity`: the analytics view offers no row rollback, and it
    // keeps `Resource type` / `Resource identifier` visible in an entity tab too, because the
    // feed carries both `Table` and `TableColumn` rows.
    getColumns: ({ t, open }) => getAnalyticsActivityAuditColumns(t, open),
    hasParentChildAggregation: false,
    // Deleting a table records a `Delete` per column, each naming the table activity as its
    // parent; the parent's own detail view already renders every one of those columns as
    // removed, so the children are noise. Only this feed produces them.
    hasDeletedParentSuppression: true,
    hasRollback: false,
    isRowNavigable: isAnyRowNavigable,
    getEntityActivityHref: getGlobalActivityHref,
  },
};
