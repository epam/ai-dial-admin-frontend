'use client';

import { FC, useCallback, useState } from 'react';

import ConversationDetailRail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail';
import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import ConversationTraceList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceList';
import ConversationViewSwitch from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationViewSwitch';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationDetailRow,
  ConversationDetailView as DetailView,
  ConversationFeedbackRow,
  ConversationTranscript,
  ConversationTurnRow,
  ConversationRatingCounts,
  RatingCounts as RatingCountsModel,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';

interface Props {
  conversation: ConversationDetailRow;
  transcript: ConversationTranscript;
  turns: ConversationTurnRow[];
  turnRatings: RatingCountsModel[];
  feedbackRows: ConversationFeedbackRow[];
  feedbackTotal: number | null;
  ratings: ConversationRatingCounts | null;
  isCommentTextReadable: boolean;
  questions: Map<string, string>;
  hasTurnsLoadError: boolean;
  onOpenTrace: (turn: ConversationTurnRow, turnNumber: number) => void;
}

const ConversationDetailBody: FC<Props> = ({
  conversation,
  transcript,
  turns,
  turnRatings,
  feedbackRows,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
  questions,
  hasTurnsLoadError,
  onOpenTrace,
}) => {
  const t = useI18n();
  const isChatDisabled = transcript.state === TranscriptState.ColumnsUnavailable;
  // Opening on a segment that cannot be selected leaves a keyboard reader with no starting point in the
  // switch, and every caller below FULL_ADMIN lands there.
  const [view, setView] = useState<DetailView>(isChatDisabled ? DetailView.Trace : DetailView.Chat);

  const onSelectView = useCallback(
    (next: DetailView) => setView(next === DetailView.Chat && isChatDisabled ? DetailView.Trace : next),
    [isChatDisabled],
  );

  return (
    <>
      <ConversationViewSwitch
        view={view}
        isChatDisabled={isChatDisabled}
        disabledReason={t(ConversationsTraceI18nKey.ViewChatUnavailable)}
        onSelectView={onSelectView}
      />
      <div className="flex min-h-0 flex-1 rounded border border-primary">
        {view === DetailView.Chat ? (
          <ConversationTimeline
            transcript={transcript}
            turns={turns}
            turnRatings={turnRatings}
            hasTurnsLoadError={hasTurnsLoadError}
            turnCount={conversation.turn_count}
            onOpenTrace={onOpenTrace}
          />
        ) : (
          <ConversationTraceList
            turns={turns}
            turnRatings={turnRatings}
            questions={questions}
            hasTurnsLoadError={hasTurnsLoadError}
            turnCount={conversation.turn_count}
            onOpenTrace={onOpenTrace}
          />
        )}
        <ConversationDetailRail
          conversation={conversation}
          feedback={feedbackRows}
          feedbackTotal={feedbackTotal}
          ratings={ratings}
          isCommentTextReadable={isCommentTextReadable}
        />
      </div>
    </>
  );
};

export default ConversationDetailBody;
