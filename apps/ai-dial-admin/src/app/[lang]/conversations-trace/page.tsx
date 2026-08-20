import ConversationsTraceView from '@/src/components/Analytics/ConversationsTrace/ConversationsTraceView';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getConversationsSchema } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let schemaFields: AnalyticsEntityField[] | null = null;
  let hasSchemaError = false;

  // Only the schema is prefetched. The grid requests its own first page, so a prefetched page would be
  // discarded or duplicated — and the summary has to be an observation of the same fetch cycle as the rows
  // on screen, so one resolved here would be superseded the moment that page lands.
  try {
    const schema = await getConversationsSchema();
    hasSchemaError = !schema.success;
    schemaFields = schema.response?.fields ?? null;

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the conversations entity schema');
    }
  } catch (e) {
    hasSchemaError = true;
    errorObjLog(e, 'Failed to fetch the conversations entity schema');
  }

  return <ConversationsTraceView schemaFields={schemaFields} hasSchemaError={hasSchemaError} />;
}
