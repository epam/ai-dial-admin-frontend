'use client';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import SessionsProvenanceLine from '@/src/components/Analytics/SessionsTrace/Header/SessionsProvenanceLine';
import SessionsSummary from '@/src/components/Analytics/SessionsTrace/Header/SessionsSummary';
import SessionsList from '@/src/components/Analytics/SessionsTrace/List/SessionsList';
import SessionsToolbar from '@/src/components/Analytics/SessionsTrace/Toolbar/SessionsToolbar';
import { useSessions } from '@/src/components/Analytics/SessionsTrace/use-sessions';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { SESSIONS_HEADER_STACK_HEIGHT } from '@/src/constants/analytics/sessions-trace';
import { BasicI18nKey, SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { ReadFailure } from '@/src/models/server-action';

interface Props {
  schemaFields?: AnalyticsEntityField[] | null;
  schemaFailure?: ReadFailure | null;
}

const SessionsTraceView: FC<Props> = ({ schemaFields, schemaFailure }) => {
  const t = useI18n();
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);
  const {
    onGridReady,
    datasource,
    gridContext,
    period,
    periodLabel,
    isPeriodPending,
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
  } = useSessions(schemaFields);

  const onToggleColumnsPanel = useCallback(() => setIsColumnsPanelOpen((isOpen) => !isOpen), []);

  useReadFailureNotification(schemaFailure, SessionsTraceI18nKey.SchemaLoadFailed);

  const emptyStateTitle = hasLoadError ? SessionsTraceI18nKey.SessionsLoadFailed : SessionsTraceI18nKey.NoSessions;

  // The grid stays mounted whatever the state: under the infinite row model its datasource is attached
  // through the grid api, so unmounting it would strand the next request.
  const isEmptyStateVisible = !isFirstPageLoading && (isEmptyResult || hasLoadError);

  return (
    <div className="flex flex-col size-full bg-layer-2 rounded py-5 px-6 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-primary">{t(SessionsTraceI18nKey.Title)}</h1>
          <SessionsProvenanceLine schemaFields={schemaFields} />
        </div>
        <SessionsSummary period={period} periodLabel={periodLabel} isPending={isPeriodPending} />
      </div>
      <SessionsToolbar
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
        <SessionsList
          datasource={datasource}
          gridContext={gridContext}
          onGridReady={onGridReady}
          schemaFields={schemaFields}
          isColumnsPanelOpen={isColumnsPanelOpen}
          onToggleColumnsPanel={onToggleColumnsPanel}
        />
        {isFirstPageLoading && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
        {/* Offset below the header stack rather than covering it. A filter that matches nothing produces this
            state, and an overlay over the filter inputs would leave the operator unable to clear the filter
            that emptied the grid — the sort, filter and column controls all live in the rows above. */}
        {isEmptyStateVisible && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-layer-2"
            style={{ top: SESSIONS_HEADER_STACK_HEIGHT }}
          >
            <DialNoDataContent title={t(emptyStateTitle)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsTraceView;
