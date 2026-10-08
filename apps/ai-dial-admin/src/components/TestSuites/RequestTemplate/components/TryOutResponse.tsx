'use client';
import { FC, ReactNode, useMemo } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import {
  NotificationVariant,
  DialNotification,
  DialLoader,
  DialNeutralButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { BasicI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCaseSchema, TestSuite, TryOutCoreResponse, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  groupTryOutSections,
  shouldShowTurnLabels,
} from '@/src/utils/evaluation/tryout-sections';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  response: TryOutCoreResponse;
  resolvedRequest: Record<string, unknown>;
  history?: TryOutHistoryEntry[];
  grafanaTraceUrl?: string;
  isRequestSend?: boolean;
  responseBody: ReactNode;
  isMcp?: boolean;
  testSuite?: TestSuite;
  schema?: TestCaseSchema[];
  multiTurnData?: Record<string, unknown>[];
  selectedRequestIndex?: number;
}

const JsonCollapsible: FC<{
  title: string;
  entity: object | null | undefined;
  isLoading?: boolean;
  wordWrap?: 'off' | 'bounded';
  growOnOpen?: boolean;
}> = ({ title, entity, isLoading, wordWrap = 'bounded', growOnOpen = true }) => {
  const copyText = useMemo(() => (entity ? JSON.stringify(entity, null, 2) : ''), [entity]);

  return (
    <CollapsibleSection
      title={title}
      fullViewContent={copyText}
      headerIcon={<CopyButton value={copyText} valueLabel={title} />}
      growOnOpen={growOnOpen}
    >
      {isLoading ? (
        <DialLoader />
      ) : (
        <div className={growOnOpen ? 'min-h-0 flex-1' : 'h-64'}>
          <JsonEditor
            entity={entity ?? null}
            options={{ stickyScroll: { enabled: false }, wordWrap }}
            readonly={true}
          />
        </div>
      )}
    </CollapsibleSection>
  );
};

const HistoryEntryPair: FC<{
  entry: TryOutHistoryEntry;
  isRequestSend?: boolean;
  sectionTitle?: string;
}> = ({ entry, isRequestSend, sectionTitle }) => {
  const t = useI18n();
  const turnRequestBody = (entry.resolvedRequest?.body as object) ?? {};
  const turnResponseBody = entry.response?.body as object | undefined;

  return (
    <div className="flex flex-col gap-y-4 shrink-0">
      {sectionTitle ? <h2 className="dial-small-text font-semibold">{sectionTitle}</h2> : null}
      <JsonCollapsible
        title={t(BasicI18nKey.Request)}
        entity={turnRequestBody}
        isLoading={isRequestSend}
        growOnOpen={false}
      />
      <JsonCollapsible
        title={t(BasicI18nKey.Response)}
        entity={turnResponseBody}
        isLoading={isRequestSend}
        wordWrap="off"
        growOnOpen={false}
      />
    </div>
  );
};

const TryOutResponsePreview: FC<Props> = ({
  response,
  resolvedRequest,
  history,
  grafanaTraceUrl,
  isRequestSend,
  responseBody,
  isMcp,
  testSuite,
  schema,
  multiTurnData,
  selectedRequestIndex = 0,
}) => {
  const t = useI18n();
  const requestBody = resolvedRequest.body as object;

  const turnCounts = useMemo(
    () => (testSuite ? getRequestTurnCounts(testSuite, schema, multiTurnData?.length ?? 0) : [history?.length ?? 1]),
    [testSuite, schema, multiTurnData, history],
  );

  const shape = useMemo(() => getTryOutSectionShape(turnCounts), [turnCounts]);
  const groups = useMemo(
    () => (history && history.length > 0 ? groupTryOutSections(history, turnCounts) : []),
    [history, turnCounts],
  );

  // Multi-request / multi-turn history owns the body UI. A missing group (skipped after fail-fast)
  // must stay empty — never fall through to the top-level last-invocation pair (issue #4720).
  const usesHistorySections = !!(history?.length && shape !== 'single');

  // Status banner must follow the selected request tab, not the suite-level last invocation
  // (which is what made chat show a red "0" after a later request failed).
  const selectedHistoryGroup =
    usesHistorySections && (shape === 'requests' || shape === 'combined')
      ? groups.find((item) => item.requestIndex === selectedRequestIndex)
      : undefined;
  const isSelectedRequestSkipped =
    usesHistorySections && (shape === 'requests' || shape === 'combined') && !selectedHistoryGroup;
  const selectedEntry = selectedHistoryGroup?.turns.at(-1)?.item;
  const bannerResponse = selectedEntry?.response ?? response;
  const bannerGrafanaUrl = selectedEntry?.grafanaTraceUrl ?? grafanaTraceUrl;

  const isError = isMcp
    ? (bannerResponse as Record<string, unknown>).isError
    : !(bannerResponse.statusCode >= 200 && bannerResponse.statusCode < 300);
  const alertMessage = isMcp
    ? isError
      ? t(TestSuitesI18nKey.ToolCallFailed)
      : t(TestSuitesI18nKey.ToolCallSucceeded)
    : `${bannerResponse.statusCode}`;
  const alertVariant = isError ? NotificationVariant.Error : NotificationVariant.Success;

  const historyContent = useMemo(() => {
    if (!usesHistorySections) {
      return null;
    }

    if (shape === 'turns') {
      return groups.flatMap((group) =>
        group.turns.map(({ turnIndex, item }) => (
          <HistoryEntryPair
            key={`t-${group.requestIndex}-${turnIndex}`}
            entry={item}
            isRequestSend={isRequestSend}
            sectionTitle={t(TestSuitesI18nKey.TurnLabel, { index: turnIndex + 1 })}
          />
        )),
      );
    }

    if (shape === 'requests' || shape === 'combined') {
      const group = groups.find((item) => item.requestIndex === selectedRequestIndex);
      if (!group) {
        return null;
      }

      const showTurnLabels = shouldShowTurnLabels(group, turnCounts);

      return group.turns.map(({ turnIndex, item }) => (
        <HistoryEntryPair
          key={`${shape}-${group.requestIndex}-${turnIndex}`}
          entry={item}
          isRequestSend={isRequestSend}
          sectionTitle={showTurnLabels ? t(TestSuitesI18nKey.TurnLabel, { index: turnIndex + 1 }) : undefined}
        />
      ));
    }

    return null;
  }, [usesHistorySections, shape, groups, turnCounts, isRequestSend, t, selectedRequestIndex]);

  return (
    <>
      {isSelectedRequestSkipped ? null : (
        <DialNotification message={alertMessage} variant={alertVariant}>
          {bannerGrafanaUrl && (
            <DialNeutralButton
              size={ElementSize.Small}
              className="w-fit"
              iconBefore={<Grafana />}
              label={t(RunsI18nKey.GrafanaRun)}
              onClick={() => window.open(bannerGrafanaUrl, '_blank')}
            />
          )}
        </DialNotification>
      )}

      {usesHistorySections ? (
        historyContent
      ) : (
        <>
          <JsonCollapsible title={t(BasicI18nKey.Request)} entity={requestBody} isLoading={isRequestSend} />
          {responseBody}
        </>
      )}
    </>
  );
};

export default TryOutResponsePreview;
