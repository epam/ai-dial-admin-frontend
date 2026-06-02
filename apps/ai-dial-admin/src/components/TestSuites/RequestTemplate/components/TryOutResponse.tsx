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
import CollapsibleSection from './CollapsibleSection';
import { TryOutResponse } from './TryOut';

interface Props {
  response: TryOutResponse;
  resolvedRequest: Record<string, unknown>;
  grafanaTraceUrl?: string;
  isRequestSend?: boolean;
  responseBody: ReactNode;
  isMcp?: boolean;
}

const TryOutResponsePreview: FC<Props> = ({
  response,
  resolvedRequest,
  grafanaTraceUrl,
  isRequestSend,
  responseBody,
  isMcp,
}) => {
  const t = useI18n();
  const requestBody = resolvedRequest.body as object;
  const requestBodyCopyText = useMemo(() => (requestBody ? JSON.stringify(requestBody, null, 2) : ''), [requestBody]);
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

      {/* todo: possible change this component to codeViewer */}
      <CollapsibleSection
        title={t(BasicI18nKey.Request)}
        fullViewContent={JSON.stringify(requestBody, null, 2)}
        headerIcon={<CopyButton value={requestBodyCopyText} valueLabel={t(BasicI18nKey.Request)} />}
        growOnOpen
      >
        {isRequestSend ? (
          <DialLoader />
        ) : (
          <JsonEditor
            entity={requestBody}
            options={{ stickyScroll: { enabled: false }, wordWrap: 'bounded' }}
            readonly={true}
          />
        )}
      </CollapsibleSection>
      {responseBody}
    </>
  );
};

export default TryOutResponsePreview;
