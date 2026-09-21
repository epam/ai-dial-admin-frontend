import { notFound } from 'next/navigation';

import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import Page403 from '@/src/components/Page403/Page403';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Both flags, so the route and the menu item agree on when the page exists: the layout builds
  // `analyticsUsageEnabled` from the same pair.
  if (!isValueTruthy(process.env.ANALYTICS_ENABLED) || !isValueTruthy(process.env.ANALYTICS_USAGE_ENABLED)) {
    notFound();
  }

  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  return <UsageDashboard />;
}
