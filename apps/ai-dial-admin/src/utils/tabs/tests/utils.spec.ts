import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  appRouteTab,
  auditTab,
  dependenciesTab,
  featuresTab,
  getAuditTabs,
  getViewTabs,
  interceptorsTab,
  parametersTab,
  propertiesTab,
  rolesTab,
} from '../utils';

const t = vi.fn((id) => id);

describe('getViewTabs', () => {
  test('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models);
    expect(res).toEqual([propertiesTab(t), featuresTab(t), rolesTab(t), interceptorsTab(t), auditTab(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
    expect(res).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      rolesTab(t),
      interceptorsTab(t),
      dependenciesTab(t),
      appRouteTab(t),
      auditTab(t),
    ]);
  });

  test('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
    expect(res).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      rolesTab(t),
      interceptorsTab(t),
      dependenciesTab(t),
      appRouteTab(t),
      auditTab(t),
    ]);
  });

  test('Should return tabs for routes', () => {
    const res = getViewTabs(t, ApplicationRoute.Routes);
    expect(res).toEqual([propertiesTab(t), rolesTab(t), auditTab(t)]);
  });
});

describe('getAuditTabs', () => {
  const t = (s: string) => s;

  test('returns dashboard and activities tabs if dashboardEnabled and view is Models', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Models);
    expect(tabs).toEqual([
      { id: 'Dashboard', name: TabsI18nKey.Dashboard },
      { id: 'Traces', name: TabsI18nKey.Traces },
      { id: 'Conversations', name: TabsI18nKey.Conversations },
      { id: 'Activities', name: TabsI18nKey.Activities },
    ]);
  });

  test('returns dashboard and activities tabs if dashboardEnabled and view is Applications', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Applications);
    expect(tabs).toEqual([
      { id: 'Dashboard', name: TabsI18nKey.Dashboard },
      { id: 'Traces', name: TabsI18nKey.Traces },
      { id: 'Conversations', name: TabsI18nKey.Conversations },
      { id: 'Activities', name: TabsI18nKey.Activities },
    ]);
  });

  test('returns only activities tab if dashboardEnabled is false', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: false }, ApplicationRoute.Models);
    expect(tabs).toEqual([{ id: 'Activities', name: TabsI18nKey.Activities }]);
  });

  test('returns only activities tab for other views', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Home);
    expect(tabs).toEqual([{ id: 'Activities', name: TabsI18nKey.Activities }]);
  });
});
