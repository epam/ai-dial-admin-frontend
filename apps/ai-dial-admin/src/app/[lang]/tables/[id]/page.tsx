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

  return <TableDetailView name={name} initialTable={table} />;
}
