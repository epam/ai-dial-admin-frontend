import { describe, expect, test } from 'vitest';

import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';
import { FilterOperatorDto } from '@/src/types/request';
import { getEntityAuditFilters } from '@/src/utils/audit/entity-audit-filters';

describe('getEntityAuditFilters', () => {
  test('returns no filters when there is no entity', () => {
    expect(getEntityAuditFilters(void 0, ActivityAuditResourceType.MODEL, ActivityAuditView.Config)).toEqual([]);
    expect(getEntityAuditFilters(void 0, ActivityAuditResourceType.TABLE, ActivityAuditView.Analytics)).toEqual([]);
  });

  describe('Config and Deployments views', () => {
    test('asks for the exact resource identifier and resource type pair', () => {
      const filters = getEntityAuditFilters(
        { name: 'gpt-4' },
        ActivityAuditResourceType.MODEL,
        ActivityAuditView.Config,
      );

      expect(filters).toEqual([
        { column: 'resourceId', value: 'gpt-4', operator: FilterOperatorDto.EQUALS },
        { column: 'resourceType', value: ActivityAuditResourceType.MODEL, operator: FilterOperatorDto.EQUALS },
      ]);
    });

    test('builds the same pair for the Deployments view', () => {
      const filters = getEntityAuditFilters(
        { name: 'my-container' },
        ActivityAuditResourceType.MCP_DEPLOYMENT,
        ActivityAuditView.Deployments,
      );

      expect(filters).toEqual([
        { column: 'resourceId', value: 'my-container', operator: FilterOperatorDto.EQUALS },
        {
          column: 'resourceType',
          value: ActivityAuditResourceType.MCP_DEPLOYMENT,
          operator: FilterOperatorDto.EQUALS,
        },
      ]);
    });

    test('builds the same pair when no view is given', () => {
      const filters = getEntityAuditFilters({ name: 'gpt-4' }, ActivityAuditResourceType.MODEL);

      expect(filters).toEqual([
        { column: 'resourceId', value: 'gpt-4', operator: FilterOperatorDto.EQUALS },
        { column: 'resourceType', value: ActivityAuditResourceType.MODEL, operator: FilterOperatorDto.EQUALS },
      ]);
    });

    test('prefers the application scheme identifier over the name', () => {
      const filters = getEntityAuditFilters(
        { $id: 'scheme-id', name: 'scheme-name' },
        ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA,
        ActivityAuditView.Config,
      );

      expect(filters[0]).toEqual({ column: 'resourceId', value: 'scheme-id', operator: FilterOperatorDto.EQUALS });
    });

    test('leaves the identifier undefined when the entity carries none, as it does today', () => {
      const filters = getEntityAuditFilters({}, ActivityAuditResourceType.MODEL, ActivityAuditView.Config);

      expect(filters[0]).toEqual({ column: 'resourceId', value: void 0, operator: FilterOperatorDto.EQUALS });
    });
  });

  describe('Analytics view', () => {
    test('asks for both table resource types and a substring match on the table name', () => {
      const filters = getEntityAuditFilters(
        { name: 'conversations' },
        ActivityAuditResourceType.TABLE,
        ActivityAuditView.Analytics,
      );

      expect(filters).toEqual([
        { column: 'resourceType', value: 'Table,TableColumn', operator: FilterOperatorDto.INCLUDES },
        { column: 'resourceId', value: 'conversations', operator: FilterOperatorDto.CONTAINS },
      ]);
    });

    test('names the resource types from the resource-type enum', () => {
      const filters = getEntityAuditFilters(
        { name: 'orders' },
        ActivityAuditResourceType.TABLE,
        ActivityAuditView.Analytics,
      );

      expect(filters[0].value).toBe(`${ActivityAuditResourceType.TABLE},${ActivityAuditResourceType.TABLE_COLUMN}`);
    });

    test('ignores the entity type it is given, because the request carries two resource types', () => {
      const filters = getEntityAuditFilters({ name: 'orders' }, void 0, ActivityAuditView.Analytics);

      expect(filters).toEqual([
        { column: 'resourceType', value: 'Table,TableColumn', operator: FilterOperatorDto.INCLUDES },
        { column: 'resourceId', value: 'orders', operator: FilterOperatorDto.CONTAINS },
      ]);
    });
  });
});
