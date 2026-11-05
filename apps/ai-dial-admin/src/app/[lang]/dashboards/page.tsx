import { notFound } from 'next/navigation';

import { listDashboards } from '@/src/app/[lang]/dashboards/custom-actions';
import DashboardSwitcher from '@/src/components/Analytics/CustomDashboards/Switcher/DashboardSwitcher';
import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import Page403 from '@/src/components/Page403/Page403';
import DashboardView from '@/src/components/Telemetry/DashboardView';
import { NO_DASHBOARD_CREATE_PERMISSIONS } from '@/src/constants/analytics/dashboards';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { getCallerSource } from '@/src/server/analytics/usage-caller-source';
import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // The same pair the layout builds `analyticsUsageEnabled` from, so the page and the menu agree on
  // which dashboard this route serves and in which group its item sits. The usage flag without the
  // analytics flag is a misconfiguration and serves no analytics at all.
  if (isValueTruthy(process.env.ANALYTICS_ENABLED) && isValueTruthy(process.env.ANALYTICS_USAGE_ENABLED)) {
    const [isForbidden, callerSource] = await Promise.all([isAnalyticsForbidden(), getCallerSource()]);
    if (isForbidden) {
      return <Page403 />;
    }

    let switcher;
    if (getIsCustomDashboardsEnabled()) {
      const list = (await listDashboards()).response;
      switcher = (
        <DashboardSwitcher
          dashboards={list?.dashboards ?? []}
          createPermissions={list?.permissions ?? NO_DASHBOARD_CREATE_PERMISSIONS}
        />
      );
    }

    return <UsageDashboard callerSource={callerSource} switcher={switcher} />;
  }

  // The same test the layout builds `dashboardEnabled` from: disabling the dashboard removes the
  // telemetry page along with its menu item.
  const isDashboardEnabled = !process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('dashboard');
  if (process.env.DIAL_ADMIN_API_URL && isDashboardEnabled) {
    return <DashboardView grafanaLink={process.env.GRAFANA_LINK} />;
  }

  notFound();
}
