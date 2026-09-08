import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';
import { FilterOperatorDto } from '@/src/types/request';
import { getEntityAuditFilterId } from '@/src/utils/open-in-new-tab';

const RESOURCE_ID_COLUMN = 'resourceId';
const RESOURCE_TYPE_COLUMN = 'resourceType';

// A table's audit surface shows the table definition and its columns, which the analytics
// backend records as two resource types.
const TABLE_SCOPE_RESOURCE_TYPES = [ActivityAuditResourceType.TABLE, ActivityAuditResourceType.TABLE_COLUMN].join(',');

/**
 * Build the request filters that narrow an entity Audit tab to the entity being viewed.
 *
 * `Config` and `Deployments` ask for one exact `(resourceId, resourceType)` pair. `Analytics`
 * cannot: a column activity's resource identifier is `<table>:<column>`, so an `eq` on the table
 * name would answer with the table definition's history only. It asks for both resource types
 * and a `co` (substring) match on the table name instead — which over-matches a similarly named
 * table, so rows still have to pass `isResourceIdInTableScope` before they are displayed.
 *
 * @param {BaseEntity | DialApplicationScheme} [entity] - the entity whose Audit tab is rendered
 * @param {string} [entityType] - the entity's audit resource type
 * @param {ActivityAuditView} [view] - the active audit view
 * @returns {FilterDto[]} filters for the activity feed request, empty when there is no entity
 */
export const getEntityAuditFilters = (
  entity?: BaseEntity | DialApplicationScheme,
  entityType?: string,
  view?: ActivityAuditView,
): FilterDto[] => {
  if (!entity) {
    return [];
  }

  if (view === ActivityAuditView.Analytics) {
    return [
      {
        column: RESOURCE_TYPE_COLUMN,
        value: TABLE_SCOPE_RESOURCE_TYPES,
        operator: FilterOperatorDto.INCLUDES,
      },
      {
        column: RESOURCE_ID_COLUMN,
        value: getEntityAuditFilterId(entity),
        operator: FilterOperatorDto.CONTAINS,
      } as FilterDto,
    ];
  }

  return [
    {
      column: RESOURCE_ID_COLUMN,
      value: getEntityAuditFilterId(entity),
      operator: FilterOperatorDto.EQUALS,
    } as FilterDto,
    {
      column: RESOURCE_TYPE_COLUMN,
      value: entityType,
      operator: FilterOperatorDto.EQUALS,
    } as FilterDto,
  ];
};
