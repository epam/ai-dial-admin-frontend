import { auditResourceRoute } from '@/src/constants/activity-audit';
import {
  ActivityAuditResourceType,
  ActivityAuditType,
  ActivityAuditView,
  isDeploymentManagerResource,
} from '@/src/types/activity-audit';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getRollbackRedirectHref } from './get-rollback-redirect-href';

export enum RollbackRedirectTarget {
  AuditList = 'audit-list',
  EntityList = 'entity-list',
  EntityDetail = 'entity-detail',
  Refresh = 'refresh',
}

export interface RollbackNavigation {
  target: RollbackRedirectTarget;
  entityListHref?: string;
  entityDetailHref?: string;
  auditView: ActivityAuditView;
}

/**
 * Decide where to navigate after a successful rollback, based on the scenario
 * (activity type) and where it was triggered from (standalone audit vs. an
 * entity audit tab):
 *
 * - Create → entity no longer exists, so never its detail page:
 *     audit → audit list; entity → entity list
 * - Delete → entity recreated → its detail page
 * - Update → audit → audit list; entity → refresh in place
 *
 * Targets requiring an entity route fall back to the audit list / refresh when
 * the resource type has no route or the id is missing.
 *
 * The `recreatedEntity` (the create response on a `Delete` rollback) is used to
 * build the detail href, because a recreated entity may receive a NEW id from
 * the backend (e.g. image definitions); navigating with the old `resourceId`
 * would 404. Name-keyed entities (containers, model-servings) resolve the same
 * either way.
 *
 * @param {ActivityAuditType} [activityType] - the rolled-back activity's type
 * @param {ActivityAuditResourceType} [resourceType] - the activity's resource type
 * @param {string} [resourceId] - the entity identifier
 * @param {boolean} [isEntityContext] - true when triggered from an entity audit tab/detail
 * @param {object} [recreatedEntity] - the entity returned by a recreate (Delete) rollback
 * @returns {RollbackNavigation} the resolved navigation descriptor
 */
export const getRollbackNavigation = (
  activityType?: ActivityAuditType,
  resourceType?: ActivityAuditResourceType,
  resourceId?: string,
  isEntityContext = false,
  recreatedEntity?: object,
): RollbackNavigation => {
  const entityListHref = resourceType ? auditResourceRoute[resourceType] : undefined;
  const resolveEntityDetailHref = (): string | undefined => {
    if (!entityListHref) return undefined;
    // A recreated entity may carry a NEW backend-assigned id, so prefer it.
    if (recreatedEntity) return getUrnForEntity(entityListHref, recreatedEntity);
    if (resourceId) return getRollbackRedirectHref(resourceType, resourceId);
    return undefined;
  };
  const entityDetailHref = resolveEntityDetailHref();
  const auditView = isDeploymentManagerResource(resourceType)
    ? ActivityAuditView.Deployments
    : ActivityAuditView.Config;

  let target: RollbackRedirectTarget;
  if (activityType === ActivityAuditType.Create) {
    target = isEntityContext ? RollbackRedirectTarget.EntityList : RollbackRedirectTarget.AuditList;
  } else if (activityType === ActivityAuditType.Delete) {
    target = RollbackRedirectTarget.EntityDetail;
  } else {
    target = isEntityContext ? RollbackRedirectTarget.Refresh : RollbackRedirectTarget.AuditList;
  }

  if (target === RollbackRedirectTarget.EntityDetail && !entityDetailHref) {
    target = isEntityContext ? RollbackRedirectTarget.Refresh : RollbackRedirectTarget.AuditList;
  }
  if (target === RollbackRedirectTarget.EntityList && !entityListHref) {
    target = RollbackRedirectTarget.AuditList;
  }

  return { target, entityListHref, entityDetailHref, auditView };
};
