import {
  PROMPTS_COLUMNS,
  EXPORT_COLUMNS,
  PUBLICATION_COLUMNS,
  ENTITIES_COLUMNS,
  TELEMETRY_GRID_COLUMNS,
  PROJECT_GRID_COLUMNS,
  MODELS_COLUMNS,
  KEYS_COLUMNS,
} from '../grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/constants/ag-grid', () => ({
  ACTION_COLUMN: vi.fn((actions) => ({ colId: 'actions', actions })),
  NO_BORDER_CLASS: 'NO_BORDER_CLASS',
}));

describe('Constants :: grid columns', () => {
  test('MODELS_COLUMNS returns expected columns', () => {
    const t = (s: string) => s;
    const cols = MODELS_COLUMNS(t);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'adapter')).toBe(true);
    expect(cols.some((c) => c.field === 'type')).toBe(true);
    expect(cols.some((c) => c.field === 'pricing.prompt')).toBe(true);
  });

  test('KEYS_COLUMNS returns expected columns', () => {
    expect(Array.isArray(KEYS_COLUMNS)).toBe(true);
    expect(KEYS_COLUMNS.some((c) => c.field === 'name')).toBe(true);
    expect(KEYS_COLUMNS.some((c) => c.field === 'status')).toBe(true);
  });

  test('PROMPTS_COLUMNS returns expected columns', () => {
    expect(Array.isArray(PROMPTS_COLUMNS)).toBe(true);
    expect(PROMPTS_COLUMNS.some((c) => c.field === 'name')).toBe(true);
    expect(PROMPTS_COLUMNS.some((c) => c.field === 'version')).toBe(true);
    expect(PROMPTS_COLUMNS.some((c) => c.field === 'author')).toBe(true);
  });

  test('EXPORT_COLUMNS returns expected columns for prompts', () => {
    const cols = EXPORT_COLUMNS(vi.fn(), ApplicationRoute.Prompts);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'name')).toBe(true);
    expect(cols.some((c) => c.field === 'version' || c.field === 'extension')).toBe(true);
    expect(cols.some((c) => c.field === 'author')).toBe(true);
  });

  test('EXPORT_COLUMNS returns expected columns for files', () => {
    const cols = EXPORT_COLUMNS(vi.fn(), ApplicationRoute.Files);
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.some((c) => c.field === 'extension')).toBe(true);
  });

  test('PUBLICATION_COLUMNS returns expected columns', () => {
    expect(Array.isArray(PUBLICATION_COLUMNS)).toBe(true);
    expect(PUBLICATION_COLUMNS.some((c) => c.field === 'requestName')).toBe(true);
    expect(PUBLICATION_COLUMNS.some((c) => c.field === 'author')).toBe(true);
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
});
