import { notFound } from 'next/navigation';

import TablesView from '@/src/components/Analytics/Tables/TablesView';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { errorObjLog } from '@/src/server/logger';
import { getTables } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let tables: AnalyticsTable[] | null = null;

  try {
    tables = await getTables();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch tables view data');
  }

  if (tables == null) {
    notFound();
  }

  return <TablesView initialTables={tables} />;
}
