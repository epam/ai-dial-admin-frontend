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

const t = jest.fn((id) => id);
const featureFlags = { dashboardEnabled: true };

describe('Entity View :: getViewTabs', () => {
  it('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models, false, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  it('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, false, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  it('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), parametersTabs(t), rolesTabs(t), interceptorsTabs(t), dashboardsTabs(t)]);
  });

  it('Should return tabs for application with disabled dashboards', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications, true, { dashboardEnabled: false });
    expect(res).toEqual([propertiesTabs(t), featuresTabs(t), parametersTabs(t), rolesTabs(t), interceptorsTabs(t)]);
  });

  it('Should return tabs for addon', () => {
    const res = getViewTabs(t, ApplicationRoute.Addons, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });

  it('Should return tabs for assistant', () => {
    const res = getViewTabs(t, ApplicationRoute.Assistants, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });

  it('Should return tabs for routes', () => {
    const res = getViewTabs(t, ApplicationRoute.Routes, true, featureFlags);
    expect(res).toEqual([propertiesTabs(t), rolesTabs(t)]);
  });
});
