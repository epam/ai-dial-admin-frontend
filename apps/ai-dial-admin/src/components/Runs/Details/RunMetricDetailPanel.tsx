'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { DialCloseButton, DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import {
  getDetailEntries,
  getDetailNestedEntries,
  getFormattedDuration,
  getPanelTitle,
  getTestCaseStatusClass,
} from '@/src/components/Runs/View/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import DetailSection from './DetailSection';

interface Props {
  resultId: string;
  onClose: () => void;
}

const RunMetricDetailPanel: FC<Props> = ({ resultId, onClose }) => {
  const t = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<AnalyticsResult | null>(null);

  const title = useMemo(() => (isLoading ? null : getPanelTitle(details)), [details, isLoading]);

  const executionEntries: Array<[string, string]> = [
    ['Status', details?.executionStatus || '—'],
    ['HTTP', String(details?.responseStatusCode ?? '—')],
    ['Duration', getFormattedDuration(details?.execDurationMs)],
    ['Created', details?.createdAt ? formatDateTimeToLocalString(details?.createdAt) : '—'],
    ['Computed', details?.computedAt ? formatDateTimeToLocalString(details?.computedAt) : '—'],
  ];

  const testCaseEntries = useMemo(() => {
    const testCaseData = details?.testCaseData ?? {};
    return getDetailEntries(testCaseData);
  }, [details?.testCaseData]);

  const metricSections = useMemo(() => {
    const metrics = details?.metricValues ?? {};
    const infos = details?.metricInfos ?? {};
    return getDetailNestedEntries(metrics, infos);
  }, [details?.metricValues, details?.metricInfos]);

  useEffect(() => {
    if (!resultId) return;

    setIsLoading(true);
    getTestCaseRunResultDetails(resultId).then((res) => {
      const content = res;
      setDetails(content);
      setIsLoading(false);
    });
  }, [resultId]);

  return (
    <div className="flex flex-col size-full pb-2">
      <div className="flex items-start justify-between">
        <h1 className="truncate">{title}</h1>
        <DialCloseButton onClose={onClose} />
      </div>

      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 mt-4 pr-2">
          <DetailSection
            title={t(RunsI18nKey.Execution)}
            list={executionEntries}
            getValueClassName={(key) =>
              key === 'Status' ? getTestCaseStatusClass(details?.responseStatusCode) : undefined
            }
          ></DetailSection>
          {testCaseEntries.length > 0 && <DetailSection title={t(RunsI18nKey.TestCaseData)} list={testCaseEntries} />}
          {metricSections.map(({ title, entries }) => (
            <DetailSection
              key={title}
              title={title}
              list={entries}
              getKeyClassName={(key) => (key === 'error' ? 'text-error' : undefined)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RunMetricDetailPanel;
