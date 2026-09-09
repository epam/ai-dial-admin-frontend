import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { getTableNameFromAnalyticsResourceId } from '@/src/utils/audit/analytics-resource-id';

/**
 * Resolve the snapshot route for one resource at one revision. The route is relative
 * to the backend that owns the resource, and this table spans two of them: the four
 * analytics types (`isAnalyticsResource`) resolve against the analytics backend, every
 * other type against the admin backend. A route must therefore be issued through the
 * client for its own resource type — the caller picks the client, this only names the path.
 *
 * @param {string} [type] - the activity's resource type
 * @param {string} [id] - the resource identifier, `<table>:<column>` for a table column
 * @returns {string | null} the route with a trailing separator for the revision, or null when the type has no snapshot route
 */
export const getRevisionRouteForEntityType = (type?: string, id?: string): string | null => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return `/models/${id}/revision/`;
    case ActivityAuditResourceType.APPLICATION:
      return `/applications/${id}/revision/`;
    case ActivityAuditResourceType.ADAPTER:
      return `/adapters/${id}/revision/`;
    case ActivityAuditResourceType.INTERCEPTOR:
      return `/interceptors/${id}/revision/`;
    case ActivityAuditResourceType.KEY:
      return `/keys/${id}/revision/`;
    case ActivityAuditResourceType.ROLE:
      return `/roles/${id}/revision/`;
    case ActivityAuditResourceType.ROUTE:
      return `/routes/${id}/revision/`;
    case ActivityAuditResourceType.TOOLSET:
      return `/toolSets/${id}/revision/`;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return `/applicationTypeSchemas/snapshot?id=${id}&revision=`;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return `/interceptor-runners/${id}/revision/`;
    case ActivityAuditResourceType.SYSTEM_PROPERTIES:
      return `/global-settings/revision/`;
    case ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION:
    case ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION:
    case ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION:
    case ActivityAuditResourceType.MCP_IMAGE_DEFINITION:
      return `/images/definitions/${id}/revision/`;
    case ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST:
      return `/global-whitelist/image-build/revision/`;
    case ActivityAuditResourceType.ADAPTER_DEPLOYMENT:
    case ActivityAuditResourceType.APPLICATION_DEPLOYMENT:
    case ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT:
    case ActivityAuditResourceType.MCP_DEPLOYMENT:
    case ActivityAuditResourceType.NIM_DEPLOYMENT:
    case ActivityAuditResourceType.INFERENCE_DEPLOYMENT:
      return `/deployments/${id}/revision/`;
    case ActivityAuditResourceType.ADMIN_PROPERTIES:
      return `/admin-settings/revision/`;
    case ActivityAuditResourceType.TABLE:
      return `/tables/${id}/revision/`;
    // A column has no snapshot endpoint of its own: it resolves to the owning
    // table's snapshot at the same revision, which does contain the change.
    case ActivityAuditResourceType.TABLE_COLUMN:
      return `/tables/${getTableNameFromAnalyticsResourceId(id)}/revision/`;
    case ActivityAuditResourceType.PIPELINE:
      return `/pipelines/${id}/revision/`;
    case ActivityAuditResourceType.SAVED_QUERY:
      return `/saved-queries/${id}/revision/`;
    default:
      return null;
  }
};

export const getRevisionRouteForAllEntities = (type?: string): string | null => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return `/models/revision/`;
    case ActivityAuditResourceType.APPLICATION:
      return `/applications/revision/`;
    case ActivityAuditResourceType.ADAPTER:
      return `/adapters/revision/`;
    case ActivityAuditResourceType.INTERCEPTOR:
      return `/interceptors/revision/`;
    case ActivityAuditResourceType.KEY:
      return `/keys/revision/`;
    case ActivityAuditResourceType.ROLE:
      return `/roles/revision/`;
    case ActivityAuditResourceType.ROUTE:
      return `/routes/revision/`;
    case ActivityAuditResourceType.TOOLSET:
      return `/toolSets/revision/`;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return `/applicationTypeSchemas/revision/`;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return `/interceptor-runners/revision/`;
    case ActivityAuditResourceType.SYSTEM_PROPERTIES:
      return `/global-settings/revision/`;
    default:
      return null;
  }
};
