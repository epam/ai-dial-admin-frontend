import { notFound } from 'next/navigation';

import { getResolvedDashboard, listDashboards } from '@/src/app/[lang]/dashboards/custom-actions';
import CustomDashboardView from '@/src/components/Analytics/CustomDashboards/CustomDashboardView';
import Page403 from '@/src/components/Page403/Page403';
import { DASHBOARD_EDIT_PARAM, NO_DASHBOARD_CREATE_PERMISSIONS } from '@/src/constants/analytics/dashboards';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ params, searchParams }: PageProps) {
  // The same reading the layout builds the switcher's flag from, so an address the switcher never offers
  // is not reachable by URL either.
  if (!getIsCustomDashboardsEnabled()) {
    notFound();
  }
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [resolved, list] = await Promise.all([getResolvedDashboard(decodeURIComponent(id)), listDashboards()]);
  if (!resolved.success || !resolved.response) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      {/* Keyed by the dashboard, so moving between two dashboards starts from the new one's stored state. */}
      <CustomDashboardView
        key={resolved.response.dashboard.id}
        resolved={resolved.response}
        dashboards={list.response?.dashboards ?? []}
        createPermissions={list.response?.permissions ?? NO_DASHBOARD_CREATE_PERMISSIONS}
        isInitiallyEditing={query[DASHBOARD_EDIT_PARAM] != null}
      />
    </SaveValidationContextProvider>
  );
}
