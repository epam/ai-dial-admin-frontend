import SessionsTraceView from '@/src/components/Analytics/SessionsTrace/SessionsTraceView';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { ReadFailure } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { toReadFailure } from '@/src/utils/notification';
import { getSessionsSchema } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let schemaFields: AnalyticsEntityField[] | null = null;
  let schemaFailure: ReadFailure | null = null;

  // Only the schema is prefetched. The grid requests its own first page, so a prefetched page would be
  // discarded or duplicated — and the summary has to be an observation of the same fetch cycle as the rows
  // on screen, so one resolved here would be superseded the moment that page lands.
  try {
    const schema = await getSessionsSchema();
    schemaFields = schema.response?.fields ?? null;
    schemaFailure = schema.success ? null : toReadFailure(schema);

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the sessions entity schema');
    }
  } catch (e) {
    schemaFailure = toReadFailure();
    errorObjLog(e, 'Failed to fetch the sessions entity schema');
  }

  return <SessionsTraceView schemaFields={schemaFields} schemaFailure={schemaFailure} />;
}
