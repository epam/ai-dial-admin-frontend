import { notFound } from 'next/navigation';

import ConversationDetailError from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailError';
import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import Page403 from '@/src/components/Page403/Page403';
import {
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationInsightField,
  HopBodyGrants,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { insightColumnsOf } from '@/src/utils/analytics/conversation-insights';
import { getConversationDetail, getConversationFeedback, getHopBodyGrants, getConversationsSchema } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { id } = await params;
  const chatId = decodeURIComponent(id);
  const nowMs = Date.now();

  let conversation: ConversationDetailRow | null = null;
  let feedback: ConversationFeedbackPage | null = null;
  let bodyGrants: HopBodyGrants = { isRequestReadable: false, isResponseReadable: false };
  let hasLoadError = false;
  let insightColumns: ConversationInsightField[] = [];

  try {
    // The rollup's field set varies by deployment and the service rejects a whole query that names a field
    // its entity lacks, so the schema is read first and the detail query is built from what it reports.
    const [schema, ratings, availability] = await Promise.all([
      // A rejected schema read must cost the optional columns, not the page: without the `catch` it would
      // reject this whole wave and render the error state for a conversation the required-only projection
      // resolves fine. The list route defends the same call the same way.
      getConversationsSchema().catch((e): ServerActionResponse<AnalyticsEntitySchema> => {
        errorObjLog(e, 'Failed to fetch the conversations entity schema');
        return { success: false };
      }),
      getConversationFeedback(chatId),
      getHopBodyGrants().catch((e) => {
        errorObjLog(e, 'Failed to probe the hop body columns');
        return { success: false, response: { isRequestReadable: false, isResponseReadable: false } };
      }),
    ]);
    const schemaFields = schema.response?.fields;
    // Resolved once, here, from the schema the route already holds: the panel renders whatever the
    // enrichment exposes, and the client has no schema of its own to derive that from.
    insightColumns = insightColumnsOf(schemaFields);

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the conversations entity schema');
    }

    const detail = await getConversationDetail(chatId, schemaFields);

    hasLoadError = !detail.success;
    conversation = detail.response?.conversation ?? null;
    feedback = ratings.response ?? null;
    bodyGrants = availability.response ?? bodyGrants;

    if (!detail.success) {
      errorObjLog(detail, 'Failed to fetch conversation detail data');
    }
    if (!ratings.success) {
      errorObjLog(ratings, 'Failed to fetch conversation feedback');
    }
  } catch (e) {
    hasLoadError = true;
    errorObjLog(e, 'Failed to fetch conversation detail data');
  }

  if (hasLoadError) {
    return <ConversationDetailError chatId={chatId} />;
  }

  if (conversation == null) {
    notFound();
  }

  return (
    <ConversationDetailView
      conversation={conversation}
      insightColumns={insightColumns}
      feedback={feedback}
      bodyGrants={bodyGrants}
      nowMs={nowMs}
    />
  );
}
