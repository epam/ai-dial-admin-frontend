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
import { TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  groupTryOutSections,
  shouldShowTurnLabels,
} from '@/src/utils/evaluation/tryout-sections';
import CollapsibleSection from './CollapsibleSection';
import { TryOutResponse } from './TryOut';

interface Props {
  response: TryOutResponse;
  resolvedRequest: Record<string, unknown>;
  history?: TryOutHistoryEntry[];
  grafanaTraceUrl?: string;
  isRequestSend?: boolean;
  responseBody: ReactNode;
  isMcp?: boolean;
  testSuite?: TestSuite;
  schema?: TestCaseSchema[];
  multiTurnData?: Record<string, unknown>[];
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
  const turnResponseBody = (entry.response as { body?: object })?.body as object | undefined;

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
}) => {
  const t = useI18n();
  const requestBody = resolvedRequest.body as object;
  const isError = isMcp
    ? (response as Record<string, unknown>).isError
    : !(response.statusCode >= 200 && response.statusCode < 300);
  const alertMessage = isMcp
    ? isError
      ? t(TestSuitesI18nKey.ToolCallFailed)
      : t(TestSuitesI18nKey.ToolCallSucceeded)
    : `${response.statusCode}`;
  const alertVariant = isError ? NotificationVariant.Error : NotificationVariant.Success;

  const turnCounts = useMemo(
    () => (testSuite ? getRequestTurnCounts(testSuite, schema, multiTurnData?.length ?? 0) : [history?.length ?? 1]),
    [testSuite, schema, multiTurnData, history],
  );

  const shape = useMemo(() => getTryOutSectionShape(turnCounts), [turnCounts]);
  const groups = useMemo(
    () => (history && history.length > 0 ? groupTryOutSections(history, turnCounts) : []),
    [history, turnCounts],
  );

  const historyContent = useMemo(() => {
    if (!history?.length || shape === 'single') {
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

    if (shape === 'requests') {
      return groups.flatMap((group) =>
        group.turns.map(({ turnIndex, item }) => (
          <HistoryEntryPair
            key={`r-${group.requestIndex}-${turnIndex}`}
            entry={item}
            isRequestSend={isRequestSend}
            sectionTitle={t(TestSuitesI18nKey.RequestLabel, { index: group.requestIndex + 1 })}
          />
        )),
      );
    }

    return groups.map((group) => {
      const requestTitle = t(TestSuitesI18nKey.RequestLabel, { index: group.requestIndex + 1 });
      const showTurnLabels = shouldShowTurnLabels(group, turnCounts);

      return (
        <CollapsibleSection key={`req-${group.requestIndex}`} title={requestTitle} defaultOpen growOnOpen={false}>
          {group.turns.map(({ turnIndex, item }) => (
            <HistoryEntryPair
              key={`c-${group.requestIndex}-${turnIndex}`}
              entry={item}
              isRequestSend={isRequestSend}
              sectionTitle={showTurnLabels ? t(TestSuitesI18nKey.TurnLabel, { index: turnIndex + 1 }) : undefined}
            />
          ))}
        </CollapsibleSection>
      );
    });
  }, [history, shape, groups, turnCounts, isRequestSend, t]);

  return (
    <>
      <DialNotification message={alertMessage} variant={alertVariant}>
        {grafanaTraceUrl && (
          <DialNeutralButton
            size={ElementSize.Small}
            className="w-fit"
            iconBefore={<Grafana />}
            label={t(RunsI18nKey.GrafanaRun)}
            onClick={() => window.open(grafanaTraceUrl, '_blank')}
          />
        )}
      </DialNotification>

      {historyContent ?? (
        <>
          <JsonCollapsible title={t(BasicI18nKey.Request)} entity={requestBody} isLoading={isRequestSend} />
          {responseBody}
        </>
      )}
    </>
  );
};

export default TryOutResponsePreview;
