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
import { TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
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

const TryOutResponsePreview: FC<Props> = ({
  response,
  resolvedRequest,
  history,
  grafanaTraceUrl,
  isRequestSend,
  responseBody,
  isMcp,
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

      {history && history.length > 0 ? (
        history.map((entry, index) => {
          const turnRequestBody = (entry.resolvedRequest?.body as object) ?? {};
          const turnResponseBody = (entry.response as { body?: object })?.body as object | undefined;
          const turnTitle = t(TestSuitesI18nKey.TurnLabel, { index: index + 1 });

          return (
            <div key={index} className="flex flex-col gap-y-4 shrink-0">
              <h2 className="dial-small-text font-semibold">{turnTitle}</h2>
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
        })
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
