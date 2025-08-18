import { ApplicationRoute } from '@/src/types/routes';
import {
  auditTabs,
  featuresTabs,
  getViewTabs,
  interceptorsTabs,
  parametersTabs,
  propertiesTabs,
  rolesTabs,
  appRouteTab,
  dependenciesTabs,
  getIsParametersTabAvailable,
} from '../utils';
import { describe, expect, test, vi } from 'vitest';

const t = vi.fn((id) => id);

describe('Entity View :: getViewTabs', () => {
  test('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models, false);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), auditTabs(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, false);
    expect(res).toEqual([
      propertiesTabs(t),
      featuresTabs(t),
      rolesTabs(t),
      interceptorsTabs(t),
      dependenciesTabs(t),
      appRouteTab(t),
      auditTabs(t),
    ]);
  });

  test('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, true);
    expect(res).toEqual([
      propertiesTabs(t),
      featuresTabs(t),
      parametersTabs(t),
      rolesTabs(t),
      interceptorsTabs(t),
      dependenciesTabs(t),
      appRouteTab(t),
      auditTabs(t),
    ]);
  });

  test('Should return tabs for routes', () => {
    const res = getViewTabs(t, ApplicationRoute.Routes, true);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });
});

describe('getIsParametersTabAvailable', () => {
  test('returns true if application.editorUrl is present', () => {
    const app = { editorUrl: 'http://editor', customAppSchemaId: undefined } as any;
    expect(getIsParametersTabAvailable(app)).toBe(true);
  });

  test('returns false if no editorUrl and no customAppSchemaId', () => {
    const app = { editorUrl: '', customAppSchemaId: undefined } as any;
    expect(getIsParametersTabAvailable(app)).toBe(false);
  });

  test('returns true if customAppSchemaId matches appRunners with editor url', () => {
    const app = { customAppSchemaId: 'abc', editorUrl: '' } as any;
    const appRunners = [
      { $id: 'abc', 'dial:applicationTypeEditorUrl': 'http://editor' },
      { $id: 'def', 'dial:applicationTypeEditorUrl': '' },
    ] as any;
    expect(getIsParametersTabAvailable(app, appRunners)).toBe(true);
  });

  test('returns false if customAppSchemaId does not match any appRunners', () => {
    const app = { customAppSchemaId: 'xyz', editorUrl: '' } as any;
    const appRunners = [{ $id: 'abc', 'dial:applicationTypeEditorUrl': 'http://editor' }] as any;
    expect(getIsParametersTabAvailable(app, appRunners)).toBe(false);
  });

  test('returns false if customAppSchemaId matches but no editor url', () => {
    const app = { customAppSchemaId: 'abc', editorUrl: '' } as any;
    const appRunners = [{ $id: 'abc', 'dial:applicationTypeEditorUrl': '' }] as any;
    expect(getIsParametersTabAvailable(app, appRunners)).toBe(false);
  });

  test('returns false if appRunners is null or undefined', () => {
    const app = { customAppSchemaId: 'abc', editorUrl: '' } as any;
    expect(getIsParametersTabAvailable(app, null)).toBe(false);
    expect(getIsParametersTabAvailable(app, undefined)).toBe(false);
  });
});
