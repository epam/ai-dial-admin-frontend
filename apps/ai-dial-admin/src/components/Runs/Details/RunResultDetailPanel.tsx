'use client';

import { FC, useMemo, useState } from 'react';

import { DialCloseButton, DialSwitch } from '@epam/ai-dial-ui-kit';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { getDetailEntries, getPanelTitle } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExtractionResult } from '@/src/models/evaluation/run';

import AdaptiveValueGrid from './AdaptiveValueGrid';
import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import ExecutionStatusBar from './ExecutionStatusBar';

interface Props {
  result: ExtractionResult;
  grafanaExploreUrl?: string;
  onClose: () => void;
}

const RunResultDetailPanel: FC<Props> = ({ result, grafanaExploreUrl, onClose }) => {
  const t = useI18n();
  const [isJsonView, setIsJsonView] = useState(false);

  const grafanaUrl = result.grafanaExploreUrl ?? grafanaExploreUrl;
  const title = useMemo(() => getPanelTitle(result), [result]);

  const testCaseEntries = useMemo(() => {
    return getDetailEntries(result.testCaseData ?? {});
  }, [result.testCaseData]);

  const extractedColumnsEntries = useMemo(() => {
    return getDetailEntries(result.extractedColumns ?? {});
  }, [result.extractedColumns]);

  const requestJson = result.requestBody != null ? JSON.stringify(result.requestBody) : null;
  const responseJson = result.responseBody != null ? JSON.stringify(result.responseBody) : null;

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
          <ExecutionStatusBar
            status={result.executionInfo?.status}
            httpCode={result.responseStatusCode}
            durationMs={result.executionInfo?.durationMs}
            timestamp={result.executionInfo?.startedAt}
            timestampLabel="Started"
            grafanaUrl={grafanaUrl}
          />
          {testCaseEntries.length > 0 && (
            <AdaptiveValueGrid title={t(RunsI18nKey.TestCaseData)} entries={testCaseEntries} />
          )}
          {extractedColumnsEntries.length > 0 && (
            <AdaptiveValueGrid title={t(RunsI18nKey.ExtractedColumns)} entries={extractedColumnsEntries} />
          )}
          {requestJson && <CodeViewer title={t(RunsI18nKey.Request)} content={requestJson} />}
          {responseJson && <CodeViewer title={t(RunsI18nKey.Response)} content={responseJson} />}
        </div>
      )}
    </div>
  );
};

export default RunResultDetailPanel;
