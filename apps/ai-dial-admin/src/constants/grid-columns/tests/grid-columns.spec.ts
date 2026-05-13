import {
  ENTITIES_COLUMNS,
  EXPORT_COLUMNS,
  KEYS_COLUMNS,
  MODELS_COLUMNS,
  PROJECT_GRID_COLUMNS,
  ASSETS_COLUMNS,
  DEPLOYMENT_ASSETS_COLUMNS,
  NON_DEPLOYMENT_ASSETS_COLUMNS,
  PUBLICATION_COLUMNS,
  TELEMETRY_GRID_COLUMNS,
  APPLICATIONS_COLUMNS,
  ACTIVITY_AUDIT_COLUMNS,
  IMAGE_DEPENDENCIES_COLUMNS,
  IMAGES_LIST_COLUMNS,
  IMAGES_LIST_FOR_CONTAINER_COLUMNS,
  CONTAINERS_COLUMNS,
  CONTAINER_EVENTS,
  HF_REGISTRY_COLUMNS,
  ADAPTER_COLUMNS,
  USAGE_LOG_TRACES_COLUMNS,
  USAGE_LOG_CONVERSATIONS_COLUMNS,
  USAGE_LOG_MCP_COLUMNS,
  USAGE_LOG_TOOLSET_TRACES_COLUMNS,
} from '../grid-columns';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/constants/ag-grid', () => ({
  ACTION_COLUMN: vi.fn((actions) => ({ colId: 'actions', actions })),
  NO_BORDER_CLASS: 'NO_BORDER_CLASS',
}));

