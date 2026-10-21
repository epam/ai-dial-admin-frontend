import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import {
  auditResourceRoute,
  CONTAINER_TYPE_TO_AUDIT,
  IMAGE_TYPE_TO_AUDIT,
  routeAuditResource,
} from '@/src/constants/activity-audit';
import { getTableNameFromAnalyticsResourceId } from '@/src/utils/audit/analytics-resource-id';

export const resolveEntityAuditType = (
  entity: BaseEntity | undefined,
  view: ApplicationRoute,
): ActivityAuditResourceType | undefined => {
  const discriminator = (entity as { $type?: string } | undefined)?.$type;
  if (discriminator) {
    if (view === ApplicationRoute.Images && discriminator in IMAGE_TYPE_TO_AUDIT) {
      return IMAGE_TYPE_TO_AUDIT[discriminator as IMAGE_TYPE];
    }
    if (discriminator in CONTAINER_TYPE_TO_AUDIT) {
      return CONTAINER_TYPE_TO_AUDIT[discriminator as CONTAINER_TYPE];
    }
  }
  return routeAuditResource[view];
};

/**
 * Analytics resource types resolve to their own feature routes here rather than through the shared
 * `auditResourceRoute`, which the audit list's entity-namespaced href builder also reads: an entry
 * there would send every analytics row to `/tables/{name}/{activityId}`, a route this change does
 * not create. Kept local so the header link and the row href stay independent.
 */
const ANALYTICS_RESOURCE_ROUTE: Partial<Record<ActivityAuditResourceType, ApplicationRoute>> = {
  [ActivityAuditResourceType.TABLE]: ApplicationRoute.AnalyticsTables,
  [ActivityAuditResourceType.TABLE_COLUMN]: ApplicationRoute.AnalyticsTables,
  [ActivityAuditResourceType.PIPELINE]: ApplicationRoute.AnalyticsPipelines,
  [ActivityAuditResourceType.SAVED_QUERY]: ApplicationRoute.AnalyticsQueries,
};

const isTableScopedResource = (resourceType: ActivityAuditResourceType): boolean =>
  resourceType === ActivityAuditResourceType.TABLE || resourceType === ActivityAuditResourceType.TABLE_COLUMN;

/**
 * Resolve the detail page an audited resource lives on, for the header's external-link control.
 *
 * A `TableColumn` identifier is `<table>:<column>`, so a column links to its table's page.
 *
 * @param {ActivityAuditResourceType} [resourceType] - the audited activity's resource type
 * @param {string} [resourceId] - the audited activity's resource identifier
 * @returns {string | undefined} a locale-less path, or `undefined` when the type has no known route
 */
export const getAuditResourceHref = (
  resourceType?: ActivityAuditResourceType,
  resourceId?: string,
): string | undefined => {
  if (!resourceType || !resourceId) {
    return undefined;
  }

  const analyticsRoute = ANALYTICS_RESOURCE_ROUTE[resourceType];
  if (analyticsRoute) {
    const segment = isTableScopedResource(resourceType) ? getTableNameFromAnalyticsResourceId(resourceId) : resourceId;
    return segment ? `${analyticsRoute}/${encodeURIComponent(segment)}` : undefined;
  }

  const route = auditResourceRoute[resourceType];
  if (!route) {
    return undefined;
  }

  return `${route}/${encodeURIComponent(resourceId)}`;
};
