import { auditResourceRoute } from '@/src/constants/activity-audit';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * Resolve the entity detail page for a rolled-back resource. Covers every
 * resource type via `auditResourceRoute` (admin + deployment-manager). Falls
 * back to the activity-audit list when the type has no entity route or the id
 * is missing.
 *
 * @param {ActivityAuditResourceType} [entityType] - the activity's resource type
 * @param {string} [resourceId] - the entity identifier (name or id, per type)
 * @returns {string} the entity detail href, or the activity-audit list route
 */
export const getRollbackRedirectHref = (entityType?: ActivityAuditResourceType, resourceId?: string): string => {
  const route = entityType ? auditResourceRoute[entityType] : undefined;
  if (!route || !resourceId) {
    return ApplicationRoute.ActivityAudit;
  }
  return `${route}/${encodeURIComponent(resourceId)}`;
};
