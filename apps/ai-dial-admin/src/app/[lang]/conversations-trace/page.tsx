import ConversationsTraceView from '@/src/components/Analytics/ConversationsTrace/ConversationsTraceView';
import Page403 from '@/src/components/Page403/Page403';
import { CONVERSATIONS_TIME_PERIOD } from '@/src/constants/analytics/conversations-trace';
import { ConversationTotals, FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { getConversationTotals, getConversationsSchema } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let totals: ConversationTotals | null = null;
  let hasInitialLoadError = false;
  let schemaFields: AnalyticsEntityField[] | null = null;
  let hasSchemaError = false;

  try {
    const range = getTimeRangeById(CONVERSATIONS_TIME_PERIOD);
    // Only the totals are prefetched: the grid requests its own first page, so a prefetched page would
    // be discarded or duplicated.
    const [result, schema] = await Promise.all([
      getConversationTotals({
        search: '',
        startMs: range.startDate.getTime(),
        endMs: range.endDate.getTime(),
        feedback: FeedbackFilter.All,
      }),
      getConversationsSchema().catch((e): ServerActionResponse<AnalyticsEntitySchema> => {
        errorObjLog(e, 'Failed to fetch the conversations entity schema');
        return { success: false };
      }),
    ]);
    hasSchemaError = !schema.success;
    schemaFields = schema.response?.fields ?? null;

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the conversations entity schema');
    }

    // The action reports a failed query in its response rather than throwing, so the success flag is the
    // only thing separating "no conversations" from "the query never ran".
    hasInitialLoadError = !result.success;
    totals = result.response ?? null;

    if (!result.success) {
      errorObjLog(result, 'Failed to fetch conversations view data');
    }
  } catch (e) {
    hasInitialLoadError = true;
    errorObjLog(e, 'Failed to fetch conversations view data');
  }

  return (
    <ConversationsTraceView
      initialTotals={totals}
      hasInitialLoadError={hasInitialLoadError}
      schemaFields={schemaFields}
      hasSchemaError={hasSchemaError}
    />
  );
}
