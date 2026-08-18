import { notFound } from 'next/navigation';

import ConversationDetailError from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailError';
import ConversationDetailView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailView';
import Page403 from '@/src/components/Page403/Page403';
import {
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationMessage,
  ConversationTurnRow,
} from '@/src/models/analytics/conversations-trace';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { mockConversationTranscript } from '@/src/mocks/analytics/conversation-transcript';
import { getConversationDetail, getConversationFeedback, getConversationTurns } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { id } = await params;
  const chatId = decodeURIComponent(id);

  let conversation: ConversationDetailRow | null = null;
  let feedback: ConversationFeedbackPage | null = null;
  let turns: ConversationTurnRow[] = [];
  let messages: ConversationMessage[] = [];
  let hasLoadError = false;
  let hasTurnsLoadError = false;

  try {
    const [detail, ratings, turnResult] = await Promise.all([
      getConversationDetail(chatId),
      getConversationFeedback(chatId),
      getConversationTurns(chatId),
    ]);

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

    // Sample exchanges follow the turns actually loaded, not the rollup's `turn_count`: each one carries its
    // turn's real figures, so counting from the rollup would pad a clipped list with figureless messages.
    messages = mockConversationTranscript(chatId, turns.length);
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
      messages={messages}
      nowMs={Date.now()}
      hasTurnsLoadError={hasTurnsLoadError}
    />
  );
}
