import { redirect } from 'next/navigation';

import DashboardView from '@/src/components/Telemetry/DashboardView';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return <DashboardView grafanaLink={process.env.GRAFANA_LINK} />;
}
