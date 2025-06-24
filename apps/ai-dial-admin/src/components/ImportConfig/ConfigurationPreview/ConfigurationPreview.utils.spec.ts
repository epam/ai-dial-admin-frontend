import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { describe, expect, test } from 'vitest';
import { getActionClass, getComponentColDefs, getConfigurationPreview } from './ConfigurationPreview.utils';

describe('ConfigurationPreview.utils', () => {
  const t = (v: string) => v;

  test('getConfigurationPreview returns correct previewData and tabs', () => {
    const { tabs } = getConfigurationPreview({}, t);
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBe(0);
  });

  test('getConfigurationPreview returns correct previewData and tabs', () => {
    const config = {
      models: [{ importAction: 'CREATE', value: { id: 1 } }],
      applications: [{ importAction: 'UPDATE', value: { id: 2 } }],
      routes: [],
      roles: [],
      keys: [],
      applicationRunners: [],
      interceptors: [],
      prompts: [],
      files: [],
    };
    const { previewData, tabs } = getConfigurationPreview(config as any, t);
    expect(previewData.MODEL).toBeDefined();
    expect(previewData.APPLICATION).toBeDefined();
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs[0].name).toContain('Model');
    expect(tabs[1].name).toContain('Application');
  });

  test('getActionClass returns correct class', () => {
    expect(getActionClass(ImportConfigurationAction.CREATE)).toBe('bg-accent-primary');
    expect(getActionClass(ImportConfigurationAction.UPDATE)).toBe('bg-orange-400');
    expect(getActionClass(ImportConfigurationAction.OTHER)).toBe('bg-controls-disable');
  });

  test('getComponentColDefs returns correct columns for MODEL', () => {
    const cols = getComponentColDefs(EntityType.MODEL, [], t);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for APPLICATION', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION, [], t);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for ROUTE/ROLE/INTERCEPTOR', () => {
    ['ROUTE', 'ROLE', 'INTERCEPTOR'].forEach((type) => {
      const cols = getComponentColDefs(type, [], t);
      expect(cols[0].field).toBe('action');
      expect(cols[1].field).toBe('name');
    });
  });

  test('getComponentColDefs returns correct columns for APPLICATION_TYPE_SCHEMA', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION_TYPE_SCHEMA, [], t);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('dial:applicationTypeDisplayName');
  });

  test('getComponentColDefs returns correct columns for KEY', () => {
    const cols = getComponentColDefs(EntityType.KEY, [], t);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('name');
  });

  test('getComponentColDefs returns ENTITY_BASE_COLUMNS for unknown type', () => {
    const cols = getComponentColDefs('UNKNOWN', [], t);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });
});
