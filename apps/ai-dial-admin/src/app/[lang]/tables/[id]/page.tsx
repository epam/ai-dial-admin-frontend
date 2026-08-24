import { notFound } from 'next/navigation';

import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { errorObjLog } from '@/src/server/logger';
import { getTable } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = decodeURIComponent(id);

  let table: AnalyticsTable | null = null;
  try {
    table = await getTable(name);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch table view data');
  }

  if (table == null) {
    notFound();
  }

  // Server-only, so it is read here and passed down rather than added to FeatureFlags, which carries
  // booleans consumed app-wide. Blank when unset — the Connect snippets then show a placeholder
  // endpoint rather than a confidently wrong one.
  const apiBaseUrl = process.env.ANALYTICS_PUBLIC_URL ?? '';
  // Its own variable rather than derived from the REST URL: the Flight endpoint is a separately
  // exposed gRPC port, usually on a different host.
  const flightUri = process.env.ANALYTICS_FLIGHT_SQL_PUBLIC_URL ?? '';

  return <TableDetailView name={name} initialTable={table} apiBaseUrl={apiBaseUrl} flightUri={flightUri} />;
}