describe('Constants :: grid columns', () => {
  test('MODELS_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols = MODELS_COLUMNS(t);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'source.$type')).toBe(true);
    expect(cols.some((c) => c.field === 'endpoint')).toBe(true);
    expect(cols.some((c) => c.field === 'pricing.prompt')).toBe(true);
  });

  test('ADAPTER_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols = ADAPTER_COLUMNS(t);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'source.$type')).toBe(true);
    expect(cols.some((c) => c.field === 'topics')).toBe(true);
    expect(cols.some((c) => c.field === 'updatedAt')).toBe(true);
  });

  test('APPLICATIONS_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols = APPLICATIONS_COLUMNS(t);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'maxInputAttachments')).toBe(true);
    expect(cols.some((c) => c.field === 'endpoint')).toBe(true);
  });

  test('KEYS_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    expect(Array.isArray(KEYS_COLUMNS(t))).toBe(true);
    expect(KEYS_COLUMNS(t).some((c) => c.field === 'name')).toBe(true);
    expect(KEYS_COLUMNS(t).some((c) => c.field === 'status')).toBe(true);
  });

  test('ASSETS_COLUMNS returns expected columns', () => {
    expect(Array.isArray(ASSETS_COLUMNS)).toBe(true);
    expect(ASSETS_COLUMNS.some((c) => c.field === 'author')).toBe(true);
    expect(ASSETS_COLUMNS.some((c) => c.field === 'version')).toBe(true);
  });

  test('ACTIVITY_AUDIT_COLUMNS returns expected columns for Config view', () => {
    const t = (s: string) => s;
    const cols = ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Config);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'expanderColumn')).toBe(true);
    const activityTypeCol = cols.find((c) => c.field === 'activityType');
    expect(activityTypeCol?.cellRendererParams).toEqual({ showIcon: true });
    expect(cols.some((c) => c.field === 'activityType')).toBe(true);
    expect(cols.some((c) => c.field === 'resourceId')).toBe(true);
    expect(cols.some((c) => c.field === 'parentActivityId')).toBe(true);
    expect(cols.some((c) => c.field === 'version')).toBe(false);
  });

  test('ACTIVITY_AUDIT_COLUMNS returns expected columns for embedded (single-entity) Config view', () => {
    const t = (s: string) => s;
    const cols = ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Config, true);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'expanderColumn')).toBe(false);
    expect(cols.some((c) => c.field === 'resourceType')).toBe(false);
    expect(cols.some((c) => c.field === 'resourceId')).toBe(false);
    expect(cols.some((c) => c.field === 'activityType')).toBe(true);
    const activityTypeCol = cols.find((c) => c.field === 'activityType');
    expect(activityTypeCol?.cellRendererParams).toEqual({ showIcon: false });
    expect(cols.some((c) => c.field === 'activityId')).toBe(true);
  });

  test('ACTIVITY_AUDIT_COLUMNS returns expected columns in order for Deployments view', () => {
    const t = (s: string) => s;
    const cols = ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Deployments);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.map((c) => c.field)).toEqual([
      'activityType',
      'resourceType',
      'resourceId',
      'version',
      'epochTimestampMs',
      'initiatedEmail',
      'activityId',
      'parentActivityId',
    ]);
    expect(cols.some((c) => c.field === 'expanderColumn')).toBe(false);
  });

  test('IMAGE_DEPENDENCIES_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = IMAGE_DEPENDENCIES_COLUMNS(t);
    const cols2 = IMAGE_DEPENDENCIES_COLUMNS(t, true);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'name')).toBe(true);
    expect(cols1.some((c) => c.field === 'description')).toBe(true);
    expect(cols1.some((c) => c.field === 'image')).toBe(false);
    expect(cols1.find((c) => c.field === 'status')?.cellRenderer).toBeDefined();
    expect(Array.isArray(cols2)).toBe(true);
    expect(cols2.some((c) => c.headerName === 'Image')).toBe(true);
  });

  test('IMAGES_LIST_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = IMAGES_LIST_COLUMNS(t);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'name')).toBe(true);
    expect(cols1.some((c) => c.field === 'description')).toBe(true);
    expect(cols1.some((c) => c.field === 'author')).toBe(true);
  });

  test('IMAGES_LIST_FOR_CONTAINER_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = IMAGES_LIST_FOR_CONTAINER_COLUMNS(t);
    const cols2 = IMAGES_LIST_FOR_CONTAINER_COLUMNS(t, true);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'name')).toBe(true);
    expect(cols1.some((c) => c.field === 'versions')).toBe(true);
    expect(cols1.some((c) => c.field === 'topics')).toBe(false);
    expect(Array.isArray(cols2)).toBe(true);
    expect(cols2.some((c) => c.field === 'topics')).toBe(true);
  });

  test('CONTAINERS_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'name')).toBe(true);
    expect(cols1.some((c) => c.field === 'description')).toBe(true);
    expect(cols1.some((c) => c.field === 'topics')).toBe(true);
  });

  describe('CONTAINERS_COLUMNS resource columns', () => {
    const t = (s: string) => s;
    const cpuMemoryFields = [
      'resources.requests.cpu',
      'resources.limits.cpu',
      'resources.requests.memory',
      'resources.limits.memory',
    ];

    test('model-servings exposes CPU, memory, and GPU resource columns', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      cpuMemoryFields.forEach((field) => {
        expect(cols.some((c) => c.field === field)).toBe(true);
      });
      expect(cols.some((c) => c.field === 'resources.gpu')).toBe(true);
    });

    test.each([
      ApplicationRoute.McpContainers,
      ApplicationRoute.AdapterContainers,
      ApplicationRoute.ApplicationContainers,
      ApplicationRoute.InterceptorContainers,
    ])('non-model-servings route %s exposes CPU and memory but not GPU', (route) => {
      const cols = CONTAINERS_COLUMNS(t, 'type', route);
      cpuMemoryFields.forEach((field) => {
        expect(cols.some((c) => c.field === field)).toBe(true);
      });
      expect(cols.some((c) => c.field === 'resources.gpu')).toBe(false);
    });

    test('resource columns are hidden by default, sortable, and use the number filter', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const allResourceFields = [...cpuMemoryFields, 'resources.gpu'];
      allResourceFields.forEach((field) => {
        const col = cols.find((c) => c.field === field);
        expect(col).toBeDefined();
        expect(col?.hide).toBe(true);
        expect(col?.sortable).toBe(true);
        expect(col?.filter).toBe('agTextColumnFilter');
      });
    });

    test('CPU column valueGetter converts cores to millicores and valueFormatter appends " m"', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const cpuReq = cols.find((c) => c.field === 'resources.requests.cpu');
      const params = { data: { resources: { requests: { cpu: '0.5' } } } } as never;
      const value = (cpuReq?.valueGetter as (p: never) => number | null)(params);
      expect(value).toBe(500);
      const formatted = (cpuReq?.valueFormatter as (p: { value: number | null }) => string)({ value });
      expect(formatted).toBe('500 m');
    });

    test('Memory column valueGetter converts bytes to Mb and valueFormatter appends " Mb"', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const memLimit = cols.find((c) => c.field === 'resources.limits.memory');
      const params = { data: { resources: { limits: { memory: `${4 * 1024 * 1024 * 1024}` } } } } as never;
      const value = (memLimit?.valueGetter as (p: never) => number | null)(params);
      expect(value).toBe(4096);
      const formatted = (memLimit?.valueFormatter as (p: { value: number | null }) => string)({ value });
      expect(formatted).toBe('4096 Mb');
    });

    test('GPU column reads from resources.requests["nvidia.com/gpu"] and renders without a unit suffix', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const gpu = cols.find((c) => c.field === 'resources.gpu');
      const params = { data: { resources: { requests: { 'nvidia.com/gpu': '1' } } } } as never;
      const value = (gpu?.valueGetter as (p: never) => number | null)(params);
      expect(value).toBe(1);
      const formatted = (gpu?.valueFormatter as (p: { value: number | null }) => string)({ value });
      expect(formatted).toBe('1');
    });

    test('missing resource data yields null from valueGetter and empty from valueFormatter', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const cpuLimit = cols.find((c) => c.field === 'resources.limits.cpu');
      const params = { data: {} } as never;
      const value = (cpuLimit?.valueGetter as (p: never) => number | null)(params);
      expect(value).toBeNull();
      const formatted = (cpuLimit?.valueFormatter as (p: { value: number | null }) => string)({ value });
      expect(formatted).toBe('');
    });

    test('filterValueGetter returns the formatted string so Contains matches partial input', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);

      const cpuReq = cols.find((c) => c.field === 'resources.requests.cpu');
      expect(
        (cpuReq?.filterValueGetter as (p: never) => string)({
          data: { resources: { requests: { cpu: '0.5' } } },
        } as never),
      ).toBe('500 m');

      const memLimit = cols.find((c) => c.field === 'resources.limits.memory');
      expect(
        (memLimit?.filterValueGetter as (p: never) => string)({
          data: { resources: { limits: { memory: `${4 * 1024 * 1024 * 1024}` } } },
        } as never),
      ).toBe('4096 Mb');

      const gpu = cols.find((c) => c.field === 'resources.gpu');
      expect(
        (gpu?.filterValueGetter as (p: never) => string)({
          data: { resources: { requests: { 'nvidia.com/gpu': '1' } } },
        } as never),
      ).toBe('1');
    });

    test('resource columns are placed after the url column and before AUTHOR_COLUMN', () => {
      const cols = CONTAINERS_COLUMNS(t, 'type', ApplicationRoute.ModelServings);
      const urlIdx = cols.findIndex((c) => c.field === 'url');
      const authorIdx = cols.findIndex((c) => c.field === 'author');
      const cpuReqIdx = cols.findIndex((c) => c.field === 'resources.requests.cpu');
      const gpuIdx = cols.findIndex((c) => c.field === 'resources.gpu');
      expect(urlIdx).toBeGreaterThan(-1);
      expect(authorIdx).toBeGreaterThan(-1);
      expect(cpuReqIdx).toBeGreaterThan(urlIdx);
      expect(gpuIdx).toBeLessThan(authorIdx);
    });
  });

  test('CONTAINER_EVENTS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = CONTAINER_EVENTS(t);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'eventType')).toBe(true);
    expect(cols1.some((c) => c.field === 'message')).toBe(true);
  });

  test('DEPLOYMENT_ASSETS_COLUMNS returns expected columns', () => {
    expect(Array.isArray(DEPLOYMENT_ASSETS_COLUMNS)).toBe(true);
    expect(DEPLOYMENT_ASSETS_COLUMNS.some((c) => c.headerName === 'ID')).toBe(true);
  });

  test('NON_DEPLOYMENT_ASSETS_COLUMNS returns expected columns', () => {
    expect(Array.isArray(NON_DEPLOYMENT_ASSETS_COLUMNS)).toBe(true);
    expect(NON_DEPLOYMENT_ASSETS_COLUMNS.some((c) => c.headerName === 'Display Name')).toBe(true);
  });

  test('EXPORT_COLUMNS returns expected columns for prompts', () => {
    const cols = EXPORT_COLUMNS(vi.fn(), ApplicationRoute.Prompts);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'name')).toBe(true);
    expect(cols.some((c) => c.field === 'version' || c.field === 'extension')).toBe(true);
  });

  test('EXPORT_COLUMNS returns expected columns for files', () => {
    const cols = EXPORT_COLUMNS(vi.fn(), ApplicationRoute.Files);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'extension')).toBe(true);
  });

  test('PUBLICATION_COLUMNS returns expected columns', () => {
    expect(Array.isArray(PUBLICATION_COLUMNS)).toBe(true);
    expect(PUBLICATION_COLUMNS.some((c) => c.field === 'requestName')).toBe(true);
  });

  test('ENTITIES_COLUMNS returns columns with actions', () => {
    const baseCols = [{ field: 'id', headerName: 'ID' }];
    const cols = ENTITIES_COLUMNS(baseCols, vi.fn(), vi.fn(), vi.fn(), vi.fn());
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.colId === 'actions')).toBe(true);
    const actionsCol = cols.find((c) => c.colId === 'actions');
    expect((actionsCol as { actions: unknown[] })?.actions?.length).toBeGreaterThan(0);
  });

  test('TELEMETRY_GRID_COLUMNS returns expected columns', () => {
    expect(Array.isArray(TELEMETRY_GRID_COLUMNS)).toBe(true);
    expect(TELEMETRY_GRID_COLUMNS.some((c) => c.field === 'name')).toBe(true);
    expect(TELEMETRY_GRID_COLUMNS.some((c) => c.field === 'requests')).toBe(true);
    expect(TELEMETRY_GRID_COLUMNS.some((c) => c.field === 'cost')).toBe(true);
  });

  test('PROJECT_GRID_COLUMNS returns expected columns', () => {
    expect(Array.isArray(PROJECT_GRID_COLUMNS)).toBe(true);
    expect(PROJECT_GRID_COLUMNS.some((c) => c.field === 'name')).toBe(true);
    expect(PROJECT_GRID_COLUMNS.some((c) => c.field === 'requests')).toBe(true);
    expect(PROJECT_GRID_COLUMNS.some((c) => c.field === 'cost')).toBe(true);
  });

  const assertUsageLogColumnSet = (columns: ColDef[]) => {
    const completionTime = columns.find((c) => c.field === 'completion_time');
    expect(completionTime?.sort).toBe('desc');
  };

  test('USAGE_LOG_TRACES_COLUMNS default-sorts on completion_time', () => {
    assertUsageLogColumnSet(USAGE_LOG_TRACES_COLUMNS);
    expect(USAGE_LOG_TRACES_COLUMNS.some((c) => c.field === 'trace_id')).toBe(true);
    expect(USAGE_LOG_TRACES_COLUMNS.some((c) => c.field === 'price')).toBe(true);
    expect(USAGE_LOG_TRACES_COLUMNS.some((c) => c.field === 'model')).toBe(true);
  });

  test('USAGE_LOG_CONVERSATIONS_COLUMNS default-sorts on completion_time', () => {
    assertUsageLogColumnSet(USAGE_LOG_CONVERSATIONS_COLUMNS);
  });

  test('USAGE_LOG_MCP_COLUMNS default-sorts on completion_time', () => {
    assertUsageLogColumnSet(USAGE_LOG_MCP_COLUMNS);
  });

  test('USAGE_LOG_TOOLSET_TRACES_COLUMNS default-sorts on completion_time', () => {
    assertUsageLogColumnSet(USAGE_LOG_TOOLSET_TRACES_COLUMNS);
  });

  test('HF_REGISTRY_COLUMNS returns expected columns', () => {
    expect(Array.isArray(HF_REGISTRY_COLUMNS)).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'id')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'libraries')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'languages')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'licenses')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'author')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'parameters')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'tags')).toBe(true);
    expect(HF_REGISTRY_COLUMNS.some((c) => c.field === 'datasets')).toBe(true);
  });
});
