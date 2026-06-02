import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import {
  getActivityAuditColumns,
  getAuditActivityHref,
  getDeploymentActivityAuditColumns,
  getEndOfDay,
  getGridFilters,
  getStartOfDay,
  groupByDay,
  processActivitiesData,
} from '@/src/components/ActivityAudit/List/utils';
import { GridFilterType } from '@/src/types/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { describe, expect, test, vi } from 'vitest';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import type { FilterDto } from '@/src/models/request';
import { DialActivity } from '@/src/models/activity-audit';

vi.mock('@/src/constants/ag-grid', () => ({
  ACTION_COLUMN: vi.fn((actions) => ({ colId: 'actions', actions })),
}));

vi.mock('@/src/constants/grid-columns/actions', () => ({
  getOpenInNewTabOperation: vi.fn((cb) => ({ type: 'open', cb })),
  getResourceRollbackOperation: vi.fn((cb) => ({ type: 'rollback', cb })),
  getViewDetailsOperation: vi.fn((cb) => ({ type: 'viewDetails', cb })),
}));

vi.mock('@/src/constants/grid-columns/grid-columns', async () => {
  const actual = (await vi.importActual('@/src/types/activity-audit')) as { ActivityAuditView: Record<string, string> };
  return {
    ACTIVITY_AUDIT_COLUMNS: vi.fn((_t: unknown, view: string) =>
      view === actual.ActivityAuditView.Deployments
        ? [{ colId: 'd1' }, { colId: 'd2' }]
        : [{ colId: 'a' }, { colId: 'b' }],
    ),
    RESOURCE_TYPE_COLUMN: 'resourceType',
  };
});

describe('Activity Audit List utils :: getActivityAuditColumns', () => {
  test('returns columns with action column at the end', () => {
    const openMock = vi.fn();
    const rollbackMock = vi.fn();
    const viewDetails = vi.fn();
    const t = (s: string) => s;

    const cols = getActivityAuditColumns(t, openMock, rollbackMock, viewDetails);

    expect(cols).toHaveLength(3);
    expect(cols[0]).toEqual({ colId: 'a' });
    expect(cols[1]).toEqual({ colId: 'b' });
    expect(cols[2].colId).toBe('actions');
    expect((cols[2] as { actions: { type: string }[] }).actions).toHaveLength(3);
    expect((cols[2] as { actions: { type: string }[] }).actions[0].type).toBe('open');
    expect((cols[2] as { actions: { type: string }[] }).actions[1].type).toBe('viewDetails');
    expect((cols[2] as { actions: { type: string }[] }).actions[2].type).toBe('rollback');
  });
});

describe('Activity Audit List utils :: getDeploymentActivityAuditColumns', () => {
  test('returns deployment columns with only Open in new tab action', () => {
    const openMock = vi.fn();
    const t = (s: string) => s;

    const cols = getDeploymentActivityAuditColumns(t, openMock);

    expect(cols).toHaveLength(3);
    expect(cols[0]).toEqual({ colId: 'd1' });
    expect(cols[1]).toEqual({ colId: 'd2' });
    expect(cols[2].colId).toBe('actions');
    const actions = (cols[2] as { actions: { type: string }[] }).actions;
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('open');
  });

  test('returns deployment columns with an empty action list when no open handler', () => {
    const t = (s: string) => s;

    const cols = getDeploymentActivityAuditColumns(t);

    expect(cols).toHaveLength(3);
    const actions = (cols[2] as { actions: { type: string }[] }).actions;
    expect(actions).toHaveLength(0);
  });
});

