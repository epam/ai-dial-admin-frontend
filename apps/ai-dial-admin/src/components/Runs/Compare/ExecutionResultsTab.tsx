'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { RowClassRules } from 'ag-grid-community';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import CompareDiffLegend from '@/src/components/Runs/Compare/CompareDiffLegend';
import GridView from '@/src/components/Grid/GridView/GridView';
import { compareGridOptions } from '@/src/components/Runs/Compare/constants';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { getCompareColumnsCompare } from '@/src/components/Runs/Compare/utils';
import { mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
}

const FAILED_EXECUTION_STATUSES = new Set<ExtractionResultStatus>([
  ExtractionResultStatus.FAILED,
  ExtractionResultStatus.ERROR,
]);

const isFailedExecution = (status?: ExtractionResultStatus) => status != null && FAILED_EXECUTION_STATUSES.has(status);

const ExecutionResultsTab: FC<Props> = ({ primaryRunId, comparedRunId }) => {
  const t = useI18n();

  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [comparedResults, setComparedResults] = useState<AnalyticsResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const errorText = t(RunsI18nKey.MetricFailedText);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setHasLoadError(false);
    setResults(null);

    getRun(primaryRunId)
      .then((runData) => {
        if (isCancelled) return;
        if (!runData) {
          setHasLoadError(true);
          return;
        }
        return getTestCaseRunResults(RESULT_FILTERS(runData));
      })
      .then((resultsResponse) => {
        if (isCancelled || resultsResponse === undefined) return;
        setResults(resultsResponse?.content || []);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [primaryRunId]);

  useEffect(() => {
    let isCancelled = false;

    setIsCompareLoading(true);
    setComparedResults(null);

    getRun(comparedRunId)
      .then((comparedRun) => {
        if (isCancelled || !comparedRun) return;
        return getTestCaseRunResults(RESULT_FILTERS(comparedRun));
      })
      .then((res) => {
        if (isCancelled || res === undefined) return;
        setComparedResults(res?.content || []);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCompareLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [comparedRunId]);

  const mergedRowData = useMemo(() => {
    if (results === null || comparedResults === null) return null;
    return mergeByTestCaseId(results, comparedResults);
  }, [results, comparedResults]);

  const columnDefs = useMemo(() => {
    if (results === null || comparedResults === null) return [];
    return getCompareColumnsCompare(
      mergeByTestCaseId(results, comparedResults),
      errorText,
      t(RunsI18nKey.RunCompareDelta),
    );
  }, [results, comparedResults, errorText, t]);

  const rowClassRules = useMemo<RowClassRules<CompareAnalyticsRow>>(
    () => ({
      'compare-row-failed': (params) =>
        isFailedExecution(params.data?.executionStatus) || isFailedExecution(params.data?._compared?.executionStatus),
    }),
    [],
  );

  const gridOptions = useMemo(
    () => ({
      ...compareGridOptions,
      rowHeight: 40,
      rowClassRules,
    }),
    [rowClassRules],
  );

  const isCompareDataReady = results !== null && comparedResults !== null;

  if (hasLoadError) {
    return <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>;
  }

  if (isLoading || isCompareLoading || !isCompareDataReady) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <GridView
          key={`${primaryRunId}-${comparedRunId}`}
          columnDefs={columnDefs}
          rowData={mergedRowData}
          additionalGridOptions={gridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
        />
      </div>
      <CompareDiffLegend rows={mergedRowData ?? []} />
    </div>
  );
};

export default ExecutionResultsTab;
