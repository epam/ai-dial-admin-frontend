'use client';
import { FC, ReactNode } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import { AlertVariant, DialAlert, DialLoader, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';

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

  return (
    <>
      <DialAlert
        message={
          isMcp
            ? (response as Record<string, unknown>).isError
              ? t(TestSuitesI18nKey.ToolCallFailed)
              : t(TestSuitesI18nKey.ToolCallSucceeded)
            : `${response.statusCode}`
        }
        variant={
          isMcp
            ? (response as Record<string, unknown>).isError
              ? AlertVariant.Error
              : AlertVariant.Success
            : response.statusCode >= 200 && response.statusCode < 300
              ? AlertVariant.Success
              : AlertVariant.Error
        }
      >
        {grafanaTraceUrl && (
          <DialNeutralButton
            size={ElementSize.Small}
            className="w-fit"
            iconBefore={<Grafana />}
            label={t(RunsI18nKey.GrafanaRun)}
            onClick={() => window.open(grafanaTraceUrl, '_blank')}
          />
        )}
      </DialAlert>
      <CollapsibleSection title={t(BasicI18nKey.Request)} growOnOpen>
        {isRequestSend ? (
          <DialLoader />
        ) : (
          <JsonEditor
            entity={resolvedRequest}
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