describe('Activity Audit List utils :: getGridFilters', () => {
  const mockStartDate = new Date('2024-01-01T00:00:00.000Z');
  const mockEndDate = new Date('2024-01-02T00:00:00.000Z');

  const timeRange = {
    startDate: mockStartDate,
    endDate: mockEndDate,
  };

  test('returns combined filters from gridFilter and timeRange', () => {
    const gridFilter = {
      name: { filter: 'Alice', type: GridFilterType.EQUALS, filterType: 'text' },
      age: { filter: '30', type: GridFilterType.EQUALS, filterType: 'text' },
    };

    const result = getGridFilters(gridFilter, timeRange);

    expect(result).toEqual([
      { column: 'name', value: 'Alice', operator: FilterOperatorDto.EQUALS },
      { column: 'age', value: '30', operator: FilterOperatorDto.EQUALS },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.GREATER_THAN_OR_EQUAL,
        value: mockStartDate.getTime().toString(),
      },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.LESS_THAN_OR_EQUAL,
        value: mockEndDate.getTime().toString(),
      },
    ]);
  });

  test('ignores filters with unknown types', () => {
    const result = getGridFilters({}, timeRange);

    expect(result).toEqual([
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.GREATER_THAN_OR_EQUAL,
        value: mockStartDate.getTime().toString(),
      },
      {
        column: 'epochTimestampMs',
        operator: FilterOperatorDto.LESS_THAN_OR_EQUAL,
        value: mockEndDate.getTime().toString(),
      },
    ]);
  });

  describe('resourceType label-aware filter transform', () => {
    const labelMap = {
      'global firewall': [ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST],
      'adapter container': [ActivityAuditResourceType.ADAPTER_DEPLOYMENT],
      'application container': [ActivityAuditResourceType.APPLICATION_DEPLOYMENT],
      'interceptor container': [ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT],
      'mcp container': [ActivityAuditResourceType.MCP_DEPLOYMENT],
      'model serving': [ActivityAuditResourceType.NIM_DEPLOYMENT, ActivityAuditResourceType.INFERENCE_DEPLOYMENT],
    };

    test('single-match contains substring expands to eq with the matching enum', () => {
      const gridFilter = {
        resourceType: { filter: 'GLO', type: GridFilterType.CONTAINS, filterType: 'text' },
      };

      const result = getGridFilters(gridFilter, timeRange, labelMap);

      expect(result[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.EQUALS,
        value: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      });
    });

    test('case-insensitive matching produces the same single-match expansion', () => {
      const lower = getGridFilters(
        { resourceType: { filter: 'global', type: GridFilterType.CONTAINS, filterType: 'text' } },
        timeRange,
        labelMap,
      );
      const upper = getGridFilters(
        { resourceType: { filter: 'GLOBAL', type: GridFilterType.CONTAINS, filterType: 'text' } },
        timeRange,
        labelMap,
      );

      expect(lower[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.EQUALS,
        value: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      });
      expect(lower[0]).toEqual(upper[0]);
    });

    // Known limitation: multi-match inputs fall through to the original `co` payload,
    // which the backend runs as LIKE '%value%' against the raw enum string. Since the
    // raw enums (e.g. AdapterDeployment) share no substring with localized labels
    // (e.g. "container"), the user sees zero rows. Documented in design.md; a BE-side
    // `in` operator is required to fix multi-match generally.
    test('multi-match input passes through original co payload — known limitation, returns 0 rows on BE', () => {
      const gridFilter = {
        resourceType: { filter: 'container', type: GridFilterType.CONTAINS, filterType: 'text' },
      };

      const result = getGridFilters(gridFilter, timeRange, labelMap);

      expect(result[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.CONTAINS,
        value: 'container',
      });
    });

    test('no-match input passes through original co payload', () => {
      const gridFilter = {
        resourceType: { filter: 'zzz-no-match', type: GridFilterType.CONTAINS, filterType: 'text' },
      };

      const result = getGridFilters(gridFilter, timeRange, labelMap);

      expect(result[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.CONTAINS,
        value: 'zzz-no-match',
      });
    });

    test('equals operator on resourceType passes through unchanged', () => {
      const gridFilter = {
        resourceType: {
          filter: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
          type: GridFilterType.EQUALS,
          filterType: 'text',
        },
      };

      const result = getGridFilters(gridFilter, timeRange, labelMap);

      expect(result[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.EQUALS,
        value: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      });
    });

    test('non-resourceType filters are not affected by the transform', () => {
      const gridFilter = {
        resourceId: { filter: 'my-id', type: GridFilterType.CONTAINS, filterType: 'text' },
        activityType: { filter: 'GLO', type: GridFilterType.CONTAINS, filterType: 'text' },
      };

      const result = getGridFilters(gridFilter, timeRange, labelMap);

      const cols = result.map((f) => f.column);
      expect(cols).toContain('resourceId');
      expect(cols).toContain('activityType');
      const activityType = result.find((f) => f.column === 'activityType');
      expect(activityType?.operator).toBe(FilterOperatorDto.CONTAINS);
      expect(activityType?.value).toBe('GLO');
    });

    test('omitting the labelMap leaves resourceType filters untouched', () => {
      const gridFilter = {
        resourceType: { filter: 'GLO', type: GridFilterType.CONTAINS, filterType: 'text' },
      };

      const result = getGridFilters(gridFilter, timeRange);

      expect(result[0]).toEqual({
        column: 'resourceType',
        operator: FilterOperatorDto.CONTAINS,
        value: 'GLO',
      });
    });
  });
});

