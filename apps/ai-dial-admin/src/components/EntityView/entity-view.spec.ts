import { ApplicationRoute } from '@/src/types/routes';
import {
  dashboardsTabs,
  featuresTabs,
  getViewTabs,
  interceptorsTabs,
  parametersTabs,
  propertiesTabs,
  rolesTabs,
} from './entity-view';
import { describe, expect, test, vi } from 'vitest';

const t = vi.fn((id) => id);
const featureFlags = { dashboardEnabled: true };

describe('Entity View :: getViewTabs', () => {
  test('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models, false, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, false, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  test('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), parametersTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  test('Should return tabs for application with disabled dashboards', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, true, { dashboardEnabled: false });
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), parametersTabs(t), rolesTabs(t), interceptorsTabs(t)]);
  });

  test('Should return tabs for addon', () => {
    const res = getViewTabs(t, ApplicationRoute.Addons, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });

  test('Should return tabs for assistant', () => {
    const res = getViewTabs(t, ApplicationRoute.Assistants, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });

  test('Should return tabs for routes', () => {
    const res = getViewTabs(t, ApplicationRoute.Routes, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });
});
