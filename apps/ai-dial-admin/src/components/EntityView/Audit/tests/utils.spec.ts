import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getAuditTabs } from '../utils';
import { TabsI18nKey } from '@/src/constants/i18n';

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