describe('Activity Audit List utils :: groupByDay', () => {
  test('groups revisions correctly and uses "Today" for current date', () => {
    const mockToday = new Date('2024-06-25T12:00:00');
    const clonedDate = new Date(mockToday.getTime());
    clonedDate.setDate(mockToday.getDate() - 1); // Set to yesterday for testing
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);

    const revisions: ActivityAuditRevision[] = [
      { id: 1, author: 'author', timestamp: new Date('2024-06-25T09:00:00').getTime() },
      { id: 2, author: 'author', timestamp: new Date('2024-06-24T18:30:00').getTime() },
      { id: 3, author: 'author', timestamp: new Date('2024-06-25T15:45:00').getTime() },
    ];

    const grouped = groupByDay(revisions);

    expect(Object.keys(grouped)).toContain('Today');
    expect(Object.keys(grouped)).toContain(clonedDate.toLocaleDateString());
    expect(grouped['Today']).toHaveLength(2);
    expect(grouped[clonedDate.toLocaleDateString()]).toHaveLength(1);

    vi.useRealTimers();
  });
});

describe('getAuditActivityHref', () => {
  test('returns correct href for entity type', () => {
    const mockEntity = { name: 'entity', $id: 'entity' };

    let href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.MODEL, '1');
    expect(href).toBe('/models/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.APPLICATION, '1');
    expect(href).toBe('/applications/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.TOOLSET, '1');
    expect(href).toBe('/toolsets/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.INTERCEPTOR, '1');
    expect(href).toBe('/interceptors/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.ROUTE, '1');
    expect(href).toBe('/routes/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, '1');
    expect(href).toBe('/application-runners/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, '1');
    expect(href).toBe('/interceptor-templates/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.ADAPTER, '1');
    expect(href).toBe('/adapters/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.ROLE, '1');
    expect(href).toBe('/roles/entity/1');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.KEY, '1');
    expect(href).toBe('/keys/entity/1');
  });

  test('returns entity-namespaced href for container deployment types', () => {
    const mockEntity = { name: 'gpt-4-turbo' };

    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.NIM_DEPLOYMENT, 'abc-123')).toBe(
      '/model-servings/gpt-4-turbo/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.INFERENCE_DEPLOYMENT, 'abc-123')).toBe(
      '/model-servings/gpt-4-turbo/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.MCP_DEPLOYMENT, 'abc-123')).toBe(
      '/mcp-containers/gpt-4-turbo/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.ADAPTER_DEPLOYMENT, 'abc-123')).toBe(
      '/adapter-containers/gpt-4-turbo/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.APPLICATION_DEPLOYMENT, 'abc-123')).toBe(
      '/application-containers/gpt-4-turbo/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT, 'abc-123')).toBe(
      '/interceptor-containers/gpt-4-turbo/abc-123',
    );
  });

  test('returns entity-namespaced href for image-definition types (Image route uses entity.id)', () => {
    const mockEntity = { id: 'my-image-id', name: 'my-image' };

    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, 'abc-123')).toBe(
      '/deployment-images/my-image-id/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION, 'abc-123')).toBe(
      '/deployment-images/my-image-id/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION, 'abc-123')).toBe(
      '/deployment-images/my-image-id/abc-123',
    );
    expect(getAuditActivityHref(mockEntity, ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION, 'abc-123')).toBe(
      '/deployment-images/my-image-id/abc-123',
    );
  });

  test('returns empty href for unknown entity type', () => {
    const mockEntity = { name: 'entity' };
    const href = getAuditActivityHref(mockEntity, undefined, '1');
    expect(href).toBe('');
  });

  test('returns empty href for empty resourceId or empty activityId', () => {
    const mockEntity = { name: 'entity' };
    let href = getAuditActivityHref(undefined, ActivityAuditResourceType.MODEL, '1');
    expect(href).toBe('');

    href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.MODEL, '');
    expect(href).toBe('');
  });

  test('returns empty href for a resource type not registered in auditResourceRoute', () => {
    const mockEntity = { name: 'entity' };
    const href = getAuditActivityHref(mockEntity, ActivityAuditResourceType.ADMIN_PROPERTIES, '1');
    expect(href).toBe('');
  });
});

describe('getStartOfDay and getEndOfDay', () => {
  test('getStartOfDay returns date with time set to 00:00:00', () => {
    const date = new Date('2024-06-25T15:45:30');
    const startOfDay = getStartOfDay(date);
    expect(startOfDay.getHours()).toBe(0);
    expect(startOfDay.getMinutes()).toBe(0);
    expect(startOfDay.getSeconds()).toBe(0);
    expect(startOfDay.getMilliseconds()).toBe(0);
  });

  test('getEndOfDay returns date with time set to 23:59:59.999', () => {
    const date = new Date('2024-06-25T15:45:30');
    const endOfDay = getEndOfDay(date);
    expect(endOfDay.getHours()).toBe(23);
    expect(endOfDay.getMinutes()).toBe(59);
    expect(endOfDay.getSeconds()).toBe(59);
    expect(endOfDay.getMilliseconds()).toBe(999);
  });
});

const makeActivity = (overrides: Partial<DialActivity>): DialActivity => ({
  activityType: ActivityAuditType.Create,
  resourceType: ActivityAuditResourceType.MODEL,
  resourceId: '',
  epochTimestampMs: 0,
  initiatedAuthor: 'author',
  initiatedEmail: 'author@example.com',
  activityId: '',
  revision: 1,
  ...overrides,
});

describe('ActivityAudit/List/utils :: processActivitiesData', () => {
  test('returns parent rows with children expanded and children rows appended', () => {
    const data: DialActivity[] = [
      makeActivity({
        activityId: 'p1',
        resourceType: ActivityAuditResourceType.APPLICATION,
        parentActivityId: undefined,
        resourceId: 'r1',
      }),
      makeActivity({
        activityId: 'c1',
        resourceType: ActivityAuditResourceType.APPLICATION,
        parentActivityId: 'p1',
        resourceId: 'r2',
      }),
      makeActivity({
        activityId: 'p2',
        resourceType: ActivityAuditResourceType.APPLICATION,
        parentActivityId: undefined,
        resourceId: 'r3',
      }),
    ];
    const childrenMap: Record<string, DialActivity[]> = {
      p1: [
        makeActivity({
          activityId: 'c1',
          resourceType: ActivityAuditResourceType.APPLICATION,
          parentActivityId: 'p1',
          resourceId: 'r2',
        }),
      ],
    };

    const result: (DialActivity & { children?: DialActivity[] })[] = processActivitiesData(data, childrenMap);

    expect(result).toHaveLength(3);
    expect(result[0].activityId).toBe('p1');
    expect(result[0].children).toEqual(childrenMap.p1);
    expect(result[1].activityId).toBe('c1');
    expect(result[2].activityId).toBe('p2');
    expect(result[2].children).toEqual([]);
  });

  test('preserves children order from childrenActivityMap and appends children for parent rows only', () => {
    const data: DialActivity[] = [
      makeActivity({
        activityId: 'p1',
        resourceType: ActivityAuditResourceType.APPLICATION,
        parentActivityId: undefined,
        resourceId: 'r1',
      }),
      makeActivity({
        activityId: 'c1',
        resourceType: ActivityAuditResourceType.APPLICATION,
        parentActivityId: 'p1',
        resourceId: 'r2',
      }),
    ];
    const childrenMap: Record<string, DialActivity[]> = {
      p1: [
        makeActivity({
          activityId: 'c1',
          resourceType: ActivityAuditResourceType.APPLICATION,
          parentActivityId: 'p1',
          resourceId: 'r2',
        }),
      ],
    };

    const result: (DialActivity & { children?: DialActivity[] })[] = processActivitiesData(data, childrenMap);

    expect(result[0].activityId).toBe('p1');
    expect(result[1].activityId).toBe('c1');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].activityId).toBe('c1');
  });
});
