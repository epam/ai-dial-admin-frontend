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
} from '../grid-columns';
import { describe, expect, test, vi } from 'vitest';
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

  test('ACTIVITY_AUDIT_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = ACTIVITY_AUDIT_COLUMNS(t);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'activityType')).toBe(true);
    expect(cols1.some((c) => c.field === 'resourceId')).toBe(true);

    const cols2 = ACTIVITY_AUDIT_COLUMNS(t, true);
    expect(Array.isArray(cols2)).toBe(true);
    expect(cols2.some((c) => c.field === 'activityType')).toBe(true);
    expect(cols2.some((c) => c.field === 'activityId')).toBe(true);
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
    expect(cols2.some((c) => c.field === 'imageDefinitionId')).toBe(true);
  });

  test('IMAGES_LIST_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols1 = IMAGES_LIST_COLUMNS(t);
    expect(Array.isArray(cols1)).toBe(true);
    expect(cols1.some((c) => c.field === 'name')).toBe(true);
    expect(cols1.some((c) => c.field === 'description')).toBe(true);
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
