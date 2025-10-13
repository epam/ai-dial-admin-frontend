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
} from '../utils';
import { describe, expect, test, vi } from 'vitest';

const t = vi.fn((id) => id);

describe('Entity View :: getViewTabs', () => {
  test('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), auditTabs(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
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

  test('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
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
    const res = getViewTabs(t, ApplicationRoute.Routes);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t), auditTabs(t)]);
  });
});
