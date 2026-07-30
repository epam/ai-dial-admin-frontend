'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import ConversationsProvenanceLine from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsProvenanceLine';
import ConversationsSummary from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsSummary';
import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import ConversationsToolbar from '@/src/components/Analytics/ConversationsTrace/Toolbar/ConversationsToolbar';
import { useConversations } from '@/src/components/Analytics/ConversationsTrace/use-conversations';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { summariseConversations } from '@/src/utils/analytics/conversation-rows';

const LOADER_SIZE = 40;

interface Props {
  initialConversations: ConversationRow[];
  hasInitialLoadError?: boolean;
}

const ConversationsTraceView: FC<Props> = ({ initialConversations, hasInitialLoadError }) => {
  const t = useI18n();
  const {
    conversations,
    hasLoadError,
    isLoading,
    search,
    onSearchChange,
    timePeriod,
    timeRange,
    onTimePeriodChange,
    onTimeRangeChange,
    feedback,
    onFeedbackChange,
  } = useConversations(initialConversations, hasInitialLoadError);

  const summary = useMemo(() => summariseConversations(conversations), [conversations]);

  return (
    <div className="flex flex-col size-full bg-layer-2 rounded py-5 px-6 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-primary">{t(ConversationsTraceI18nKey.Title)}</h1>
          <ConversationsProvenanceLine />
        </div>
        <ConversationsSummary summary={summary} periodLabel={timePeriod} />
      </div>
      <ConversationsToolbar
        search={search}
        onSearchChange={onSearchChange}
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        feedback={feedback}
        onFeedbackChange={onFeedbackChange}
      />
      <div className="flex flex-1 rounded overflow-auto min-h-0 border border-primary">
        {isLoading ? (
          <div className="flex size-full items-center justify-center">
            <DialLoader size={LOADER_SIZE} />
          </div>
        ) : (
          <ConversationsList conversations={conversations} hasLoadError={hasLoadError} />
        )}
      </div>
    </div>
  );
};

export default ConversationsTraceView;
