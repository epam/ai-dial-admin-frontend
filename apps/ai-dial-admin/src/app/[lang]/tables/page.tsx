import { notFound } from 'next/navigation';

import TablesView from '@/src/components/Analytics/Tables/TablesView';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getTables } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

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
