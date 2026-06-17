'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { DialGhostIconButton, DialLoader, DialSwitch, ElementSize } from '@epam/ai-dial-ui-kit';

import SidePanel from '@/src/components/Common/SidePanel/SidePanel';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { getDetailEntries, getMetricGroups, getPanelTitle } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBindings } from '@/src/models/evaluation/metric';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import AdaptiveValueGrid from './AdaptiveValueGrid';
import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import ExecutionStatusBar from './ExecutionStatusBar';
import MetricGroup from './MetricGroup';
import { IconLayoutBottombar } from '@tabler/icons-react';

interface Props {
  resultId: string;
  grafanaTraceUrl?: string;
  onClose: () => void;
  metricBindings?: Record<string, MetricBindings>;
  onSwitchMode?: () => void;
}

const RunMetricDetailPanel: FC<Props> = ({ resultId, grafanaTraceUrl, onClose, metricBindings, onSwitchMode }) => {
  const t = useI18n();

  const [isJsonView, setIsJsonView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<AnalyticsResult | null>(null);

  const grafanaUrl = details?.grafanaTraceUrl ?? grafanaTraceUrl;
  const title = useMemo(() => (isLoading ? null : getPanelTitle(details)), [details, isLoading]);

  const testCaseEntries = useMemo(() => {
    return getDetailEntries(details?.testCaseData ?? {});
  }, [details?.testCaseData]);

  const extractedColumnsEntries = useMemo(() => {
    return getDetailEntries(details?.extractedColumns ?? {});
  }, [details?.extractedColumns]);

  const metricGroups = useMemo(() => {
    return getMetricGroups(details?.metricValues, details?.metricInfos);
  }, [details?.metricValues, details?.metricInfos]);

  const requestJson = details?.requestBody != null ? JSON.stringify(details.requestBody) : null;
  const responseJson = details?.responseBody != null ? JSON.stringify(details.responseBody) : null;

  useEffect(() => {
    if (!resultId) return;
    setIsLoading(true);
    getTestCaseRunResultDetails(resultId).then((res) => {
      setDetails(res);
      setIsLoading(false);
    });
  }, [resultId]);

  return (
    <SidePanel
      label={<h1 className="truncate">{title}</h1>}
      isOpen={true}
      onClose={onClose}
      className="lg:w-full w-full"
    >
      <div className="flex flex-row gap-4 items-center justify-end mb-2">
        <DialSwitch
          isOn={isJsonView}
          label={t(EntitiesI18nKey.JSONViewer)}
          switchId="jsonViewer"
          onChange={() => setIsJsonView(!isJsonView)}
        />
        {onSwitchMode && (
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconLayoutBottombar size={16} />}
            onClick={onSwitchMode}
            title={t(RunsI18nKey.SwitchToDrawer)}
          />
        )}
      </div>

      {isJsonView ? (
        <JsonEditor entity={details} options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }} readonly={true} />
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
                grafanaUrl={grafanaUrl}
              />
              {testCaseEntries.length > 0 && (
                <AdaptiveValueGrid title={t(RunsI18nKey.TestCaseData)} entries={testCaseEntries} />
              )}
              {extractedColumnsEntries.length > 0 && (
                <AdaptiveValueGrid title={t(RunsI18nKey.ExtractedColumns)} entries={extractedColumnsEntries} />
              )}
              {metricGroups.map((group) => {
                const bindings = metricBindings?.[group.title];
                return (
                  <MetricGroup
                    key={group.title}
                    group={group}
                    configBindings={bindings?.configBindings}
                    inputBindings={bindings?.inputBindings}
                  />
                );
              })}
              {requestJson && <CodeViewer title={t(RunsI18nKey.Request)} content={requestJson} />}
              {responseJson && <CodeViewer title={t(RunsI18nKey.Response)} content={responseJson} />}
            </div>
          )}
        </>
      )}
    </SidePanel>
  );
};

export default RunMetricDetailPanel;
