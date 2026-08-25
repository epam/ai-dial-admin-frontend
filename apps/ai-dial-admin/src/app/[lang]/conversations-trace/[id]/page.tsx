import { notFound } from 'next/navigation';

import ConversationDetailError from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailError';
import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import Page403 from '@/src/components/Page403/Page403';
import {
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationTranscript,
  ConversationTurnRow,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import {
  getConversationDetail,
  getConversationFeedback,
  getConversationTranscript,
  getConversationTurns,
  getConversationsSchema,
} from '../actions';

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
  let turns: ConversationTurnRow[] = [];
  let transcript: ConversationTranscript = { state: TranscriptState.LoadFailed, messages: [], loadedTurns: null };
  let hasLoadError = false;
  let hasTurnsLoadError = false;

  try {
    // The rollup's field set varies by deployment and the service rejects a whole query that names a field
    // its entity lacks, so the schema is read first and the detail query is built from what it reports. Only
    // that query waits on it: the turn read names no optional field, and the feedback read resolves its own
    // schema internally without rejecting.
    const [schema, ratings, turnResult] = await Promise.all([
      // A rejected schema read must cost the optional columns, not the page: without the `catch` it would
      // reject this whole wave and render the error state for a conversation the required-only projection
      // resolves fine. The list route defends the same call the same way.
      getConversationsSchema().catch((e): ServerActionResponse<AnalyticsEntitySchema> => {
        errorObjLog(e, 'Failed to fetch the conversations entity schema');
        return { success: false };
      }),
      getConversationFeedback(chatId),
      getConversationTurns(chatId),
    ]);
    const availableFields = schema.response?.fields?.map(({ name }) => name);

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the conversations entity schema');
    }

    const detail = await getConversationDetail(chatId, availableFields);

    hasLoadError = !detail.success;
    hasTurnsLoadError = !turnResult.success;
    conversation = detail.response?.conversation ?? null;
    feedback = ratings.response ?? null;
    turns = turnResult.response?.turns ?? [];

    if (!detail.success) {
      errorObjLog(detail, 'Failed to fetch conversation detail data');
    }
    if (!ratings.success) {
      errorObjLog(ratings, 'Failed to fetch conversation feedback');
    }
    if (!turnResult.success) {
      errorObjLog(turnResult, 'Failed to fetch conversation turns');
    }

    const transcriptResult = await getConversationTranscript(
      chatId,
      conversation?.last_request_time ?? null,
      nowMs,
    ).catch((e): ServerActionResponse<ConversationTranscript> => {
      errorObjLog(e, 'Failed to fetch the conversation transcript');
      return { success: false };
    });

    transcript = transcriptResult.response ?? { state: TranscriptState.LoadFailed, messages: [], loadedTurns: null };

    if (!transcriptResult.success) {
      errorObjLog(transcriptResult, 'Failed to fetch the conversation transcript');
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
      feedback={feedback}
      turns={turns}
      transcript={transcript}
      nowMs={nowMs}
      hasTurnsLoadError={hasTurnsLoadError}
    />
  );
}
