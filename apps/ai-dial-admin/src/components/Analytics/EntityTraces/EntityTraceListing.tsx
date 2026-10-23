'use client';

import { LinkButton, Spinner, OutlinedButton } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle, IconRefresh, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import { useEntityTraces } from '@/src/components/Analytics/EntityTraces/use-entity-traces';
import { useHopBodyGrants } from '@/src/components/Analytics/EntityTraces/use-hop-body-grants';
import SessionTraceList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceList';
import SessionTraceView from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceView';
import { useSessionTrace } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-trace';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { useAnalyticsAccess } from '@/src/components/Analytics/Usage/use-analytics-access';
import { getEntityDeploymentName } from '@/src/components/Analytics/Usage/utils/entity-scope';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import Page403 from '@/src/components/Page403/Page403';
import { EMPTY_ICON_SIZE } from '@/src/constants/analytics/sessions-trace';
import { BasicI18nKey, ButtonsI18nKey, EntityTracesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import { SessionTraceCard, SessionTraceGroup } from '@/src/models/analytics/sessions-trace';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { TimeFilterValue } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { asTraceFigures, traceCardTitle } from '@/src/utils/analytics/session-trace-groups';
import { traceDurationMsOf } from '@/src/utils/analytics/session-spans';

interface Props {
  route: ApplicationRoute;
  entity: BaseEntity;
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

/**
 * An entity's Audit `Traces` tab over the usage log: the calls made to the entity, newest first, each opening
 * into its whole trace with that call selected.
 */
const EntityTraceListing: FC<Props> = ({ route, entity, defaultTimeFilter, onTimeFilterChange }) => {
  const t = useI18n();
  const isForbidden = useAnalyticsAccess();
  const entityName = useMemo(() => getEntityDeploymentName(route, entity), [route, entity]);
  const bodyGrants = useHopBodyGrants();

  const { timePeriod, timeRange, isCustom, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
    defaultTimeFilter,
    onTimeFilterChange,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  const { groups, hasMore, isLoading, hasLoadError, isRefused, onLoadMore, onRetry } = useEntityTraces({
    route,
    entityName,
    timeRange,
    refreshToken,
    isEnabled: isForbidden === false && entityName !== null,
  });
  const {
    trace,
    isLoading: isTraceLoading,
    selectedSpanId,
    onSelectSpan,
    onOpenTrace,
    onCloseTrace,
  } = useSessionTrace();

  // The trace header states the trace's own figures. The card's duration is one call's — for an entity that is one
  // hop of many — so the trace's is measured from its spans instead, to sit beside its own tokens and cost.
  const openedFigures = useMemo(
    () => (trace ? { ...trace.figures, durationMs: traceDurationMsOf(trace.spans) } : null),
    [trace],
  );

  // A preset is recomputed against "now", so Refresh moves the period forward as well as re-reading it.
  const onRefresh = useCallback(() => {
    if (!isCustom && timePeriod) {
      onTimePeriodChange(timePeriod);
    }
    setRefreshToken((token) => token + 1);
  }, [isCustom, timePeriod, onTimePeriodChange]);

  const onOpenCard = useCallback(
    (group: SessionTraceGroup, card?: SessionTraceCard) =>
      void onOpenTrace(
        asTraceFigures(group, card),
        card ? traceCardTitle(card, group.traceId) : group.traceId,
        card?.coreSpanId,
      ),
    [onOpenTrace],
  );

  if (isForbidden == null) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner size={18} fullWidth />
      </div>
    );
  }

  if (isForbidden || isRefused) {
    return <Page403 />;
  }

  if (!entityName) {
    return (
      <UsageEmptyState
        className="size-full"
        title={t(EntityTracesI18nKey.UnmatchedTitle)}
        lines={[t(EntityTracesI18nKey.UnmatchedHint)]}
      />
    );
  }

  const isEmpty = !groups.length && !isLoading;
  const isTraceOpen = trace !== null;
  // Neither an empty period nor a failed read leaves other persistent confirmation, so both are announced.
  let statusMessage = '';
  if (isEmpty) {
    statusMessage = t(hasLoadError ? EntityTracesI18nKey.LoadFailedTitle : EntityTracesI18nKey.EmptyTitle);
  } else if (hasLoadError) {
    statusMessage = t(EntityTracesI18nKey.PageLoadFailed);
  }

  // The entity dashboard's empty state, so the Audit tab's two usage-log tabs read alike when they have nothing.
  const emptyState = (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-layer-1 p-6">
      <UsageEmptyState
        className="max-w-[520px]"
        figure={
          hasLoadError ? (
            <IconAlertTriangle size={EMPTY_ICON_SIZE} aria-hidden className="text-error" />
          ) : (
            <IconSubtask size={EMPTY_ICON_SIZE} aria-hidden className="text-secondary" />
          )
        }
        title={t(hasLoadError ? EntityTracesI18nKey.LoadFailedTitle : EntityTracesI18nKey.EmptyTitle)}
        lines={[t(hasLoadError ? EntityTracesI18nKey.LoadFailedHint : EntityTracesI18nKey.EmptyHint)]}
      />
      {hasLoadError && <OutlinedButton label={t(EntityTracesI18nKey.Retry)} onClick={onRetry} />}
    </div>
  );

  return (
    <div className="relative flex size-full min-w-0 flex-col">
      {trace && openedFigures && (
        <SessionTraceView
          readKey={entityName}
          figures={openedFigures}
          title={trace.title}
          spans={trace.spans}
          fieldGroups={trace.fieldGroups}
          bodyGrants={bodyGrants}
          hasLoadError={trace.hasLoadError}
          selectedSpanId={selectedSpanId}
          onSelectSpan={onSelectSpan}
          onClose={onCloseTrace}
        />
      )}
      {/* Kept mounted while a trace is open, so returning finds the pages already loaded where they were. */}
      <div
        className={classNames('flex min-h-0 flex-1 flex-col', isTraceOpen && 'hidden')}
        inert={isTraceLoading || isTraceOpen}
      >
        <div className="mb-4 flex h-[40px] items-center justify-between gap-4">
          <TimeFilter
            timePeriod={timePeriod}
            onTimePeriodChange={onTimePeriodChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
          <OutlinedButton
            label={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onRefresh}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded border border-primary">
          {isEmpty ? (
            emptyState
          ) : (
            <SessionTraceList
              groups={groups}
              title={t(EntityTracesI18nKey.Title)}
              rule={t(EntityTracesI18nKey.Rule)}
              isCardTheRoot={false}
              hasMore={hasMore}
              isLoading={isLoading}
              hasLoadError={false}
              onLoadMore={onLoadMore}
              onOpenTrace={onOpenCard}
            />
          )}
          {!isEmpty && hasLoadError && (
            <div className="flex items-center justify-center gap-3 border-t border-primary p-2">
              <span className="text-error dial-small-text">{t(EntityTracesI18nKey.PageLoadFailed)}</span>
              <LinkButton label={t(EntityTracesI18nKey.Retry)} onClick={onRetry} />
            </div>
          )}
        </div>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
      {isTraceLoading && !isTraceOpen && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default EntityTraceListing;
