import { notFound } from 'next/navigation';

import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import Page403 from '@/src/components/Page403/Page403';
import DashboardView from '@/src/components/Telemetry/DashboardView';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // The same pair the layout builds `analyticsUsageEnabled` from, so the page and the menu agree on
  // which dashboard this route serves and in which group its item sits. The usage flag without the
  // analytics flag is a misconfiguration and serves no analytics at all.
  if (isValueTruthy(process.env.ANALYTICS_ENABLED) && isValueTruthy(process.env.ANALYTICS_USAGE_ENABLED)) {
    if (await isAnalyticsForbidden()) {
      return <Page403 />;
    }

    return <UsageDashboard />;
  }

  // The same test the layout builds `dashboardEnabled` from: disabling the dashboard removes the
  // telemetry page along with its menu item.
  const isDashboardEnabled = !process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('dashboard');
  if (process.env.DIAL_ADMIN_API_URL && isDashboardEnabled) {
    return <DashboardView grafanaLink={process.env.GRAFANA_LINK} />;
  }

  notFound();
}
