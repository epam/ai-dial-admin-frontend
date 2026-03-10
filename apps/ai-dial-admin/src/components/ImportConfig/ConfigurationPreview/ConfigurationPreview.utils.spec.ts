import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { describe, expect, test } from 'vitest';
import { getActionClassName, getComponentColDefs, getConfigurationPreview } from './ConfigurationPreview.utils';

describe('ConfigurationPreview.utils', () => {
  const t = (v: string) => v;
  const compare = () => void 0;

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

  test('getConfigurationPreview returns correct prevData structure with next/prev fields', () => {
    const config = {
      models: [{ importAction: 'CREATE', next: { id: 1 }, prev: { id: 1 } }],
      applications: [{ importAction: 'UPDATE', next: { id: 2 }, prev: { id: 2 } }],
      routes: [],
      roles: [],
      keys: [],
      applicationRunners: [],
      interceptors: [],
      prompts: [],
      files: [],
    };

    const { previewData, prevData } = getConfigurationPreview(config as any, t);

    expect(prevData).toBeDefined();

    expect(prevData[EntityType.MODEL]).toBeDefined();
    expect(prevData[EntityType.APPLICATION]).toBeDefined();

    expect(prevData[EntityType.MODEL].length).toBe(previewData[EntityType.MODEL].length);
    expect(prevData[EntityType.APPLICATION].length).toBe(previewData[EntityType.APPLICATION].length);

    expect(prevData[EntityType.MODEL][0].id).toBe(1);
    expect(prevData[EntityType.APPLICATION][0].id).toBe(2);

    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.APPLICATION][0].id).toBe(2);

    expect(prevData[EntityType.ROUTE]).toEqual([]);
  });

  test('getConfigurationPreview returns prevData with undefined items when no previous items exist', () => {
    const config = {
      models: [{ importAction: 'CREATE', next: { id: 1 }, prev: undefined }],
      roles: [{ importAction: 'UPDATE', next: { id: 2 }, prev: undefined }],
    };

    const { previewData, prevData } = getConfigurationPreview(config as any, t);

    expect(prevData[EntityType.MODEL][0]).toBeUndefined();
    expect(prevData[EntityType.ROLE][0]).toBeUndefined();

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(previewData[EntityType.ROLE]).toHaveLength(1);
    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.ROLE][0].id).toBe(2);
  });

  test('getConfigurationPreview handles empty config correctly with prevData', () => {
    const { previewData, prevData, tabs } = getConfigurationPreview({}, t);

    expect(Object.keys(previewData).length).toBe(0);
    expect(Object.keys(prevData).length).toBe(0);

    expect(tabs).toBeDefined();
    expect(tabs.length).toBe(0);
  });

  test('getConfigurationPreview returns correct prevData when configuration has mixed items with next/prev fields', () => {
    const config = {
      models: [{ importAction: 'CREATE', next: { id: 1 }, prev: { id: 1 } }],
      roles: [{ importAction: 'UPDATE', next: { id: 2 }, prev: { id: 2 } }],
      routes: [],
    };

    const { previewData, prevData } = getConfigurationPreview(config as any, t);

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(previewData[EntityType.ROLE]).toHaveLength(1);
    expect(prevData[EntityType.MODEL]).toBeDefined();
    expect(prevData[EntityType.ROLE]).toBeDefined();

    expect(prevData[EntityType.MODEL].length).toBe(previewData[EntityType.MODEL].length);
    expect(prevData[EntityType.ROLE].length).toBe(previewData[EntityType.ROLE].length);

    expect(prevData[EntityType.MODEL][0].id).toBe(1);
    expect(prevData[EntityType.ROLE][0].id).toBe(2);

    expect(previewData[EntityType.MODEL][0].id).toBe(1);
    expect(previewData[EntityType.ROLE][0].id).toBe(2);

    expect(prevData[EntityType.ROUTE]).toEqual([]);
  });

  test('getConfigurationPreview handles missing configuration keys gracefully', () => {
    const config = {
      models: [{ importAction: 'CREATE', next: { id: 1 }, prev: { id: 1 } }],
    };

    const { previewData, prevData } = getConfigurationPreview(config as any, t);

    expect(previewData[EntityType.MODEL]).toHaveLength(1);
    expect(prevData[EntityType.MODEL]).toBeDefined();

    expect(prevData[EntityType.APPLICATION]).toBeUndefined();
    expect(prevData[EntityType.ROUTE]).toBeUndefined();
  });

  test('getActionClassName returns correct class', () => {
    expect(getActionClassName(ImportConfigurationAction.CREATE)).toBe('bg-accent-primary');
    expect(getActionClassName(ImportConfigurationAction.UPDATE)).toBe('bg-orange-400');
    expect(getActionClassName(ImportConfigurationAction.OTHER)).toBe('bg-controls-disable');
  });

  test('getComponentColDefs returns correct columns for MODEL', () => {
    const cols = getComponentColDefs(EntityType.MODEL, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for APPLICATION', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns correct columns for ROUTE/ROLE/INTERCEPTOR', () => {
    ['ROUTE', 'ROLE', 'INTERCEPTOR'].forEach((type) => {
      const cols = getComponentColDefs(type, t, compare);
      expect(cols[0].field).toBe('action');
      expect(cols[1].field).toBe('displayName');
    });
  });

  test('getComponentColDefs returns correct columns for APPLICATION_TYPE_SCHEMA', () => {
    const cols = getComponentColDefs(EntityType.APPLICATION_TYPE_SCHEMA, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('dial:applicationTypeDisplayName');
  });

  test('getComponentColDefs returns correct columns for KEY', () => {
    const cols = getComponentColDefs(EntityType.KEY, t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });

  test('getComponentColDefs returns BASE_COLUMNS for unknown type', () => {
    const cols = getComponentColDefs('UNKNOWN', t, compare);
    expect(cols[0].field).toBe('action');
    expect(cols[1].field).toBe('displayName');
  });
});
