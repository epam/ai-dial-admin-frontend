import DashboardView from '@/src/components/Telemetry/DashboardView';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <DashboardView grafanaLink={process.env.GRAFANA_LINK} />;
}
