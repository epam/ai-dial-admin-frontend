'use client';

import { FC, useMemo, useState } from 'react';

import { DialCloseButton, DialLinkButton, DialSwitch } from '@epam/ai-dial-ui-kit';

import Grafana from '@/public/images/icons/grafana.svg';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import {
  getDetailEntries,
  getFormattedDuration,
  getPanelTitle,
  getTestCaseStatusClass,
} from '@/src/components/Runs/View/utils';
import { BasicI18nKey, EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExtractionResult } from '@/src/models/evaluation/run';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import DetailRequestAccordion from './DetailRequestAccordion';
import DetailSection from './DetailSection';

interface Props {
  result: ExtractionResult;
  grafanaExploreUrl?: string;
  onClose: () => void;
}

const RunResultDetailPanel: FC<Props> = ({ result, grafanaExploreUrl, onClose }) => {
  const t = useI18n();

  const [isJsonView, setIsJsonView] = useState(false);
  const exploreUrl = result.grafanaExploreUrl ?? grafanaExploreUrl;

  const executionEntries: Array<[string, string]> = [
    ['Status', result.executionInfo?.status || '—'],
    ['HTTP', String(result.responseStatusCode ?? '—')],
    ['Duration', getFormattedDuration(result.executionInfo?.durationMs)],
    ['Started', result.executionInfo?.startedAt ? formatDateTimeToLocalString(result.executionInfo?.startedAt) : '—'],
  ];

  const testCaseEntries = useMemo(() => {
    const testCaseData = result.testCaseData ?? {};
    return getDetailEntries(testCaseData);
  }, [result.testCaseData]);

  const requestJson = result.requestBody != null ? JSON.stringify(result.requestBody, null, 2) : '—';
  const responseJson = result.responseBody != null ? JSON.stringify(result.responseBody, null, 2) : '—';

  const title = useMemo(() => getPanelTitle(result), [result]);

  return (
    <div className="flex flex-col size-full pb-2">
      <div className="flex items-start justify-between">
        <h1 className="truncate">{title}</h1>
        <div className="flex flex-row gap-4 items-center">
          <DialSwitch
            isOn={isJsonView}
            label={t(EntitiesI18nKey.JSONViewer)}
            switchId="jsonViewer"
            onChange={() => setIsJsonView(!isJsonView)}
          />
          <DialCloseButton onClose={onClose} />
        </div>
      </div>

      {isJsonView ? (
        <JsonEditor entity={result} options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }} readonly={true} />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 mt-4 pr-2">
          <DetailSection
            title={t(RunsI18nKey.Execution)}
            list={executionEntries}
            getValueClassName={(key) =>
              key === 'Status' ? getTestCaseStatusClass(result.responseStatusCode) : undefined
            }
          >
            {exploreUrl && (
              <DialLinkButton
                className="w-fit mt-3"
                iconBefore={<Grafana />}
                label={t(RunsI18nKey.GrafanaDetails)}
                onClick={() => window.open(exploreUrl, '_blank')}
              />
            )}
          </DetailSection>
          {testCaseEntries.length > 0 && <DetailSection title={t(RunsI18nKey.TestCaseData)} list={testCaseEntries} />}
          {<DetailRequestAccordion title={t(BasicI18nKey.Request)} content={requestJson} />}
          {<DetailRequestAccordion title={t(BasicI18nKey.Response)} content={responseJson} />}
        </div>
      )}
    </div>
  );
};

export default RunResultDetailPanel;
