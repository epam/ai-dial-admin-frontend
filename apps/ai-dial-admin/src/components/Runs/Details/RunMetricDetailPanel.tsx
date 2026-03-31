'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCloseButton, DialLoader, DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { getDetailEntries, getMetricGroups, getPanelTitle } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import AdaptiveValueGrid from './AdaptiveValueGrid';
import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import ExecutionStatusBar from './ExecutionStatusBar';
import { FullscreenViewerProvider } from '@/src/context/FullscreenViewerContext';
import MetricCardsGrid from './MetricCardsGrid';
import MetricInfoPanel from './MetricInfoPanel';

interface Props {
  resultId: string;
  onClose: () => void;
}

const RunMetricDetailPanel: FC<Props> = ({ resultId, onClose }) => {
  const t = useI18n();

  const [isJsonView, setIsJsonView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<AnalyticsResult | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<{ group: string; key: string } | null>(null);

  const title = useMemo(() => (isLoading ? null : getPanelTitle(details)), [details, isLoading]);

  const testCaseEntries = useMemo(() => {
    return getDetailEntries(details?.testCaseData ?? {});
  }, [details?.testCaseData]);

  const metricGroups = useMemo(() => {
    return getMetricGroups(details?.metricValues, details?.metricInfos);
  }, [details?.metricValues, details?.metricInfos]);

  const requestJson = details?.requestBody != null ? JSON.stringify(details.requestBody) : null;
  const responseJson = details?.responseBody != null ? JSON.stringify(details.responseBody) : null;

  const toggleMetricSelection = useCallback((group: string, key: string) => {
    setSelectedMetric((prev) => (prev?.group === group && prev?.key === key ? null : { group, key }));
  }, []);

  useEffect(() => {
    if (!resultId) return;
    setIsLoading(true);
    getTestCaseRunResultDetails(resultId).then((res) => {
      setDetails(res);
      setIsLoading(false);
    });
  }, [resultId]);

  return (
    <FullscreenViewerProvider>
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
          <JsonEditor
            entity={details}
            options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }}
            readonly={true}
          />
        ) : (
          <>
            {isLoading ? (
              <DialLoader size={40} />
            ) : (
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 mt-4 pr-2">
                <ExecutionStatusBar
                  status={details?.executionStatus}
                  httpCode={details?.responseStatusCode}
                  durationMs={details?.execDurationMs}
                  timestamp={details?.computedAt}
                  timestampLabel={t(RunsI18nKey.Computed)}
                />
                {testCaseEntries.length > 0 && (
                  <AdaptiveValueGrid title={t(RunsI18nKey.TestCaseData)} entries={testCaseEntries} />
                )}
                {metricGroups.map((group) => (
                  <section key={group.title} className="flex flex-col gap-1.5">
                    <div
                      className={classNames(
                        'flex items-center gap-1.5 text-xs font-semibold',
                        group.hasError && 'text-error',
                      )}
                    >
                      {group.title}
                      <span className={classNames('flex-1 h-px', group.hasError ? 'bg-error' : 'bg-tertiary')} />
                    </div>
                    <MetricCardsGrid
                      group={group}
                      selectedMetricKey={selectedMetric?.group === group.title ? selectedMetric.key : undefined}
                      onMetricClick={(key) => toggleMetricSelection(group.title, key)}
                    />
                    {group.hasError && group.errorMessage && (
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 text-[11px] mt-1">
                        <span className="text-error">error</span>
                        <span className="text-error break-words">{group.errorMessage}</span>
                      </div>
                    )}
                    {selectedMetric?.group === group.title && !!group.infos?.[selectedMetric.key] && (
                      <MetricInfoPanel infos={{ [selectedMetric.key]: group.infos[selectedMetric.key] }} />
                    )}
                  </section>
                ))}
                {requestJson && <CodeViewer title={t(RunsI18nKey.Request)} content={requestJson} />}
                {responseJson && <CodeViewer title={t(RunsI18nKey.Response)} content={responseJson} />}
              </div>
            )}
          </>
        )}
      </div>
    </FullscreenViewerProvider>
  );
};

export default RunMetricDetailPanel;
