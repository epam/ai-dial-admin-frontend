'use client';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import ConversationsProvenanceLine from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsProvenanceLine';
import ConversationsSummary from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsSummary';
import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import ConversationsToolbar from '@/src/components/Analytics/ConversationsTrace/Toolbar/ConversationsToolbar';
import { useConversations } from '@/src/components/Analytics/ConversationsTrace/use-conversations';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationTotals } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  initialTotals: ConversationTotals | null;
  hasInitialLoadError?: boolean;
  schemaFields?: AnalyticsEntityField[] | null;
}

const ConversationsTraceView: FC<Props> = ({ initialTotals, hasInitialLoadError, schemaFields }) => {
  const t = useI18n();
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);
  const {
    onGridReady,
    datasource,
    totals,
    summary,
    loadedCount,
    isEmptyResult,
    isFirstPageLoading,
    isFeedbackCapped,
    hasLoadError,
    search,
    onSearchChange,
    timePeriod,
    timeRange,
    onTimePeriodChange,
    onTimeRangeChange,
    feedback,
    onFeedbackChange,
  } = useConversations(initialTotals, hasInitialLoadError, schemaFields);

  const onToggleColumnsPanel = useCallback(() => setIsColumnsPanelOpen((isOpen) => !isOpen), []);

  const emptyStateTitle = hasLoadError
    ? ConversationsTraceI18nKey.ConversationsLoadFailed
    : ConversationsTraceI18nKey.NoConversations;

  // The grid stays mounted whatever the state: under the infinite row model its datasource is attached
  // through the grid api, so unmounting it would strand the next request.
  const isEmptyStateVisible = !isFirstPageLoading && (isEmptyResult || hasLoadError);

  return (
    <div className="flex flex-col size-full bg-layer-2 rounded py-5 px-6 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-primary">{t(ConversationsTraceI18nKey.Title)}</h1>
          <ConversationsProvenanceLine />
        </div>
        <ConversationsSummary totals={totals} summary={summary} loadedCount={loadedCount} periodLabel={timePeriod} />
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
        isFeedbackCapped={isFeedbackCapped}
        onToggleColumnsPanel={onToggleColumnsPanel}
      />
      <div className="relative flex flex-1 rounded overflow-auto min-h-0 border border-primary">
        <ConversationsList
          datasource={datasource}
          onGridReady={onGridReady}
          schemaFields={schemaFields}
          isColumnsPanelOpen={isColumnsPanelOpen}
          onToggleColumnsPanel={onToggleColumnsPanel}
        />
        {isFirstPageLoading && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
        {isEmptyStateVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-layer-2">
            <DialNoDataContent title={t(emptyStateTitle)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsTraceView;
